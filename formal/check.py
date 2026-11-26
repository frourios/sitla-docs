# SPDX-License-Identifier: Apache-2.0
"""Run pinned TLC exhaustively; weakened guards must produce named invariants.

No third-party Python package is required. JAR downloads are hash checked.
Logs and machine-readable results stay in the ignored formal/.cache directory.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parent
MODELS = ("ConditionalPayment", "ProviderRecovery", "CollectionAuthority", "ApprovalExecution", "PublicJobRequests")
MUTANTS = (
    ("PublicJobRequests", "unsupported-job-currency", '/\\ m.currency \\in SupportedCurrencies \\* MUTATION: supported currency', '/\\ TRUE \\* MUTATION: supported currency', "JPYOnlyAdmission"),
    ("PublicJobRequests", "details-in-d1", 'desiredDueAt |-> r.desiredDueAt]\n    \\* MUTATION: projection ends here', 'desiredDueAt |-> r.desiredDueAt, details |-> r.details]\n    \\* MUTATION: projection ends here', "D1OnlyProjection"),
    ("PublicJobRequests", "expired-application", '/\\ now < ExpiresAt \\* MUTATION: fresh application expiry', '/\\ TRUE \\* MUTATION: fresh application expiry', "ApplicationBeforeExpiry"),
    ("PublicJobRequests", "trust-operator-label", '/\\ verified \\* MUTATION: independent verification', '/\\ OperatorSaysValid \\* MUTATION: independent verification', "ClientVerifiedBeforeTrust"),
    ("PublicJobRequests", "missing-work-currency", 'currency |-> c,\n                     currencyExponent |-> MinorUnit(c)] \\* MUTATION: explicit work unit', 'currency |-> "absent",\n                     currencyExponent |-> MinorUnit(c)] \\* MUTATION: explicit work unit', "MoneyUnitExplicit"),
    ("ConditionalPayment", "late-release", "/\\ now < RefundAt \\* MUTATION: deadline guard", "/\\ TRUE \\* MUTATION: deadline guard", "ReleaseBeforeDeadline"),
    ("ConditionalPayment", "missing-inspection", "/\\ inspection = TRUE \\* MUTATION: inspection guard", "/\\ TRUE \\* MUTATION: inspection guard", "ReleaseAuthorized"),
    ("ProviderRecovery", "unstable-key", '![s] = "stable"] \\* MUTATION: stable key', '![s] = FreshKey(s)] \\* MUTATION: stable key', "AtMostOneProviderEffect"),
    ("ProviderRecovery", "changed-destination", '![s] = "original"] \\* MUTATION: frozen destination', '![s] = currentDestination] \\* MUTATION: frozen destination', "FrozenDestination"),
    ("CollectionAuthority", "withdrawal-race", '/\\ grant = "active" \\* MUTATION: withdrawal barrier', '/\\ grant # "none" \\* MUTATION: withdrawal barrier', "NoReservationAfterWithdrawal"),
    ("CollectionAuthority", "budget-race", '/\\ UsedBudget + Gross <= Budget \\* MUTATION: atomic budget check', '/\\ TRUE \\* MUTATION: atomic budget check', "BudgetRespected"),
    ("ApprovalExecution", "approval-replay", '/\\ a \\notin consumed \\* MUTATION: atomic consumption', '/\\ TRUE \\* MUTATION: atomic consumption', "ApprovalAtMostOnce"),
    ("ApprovalExecution", "stale-epoch", '/\\ seenEpoch[w] = epoch \\* MUTATION: epoch barrier', '/\\ TRUE \\* MUTATION: epoch barrier', "CurrentEpochAtCommit"),
)
WITNESSES = (
    ("PublicJobRequests", "stale-cache-is-permitted", "CacheAlwaysFresh"),
    ("PublicJobRequests", "negotiated-price-may-differ", "ContractEqualsAdvertisement"),
)



def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tool_jar(path):
    lock = json.loads((ROOT / "tools.lock.json").read_text())
    jar = path or ROOT / ".cache" / "tla2tools.jar"
    if not jar.exists():
        if path:
            raise RuntimeError(f"Missing supplied JAR: {jar}")
        jar.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(lock["url"], timeout=60) as response:
            data = response.read(32 * 1024 * 1024 + 1)
        if len(data) > 32 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != lock["sha256"]:
            raise RuntimeError("TLC download hash mismatch")
        # Only publish the verified bytes; an interrupted download is never cached.
        temporary = jar.with_suffix(".tmp")
        temporary.write_bytes(data)
        temporary.replace(jar)
    if sha(jar) != lock["sha256"]:
        raise RuntimeError(f"TLC hash mismatch: {jar}")
    return jar.resolve()


def run(java, jar, module, directory, label, expected, timeout, reports):
    print(f"Checking {label}...", flush=True)
    command = [java, "-XX:+UseParallelGC", "-Xmx1g", "-cp", str(jar), "tlc2.TLC",
               "-workers", "1", "-seed", "1", "-fp", "0", "-cleanup",
               "-metadir", str(directory / "states"), "-config", f"{module}.cfg", module]
    started = time.monotonic()
    log = reports / f"{label}.log"
    try:
        result = subprocess.run(command, cwd=directory, text=True, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, timeout=timeout)
    except subprocess.TimeoutExpired as error:
        partial = error.stdout or b""
        if isinstance(partial, bytes):
            partial = partial.decode("utf-8", errors="replace")
        log.write_text(partial + f"\nTLC timed out after {timeout} seconds.\n")
        raise RuntimeError(f"TLC timeout for {label}; see {log}") from error
    output = result.stdout
    log.write_text(output)
    if expected:
        valid = result.returncode == 12 and f"Invariant {expected} is violated." in output
        valid = valid and "The behavior up to this point is:" in output
    else:
        valid = result.returncode == 0 and "Model checking completed. No error has been found." in output
        valid = valid and "distinct states found" in output
    if not valid:
        raise RuntimeError(f"Unexpected TLC result for {label} (exit {result.returncode}); see {log}\n{output[-6000:]}")
    counts = re.search(r"([\d,]+) states generated, ([\d,]+) distinct states found", output)
    item = {"check": label, "expectedViolation": expected, "exitCode": result.returncode,
            "seconds": round(time.monotonic() - started, 3),
            "sourceSha256": sha(directory / f"{module}.tla"),
            "configSha256": sha(directory / f"{module}.cfg")}
    if counts:
        item.update(generated=int(counts[1].replace(",", "")), distinct=int(counts[2].replace(",", "")))
    print(f"PASS {label}" + (f" (counterexample: {expected})" if expected else f" ({item.get('distinct')} distinct states)"), flush=True)
    return item


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jar", type=Path, help="Use the exact hash-pinned local JAR")
    parser.add_argument("--java", default=os.environ.get("JAVA", "java"))
    parser.add_argument("--timeout", type=int, default=180, help="Per-model seconds; timeouts fail")
    args = parser.parse_args()
    jar = tool_jar(args.jar)
    reports = ROOT / ".cache" / "reports"
    reports.mkdir(parents=True, exist_ok=True)
    summary = reports / "results.json"
    summary.unlink(missing_ok=True)
    for stale in reports.glob("*.log"):
        stale.unlink()
    results = []
    with tempfile.TemporaryDirectory(prefix="sitla-tlc-") as temp:
        work = Path(temp)
        for module in MODELS:
            directory = work / module
            directory.mkdir()
            for suffix in ("tla", "cfg"):
                shutil.copyfile(ROOT / f"{module}.{suffix}", directory / f"{module}.{suffix}")
            results.append(run(args.java, jar, module, directory, module, None, args.timeout, reports))
        for module, name, original, weakened, invariant in MUTANTS:
            directory = work / name
            directory.mkdir()
            source = (ROOT / f"{module}.tla").read_text()
            if source.count(original) != 1:
                raise RuntimeError(f"Mutation target must occur exactly once: {name}")
            (directory / f"{module}.tla").write_text(source.replace(original, weakened))
            # Isolate the expected invariant: a different failure is not a detection.
            config = (ROOT / f"{module}.cfg").read_text()
            config = re.sub(r"^INVARIANTS? .*$", f"INVARIANT {invariant}", config, flags=re.M)
            config = re.sub(r"^PROPERT(?:Y|IES) .*$", "", config, flags=re.M)
            (directory / f"{module}.cfg").write_text(config)
            results.append(run(args.java, jar, module, directory, name, invariant, args.timeout, reports))
        for module, name, invariant in WITNESSES:
            directory = work / name
            directory.mkdir()
            shutil.copyfile(ROOT / f"{module}.tla", directory / f"{module}.tla")
            config = (ROOT / f"{module}.cfg").read_text()
            config = re.sub(r"^INVARIANTS? .*$", f"INVARIANT {invariant}", config, flags=re.M)
            config = re.sub(r"^PROPERT(?:Y|IES) .*$", "", config, flags=re.M)
            (directory / f"{module}.cfg").write_text(config)
            results.append(run(args.java, jar, module, directory, name, invariant, args.timeout, reports))
    summary.write_text(json.dumps({"tlcSha256": sha(jar), "checks": results}, indent=2) + "\n")
    print(f"Verified {len(MODELS)} models and {len(MUTANTS)} guard-removal counterexamples and {len(WITNESSES)} permitted-behavior witnesses. Results: {summary}")


if __name__ == "__main__":
    main()
