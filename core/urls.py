from django.urls import path
from . import views

urlpatterns = [
    # Separate paths for your legal pages
    path('gdpr/', views.gdpr_page, name='gdpr_policy'),
    path('terms/', views.terms_of_service_page, name='terms_of_service'),
]
