# SPDX-License-Identifier: Apache-2.0
"""Independent unsigned request shape/semantics/projection checks, no TS imports.

Signature/root-authority/current status verification is a separate prerequisite.
These vectors make no new signature-interoperability or Worker-conformance claim.
"""
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import re
from jsonschema import Draft202012Validator

ROOT = Path(__file__).parent.parent
SCHEMA = json.loads((ROOT / 'artifacts/job-requests-v1/schemas/job-request.schema.json').read_text())
Draft202012Validator.check_schema(SCHEMA)
VALIDATOR = Draft202012Validator(SCHEMA)


def instant(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z', value):
        raise ValueError('job_time_invalid')
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as error:
        raise ValueError('job_time_invalid') from error
    normalized = dt.astimezone(timezone.utc).isoformat(timespec='milliseconds' if '.' in value else 'seconds').replace('+00:00', 'Z')
    if normalized != value:
        raise ValueError('job_time_invalid')
    return dt


def validate_claims(vc, now):
    if not VALIDATOR.is_valid(vc):
        raise ValueError('job_shape_invalid')
    if vc['@context'][0] != 'https://www.w3.org/ns/credentials/v2':
        raise ValueError('job_context_invalid')
    if vc['issuer'] != vc['credentialSubject']['id']:
        raise ValueError('job_issuer_subject_mismatch')
    start, end = instant(vc['validFrom']), instant(vc['validUntil'])
    instant(vc['credentialSubject']['claims']['desiredDueAt'])
    if not start < end or not start <= now < end:
        raise ValueError('job_not_current')


def project(vc, now):
    validate_claims(vc, now)
    claims = vc['credentialSubject']['claims']
    # Derive independently; never copy the complete subject/unknown fields.
    result = {'credentialId': vc['id'], 'requesterDid': vc['issuer'],
              'validFrom': vc['validFrom'], 'validUntil': vc['validUntil']}
    for key in ('summary', 'estimatedExpenses', 'reward', 'completionLicenses', 'desiredDueAt'):
        result[key] = copy.deepcopy(claims[key])
    return result


def verify_vectors():
    vectors = json.loads((ROOT / 'artifacts/job-requests-v1/vectors.json').read_text())
    for item in vectors['positive']:
        before = copy.deepcopy(item['vc'])
        actual = project(item['vc'], instant(item.get('now', vectors['now'])))
        assert actual == item['projection'], item['id']
        assert item['vc'] == before, item['id']
        assert not {'details', 'eligibility', 'extensions'}.intersection(actual), item['id']
    for item in vectors['negative']:
        try:
            validate_claims(item['vc'], instant(item.get('now', vectors['now'])))
        except ValueError as error:
            assert str(error) == item['error'], (item['id'], str(error))
        else:
            raise AssertionError(item['id'] + ': invalid job request accepted')
    derived = project(vectors['positive'][0]['vc'], instant(vectors['now']))
    for item in vectors['negativeProjections']:
        assert item['projection'] != derived, item['id']
    print(f"Independent job requests passed: {len(vectors['positive'])} positive, {len(vectors['negative'])} negative, {len(vectors['negativeProjections'])} projection negatives; unsigned semantics only.")


if __name__ == '__main__':
    verify_vectors()
