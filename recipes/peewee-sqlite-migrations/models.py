from peewee import CharField, ForeignKeyField, IntegerField, Model, TextField


class BaseModel(Model):
    pass


class User(BaseModel):
    username = CharField(unique=True)
    email = CharField(default="")
    karma = IntegerField(default=0)


class Note(BaseModel):
    user = ForeignKeyField(User, backref="notes")
    body = TextField()
