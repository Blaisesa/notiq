from django.db import models


# Create your models here.
class SystemPage(models.Model):
    """
    A generic model to store large blocks of content managed via the admin interface.
    Used for legal text (GDPR, ToC), mission statements, etc.
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
