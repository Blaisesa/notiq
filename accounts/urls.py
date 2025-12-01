from django.urls import path, include
from . import views

urlpatterns = [
    path('profile/', views.profile, name='profile'),
    path('delete/', views.account_delete, name='account_delete'),
    path('', include('allauth.urls')),
]
