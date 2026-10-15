from tortoise import fields
from tortoise.models import Model

class Tag(Model):
    id = fields.IntField(primary_key=True)
    name = fields.CharField(max_length=30, unique=True)

    class Meta:
        table = "tag"

class Author(Model):
    id = fields.IntField(primary_key=True)
    name = fields.CharField(max_length=50, unique=True)
    books: fields.ReverseRelation["Book"]

    class Meta:
        table = "author"

class Book(Model):
    id = fields.IntField(primary_key=True)
    title = fields.CharField(max_length=100)
    rating = fields.IntField(default=0)
    author = fields.ForeignKeyField("models.Author", related_name="books")
    tags = fields.ManyToManyField("models.Tag", related_name="books")

    class Meta:
        table = "book"
