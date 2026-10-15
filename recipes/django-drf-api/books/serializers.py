from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "isbn", "published"]

    def validate_isbn(self, value):
        if not value.isdigit() or len(value) not in (10, 13):
            raise serializers.ValidationError("ISBN must be 10 or 13 digits")
        return value
