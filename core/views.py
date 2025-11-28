from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .forms import NewsletterSubscriberForm
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
