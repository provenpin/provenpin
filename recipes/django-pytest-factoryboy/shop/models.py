from django.db import models, transaction

class Author(models.Model):
    name = models.CharField(max_length=100, unique=True)

class Book(models.Model):
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="books")
    title = models.CharField(max_length=200)
    price_cents = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["title"]

    def publish(self, notify):
        # runs only after the surrounding transaction commits
        transaction.on_commit(lambda: notify(self.pk))
