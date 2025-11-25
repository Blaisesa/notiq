from django.urls import path
from .views import spa_view

urlpatterns = [
    path('', spa_view, name='home'),
]
