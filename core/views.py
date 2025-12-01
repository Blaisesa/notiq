from django.shortcuts import render, get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from .forms import NewsletterSubscriberForm, ContactForm
from .models import SystemPage


# Create your views here.
def legal_page(request, slug):
    """
    View to render legal pages such as GDPR and Terms of Service.
    The content is managed via the SystemPage model in the admin interface.
    """
    page = get_object_or_404(SystemPage, slug=slug)
    return render(request, 'core/legal_page.html', {'page': page})


def gdpr_page(request):
    """
    View to render the GDPR page.
    """
    return legal_page(request, slug='gdpr-policy')


def terms_of_service_page(request):
    """
    View to render the Terms of Service page.
    """
    return legal_page(request, slug='terms-of-service')


def newsletter_signup(request):
    """
    Handle newsletter signup without redirecting.
    Displays a form and processes submissions.
    """
    if request.method == 'POST':
        form = NewsletterSubscriberForm(request.POST)
        if form.is_valid():
            form.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({"success": True})
    return JsonResponse({"success": False}, status=400)


def contact_form_view(request):
    """
    View to handle the contact form submissions, optimized for htmx:
    - GET: Renders the initial contact form.
    - POST (Success): Renders a 'success' template fragment.
    - POST (Failure): Re-renders the form template with validation errors.
    """
    if request.method == 'POST':
        form = ContactForm(request.POST)

        if form.is_valid():
            # Extract cleaned data
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']

            # Build the context for email
            full_subject = (
                f"Contact Form: {subject if subject else 'No Subject'}"
            )
            full_message = (
                f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
            )

            # Send email logic
            try:
                send_mail(
                    full_subject,
                    full_message,
                    settings.DEFAULT_FROM_EMAIL,
                    ['blaise.tf01@gmail.com'],
                    fail_silently=False,
                )

                success_message = (
                    "Thank you for contacting us. "
                    "We will get back to you shortly."
                )
                # Ensure you create the 'core/contact_success.html' template
                return render(request, 'core/contact_success.html', {
                    'message': success_message
                })

            except Exception as e:
                # Log the error
                print(f"Error sending contact form email: {e}")

                error_message = (
                    "An error occurred while sending your message. "
                    "Please try again later."
                )

                # Re-render the form template with
                # the error message and the form data
                return render(request, 'core/contact_form.html', {
                    'form': form,
                    'error': error_message
                })

        else:
            # If the form is NOT valid, re-render the form with the errors
            # attached to the 'form' object by Django.
            return render(request, 'core/contact_form.html', {'form': form})

    else:
        # GET request: Render the initial form
        form = ContactForm()

    return render(request, 'core/contact_form.html', {'form': form})
