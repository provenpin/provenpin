import json
from datetime import UTC, datetime

import pytest
from cattrs.errors import ClassValidationError

from converter import make_converter
from models import Job

NOW = datetime(2024, 1, 2, 3, 4, 5, tzinfo=UTC)


@pytest.fixture
def conv():
    return make_converter()


def test_roundtrip_renames_fields_and_datetimes(conv):
    job = Job(job_id=1, created_at=NOW, attempts=2, tags=["a"])
    data = conv.unstructure(job)
    assert data["jobId"] == 1 and "job_id" not in data
    assert data["created_at"] == NOW.isoformat()
    assert conv.structure(data, Job) == job


def test_unstructured_is_json_safe(conv):
    job = Job(job_id=1, created_at=NOW)
    assert json.loads(json.dumps(conv.unstructure(job)))["created_at"] == NOW.isoformat()


def test_converter_runs_before_validator():
    assert Job(job_id=1, created_at=NOW, attempts="3").attempts == 3
    with pytest.raises(ValueError, match="attempts"):
        Job(job_id=1, created_at=NOW, attempts="-1")


def test_assignment_also_converts_and_validates():
    job = Job(job_id=1, created_at=NOW)
    job.attempts = "7"
    assert job.attempts == 7
    with pytest.raises(ValueError):
        job.attempts = -1


def test_class_validation_error_collects_all_bad_fields(conv):
    bad = {"jobId": "x", "attempts": 0, "created_at": "nope", "tags": []}
    with pytest.raises(ClassValidationError) as info:
        conv.structure(bad, Job)
    assert len(info.value.exceptions) == 2
    assert all(isinstance(e, ValueError) for e in info.value.exceptions)
