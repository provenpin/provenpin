import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter

from shop.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price"]


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    ordering = django_filters.OrderingFilter(fields=("price", "name"))

    class Meta:
        model = Product
        fields = ["name"]  # exact match


class ProductViewSet(viewsets.ModelViewSet):
    # An explicit order keeps pagination stable across requests.
    queryset = Product.objects.order_by("id")
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter


router = DefaultRouter()
router.register("products", ProductViewSet)
urlpatterns = router.urls
