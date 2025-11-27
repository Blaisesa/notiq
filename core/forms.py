from django import forms
from .models import NewsletterSubscriber


class NewsletterSubscriberForm(forms.ModelForm):
    """
    Form for subscribing to the newsletter.
    This form handles model-level validation
    (like ensuring the email is unique).
    """
    class Meta:
        model = NewsletterSubscriber
        fields = ['email']
        widgets = {
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your email',
                'required': True,
            }),
        }
