from django.core.exceptions import PermissionDenied


class UserDataMixin:
    """
    Mixin to ensure that users can only access their own data.
    Raises PermissionDenied if a user tries to access another user's data.
    """

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            # User must be logged in to access their data
            raise PermissionDenied(
                "You must be logged in to access this data."
                )

        # Default query filters by the current user
        return super().get_queryset().filter(user=self.request.user)
