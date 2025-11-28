from django.contrib.auth.models import AbstractUser
from django.db import models


# Create your models here.
class CustomUser(AbstractUser):
    """
    Custom user model extending AbstractUser to allow future customization.
    and integration with django-allauth.
    Added fields for user preferences and settings.
    Added last_active field to track user activity.
    """
    theme_preference = models.BooleanField(
        default=False,
        help_text="User's theme preference: "
        "False for light mode,"
        "True for dark mode."
    )
    ai_settings = models.JSONField(
        default=dict,
        help_text="JSON field to store user-specific AI settings."
    )
    last_active = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of the user's last activity."
    )

    def __str__(self):
        return self.username
