from rest_framework import generics, permissions
from django.db import models
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
