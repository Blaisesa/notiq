from django.urls import path
from . import views

urlpatterns = [
    # Separate paths for your legal pages
    path('gdpr-policy/', views.gdpr_page, name='gdpr_policy'),
    path('terms-of-service/', views.terms_of_service_page,
         name='terms_of_service'),
]
