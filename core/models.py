from django.db import models


# Create your models here.
class SystemPage(models.Model):
    """
    A generic model to store large blocks of content managed
    via the admin interface. Used for legal text (GDPR, ToC).
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


# Newsletter Subscribers
class NewsletterSubscriber(models.Model):
    """
    Model to store newsletter subscribers' email addresses.
    """
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = "Newsletter Subscriber"

    def __str__(self):
        return self.email


# Feature Elements
class Feature(models.Model):
    """
    Model to represent a feature element with an icon, title, and description.
    This is used to showcase features on the features page.
    is main indicates if the feature is a primary feature.
    is active indicates if the feature should be displayed.
    """
    icon = models.CharField(
                            max_length=100,
                            help_text="CSS class for the icon",
                            default="fa-solid fa-pen-fancy"
                            )
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_main = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_main', 'title']

    def __str__(self):
        return self.title
