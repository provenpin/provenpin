from peewee import JSONField, Model, SqliteDatabase, TextField

db = SqliteDatabase(":memory:")

class Event(Model):
    slug = TextField(unique=True)
    payload = JSONField()

    class Meta:
        database = db

def init_db(rows=()):
    db.connect(reuse_if_open=True)
    db.create_tables([Event])
    for slug, payload in rows:
        Event.create(slug=slug, payload=payload)

def by_key(key, value):
    return Event.select().where(Event.payload[key] == value)

def append_tag(slug, tag):
    # json_append runs inside the UPDATE, no read-modify-write needed
    return (Event
            .update(payload=Event.payload["tags"].append(tag))
            .where(Event.slug == slug)
            .execute())
