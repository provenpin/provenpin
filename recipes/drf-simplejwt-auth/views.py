from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Claims added here land on the refresh token; access tokens derived
        # from it (including via /refresh/) inherit them.
        token = super().get_token(user)
        token["role"] = "admin" if user.is_staff else "member"
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({"username": request.user.username, "role": request.auth["role"]})
