from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    isbn = models.CharField(max_length=13, unique=True)
    published = models.DateField(null=True, blank=True)
