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


class ContactForm(forms.Form):
    # Field for the user's name (required)
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'placeholder': 'Your Name'})
    )

    # Field for the user's email (required and validated)
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'placeholder': 'Your Email Address'})
    )

    # Field for the subject line (optional)
    subject = forms.CharField(
        max_length=150,
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Subject (Optional)'})
    )

    # Field for the message body (required, uses a textarea)
    message = forms.CharField(
        widget=forms.Textarea(attrs={'placeholder': 'Your Message'}),
        max_length=1000
    )
