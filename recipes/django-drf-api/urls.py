from rest_framework.routers import DefaultRouter
from books.views import BookViewSet

router = DefaultRouter()
router.register("books", BookViewSet)
urlpatterns = router.urls
