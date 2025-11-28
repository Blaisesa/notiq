from django.urls import path
from . import views

urlpatterns = [
    # Separate paths for your legal pages
    path('gdpr-policy/', views.gdpr_page, name='gdpr_policy'),
    path('terms-of-service/', views.terms_of_service_page,
         name='terms_of_service'),
    path('newsletter-signup/', views.newsletter_signup,
         name='newsletter_signup'),
    path('features/', views.feature_list, name='feature_list'),
]
