from django.shortcuts import render
from django.db import models
from rest_framework import generics, permissions
from .models import Note, Category, Template
from .serializers import NoteSerializer, CategorySerializer, TemplateSerializer
from .mixins import UserDataMixin

# Ensure that only authenticated users can access these views
permission_classes = [permissions.IsAuthenticated]


class CategoryListView(generics.ListAPIView):
    """
    View to list all categories for the authenticated user.
    Users can see their own categories and
    categories made by staff users.
    """
    serializer_class = CategorySerializer
    permission_classes = permission_classes

    def get_queryset(self):
        user = self.request.user

        queryset = Category.objects.filter(
            models.Q(user=user) | models.Q(user__is_staff=True)
        ).distinct()  # Avoid duplicates if user is staff

        return queryset


class NoteListCreate(UserDataMixin, generics.ListCreateAPIView):
    """
    View to list all notes for the authenticated user
    and create new notes.
    """
    serializer_class = NoteSerializer
    permission_classes = permission_classes

    def get_queryset(self):
        user = self.request.user
        queryset = Note.objects.filter(user=user).order_by('-updated_at')

        category_id = self.request.query_params.get('category_id')
        if category_id:
            if category_id.lower() in ['0', 'null', 'none', '']:
                queryset = queryset.filter(category__isnull=True)
            else:
                queryset = queryset.filter(category__id=category_id)

        search_term = self.request.query_params.get('search')
        if search_term:
            # Search in title and category name
            search_query = models.Q(title__icontains=search_term)
            # Search in category name if category is not null
            search_query |= models.Q(category__name__icontains=search_term)
            # Filter the queryset based on the search query
            queryset = queryset.filter(search_query)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteDetail(UserDataMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    View to retrieve, update, or delete a specific note.
    Only the owner of the note can perform these actions.
    """
    serializer_class = NoteSerializer
    permission_classes = permission_classes
    queryset = Note.objects.all()


class TemplateListCreate(generics.ListCreateAPIView):
    """
    View to list all templates (user's private + all public)
    and create new templates.
    Only staff can create public templates.
    """
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        query = models.Q(is_public=True)
        # Add user's private templates if authenticated
        if user.is_authenticated:
            query = query | models.Q(user=user)

        return Template.objects.filter(query)

    def perform_create(self, serializer):
        user = self.request.user
        is_public_requested = serializer.validated_data.get('is_public', False)

        # Only staff users can create public templates
        if is_public_requested and not user.is_staff:
            raise permissions.PermissionDenied(
                "Only staff users can create public templates."
                )

        serializer.save(user=user)


def notes_editor_view(request):
    """
    View to render the main notes editor application page.
    This serves as the entry point for the notes SPA.
    Ensure that the user is authenticated to access this view.
    """
    if not request.user.is_authenticated:
        from django.contrib.auth.views import redirect_to_login
        return redirect_to_login(request.get_full_path())

    return render(request, 'notes/notes_editor.html')
