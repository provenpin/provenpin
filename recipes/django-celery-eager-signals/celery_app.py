from celery import Celery

# In-memory broker and result backend: no Redis or network needed.
app = Celery("notes", broker="memory://", backend="cache+memory://")
