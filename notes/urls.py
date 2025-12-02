from django.urls import path
from . import views

urlpatterns = [
    path(
        'notes/',
        views.NoteListCreate.as_view(), name='note-list-create'
        ),
    path(
        'notes/<int:pk>/',
        views.NoteDetail.as_view(), name='note-detail'
        ),
    path(
        'categories/',
        views.CategoryListView.as_view(), name='category-list'
        ),
    path(
        'templates/',
        views.TemplateListCreate.as_view(), name='template-list-create'
        ),
    path(
        'templates/<int:pk>/',
        views.TemplateDetail.as_view(), name='template-detail'
        ),
]
