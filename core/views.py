from django.shortcuts import render, get_object_or_404
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
    return legal_page(request, slug='gdpr_policy')


def terms_of_service_page(request):
    """
    View to render the Terms of Service page.
    """
    return legal_page(request, slug='terms_of_service')
