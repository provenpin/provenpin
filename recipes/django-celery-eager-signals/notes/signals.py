from functools import partial

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from notes.models import Note
from notes.tasks import index_note


@receiver(post_save, sender=Note)
def queue_indexing(sender, instance, created, **kwargs):
    if created:
        # Pass the pk, not the instance, and wait for commit so the worker
        # never runs before the row is visible to other connections.
        transaction.on_commit(partial(index_note.delay, instance.pk))
