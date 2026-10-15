from celery_app import app
from notes.models import Note


@app.task
def index_note(note_id: int) -> None:
    # Fetch by pk and use .update() so the task never re-fires post_save.
    # A missing row simply matches zero rows instead of raising.
    Note.objects.filter(pk=note_id).update(indexed=True)
