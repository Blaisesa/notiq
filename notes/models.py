from django.db import models
from django.conf import settings


# Create your models here.
class Category(models.Model):
    """
    Model representing a note category.
    It includes a name, description, and is linked to a user.
    It helps in organizing notes into different categories.
    and is associated with a specific user.
    Admin can make categories available to all users.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
        )

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Note(models.Model):
    """
    Model representing a note.
    Each note is linked to a user and a category.
    It contains a title and data stored in JSON format.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
        )
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Template(models.Model):
    """
    Model representing a note template.
    Templates can be created by users or admin.
    Public templates are available to all users.
    Users templates are private to the user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
        )
    title = models.CharField(max_length=100)
    data = models.JSONField(default=dict, blank=True)
    category_id = models.IntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
