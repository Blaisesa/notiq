from rest_framework import serializers
from .models import Note, Category, Template


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.
    It's purpose is to convert Category instances to and from JSON format.
    """
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'description'
            ]
        read_only_fields = ['user']


class NoteSerializer(serializers.ModelSerializer):
    """
    Serializer for the Note model.
    It includes a nested representation of the Category.
    """
    category_name = serializers.ReadOnlyField(source='category.name')
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',  # Map this field back to the 'category' foreign key
        write_only=True,
        required=False  # Allow creating a note without a category
    )

    class Meta:
        model = Note
        fields = [
            'id',
            'title',
            'data',
            'created_at',
            'updated_at',
            'category_id',  # to set the category
            'category_name'  # to read the category name
            ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class TemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the Template model.
    It includes a nested representation of the Category.
    """
    category_name = serializers.ReadOnlyField(source='category.name')
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',  # Map this field back to the 'category' foreign key
        write_only=True,
        required=False  # Allow creating a note without a category
    )

    class Meta:
        model = Template
        fields = [
            'id',
            'title',
            'data',
            'is_public',
            'created_at',
            'category_id',
            'category_name'
            ]
        read_only_fields = ['user', 'created_at', 'updated_at']
