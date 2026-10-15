from unittest.mock import patch

import pytest
from django.db import transaction

from notes.models import Note
from notes.tasks import index_note

pytestmark = pytest.mark.django_db


def test_task_runs_after_commit(django_capture_on_commit_callbacks):
    # Eager mode runs the task inline once the on_commit callback fires.
    with django_capture_on_commit_callbacks(execute=True):
        note = Note.objects.create(title="a")
    note.refresh_from_db()
    assert note.indexed


def test_nothing_enqueued_before_commit(django_capture_on_commit_callbacks):
    # Inside the test transaction, on_commit callbacks are deferred.
    with patch.object(index_note, "delay") as delay:
        with django_capture_on_commit_callbacks() as callbacks:
            note = Note.objects.create(title="a")
        delay.assert_not_called()
        assert len(callbacks) == 1
        for cb in callbacks:
            cb()
        delay.assert_called_once_with(note.pk)


def test_rollback_discards_enqueue(django_capture_on_commit_callbacks):
    # Callbacks registered inside a rolled-back savepoint are dropped.
    with django_capture_on_commit_callbacks() as callbacks:
        with pytest.raises(RuntimeError):
            with transaction.atomic():
                Note.objects.create(title="a")
                raise RuntimeError("boom")
    assert callbacks == []
    assert not Note.objects.exists()


def test_task_tolerates_missing_row():
    # The task passes the pk, so a deleted row is a no-op, not an error.
    result = index_note.delay(999_999)
    assert result.successful()
