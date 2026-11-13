from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    """Log in with an email address (a plain username also still works)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or password is None:
            return None
        User = get_user_model()
        user = (User.objects.filter(email__iexact=username).first()
                or User.objects.filter(username__iexact=username).first())
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
