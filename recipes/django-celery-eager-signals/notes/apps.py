from django.apps import AppConfig


class NotesConfig(AppConfig):
    name = "notes"

    def ready(self):
        # Import here, after models are loaded, to avoid circular imports.
        from notes import signals  # noqa: F401
