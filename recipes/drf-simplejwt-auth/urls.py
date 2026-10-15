from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from views import MyTokenObtainPairView, me

urlpatterns = [
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/me/", me, name="me"),
]
