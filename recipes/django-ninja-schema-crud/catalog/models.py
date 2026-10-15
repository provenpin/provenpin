from django.db import models


class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    year = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        # Pagination needs a stable order, otherwise pages can overlap or skip rows.
        ordering = ["id"]
