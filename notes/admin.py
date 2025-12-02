from django.contrib import admin
from .models import Category, Template

admin.site.register(Category)
admin.site.register(Template)


# Register your models here.
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin view for Category model.
    Shows only admin created categories.
    """
    list_display = ('name', 'user', 'description')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(user__is_staff=True)


class TemplateAdmin(admin.ModelAdmin):
    """
    A list of admin created templates only.
    User created templates are not shown here.
    """
    list_display = ('title', 'user', 'is_public', 'created_at')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(user__is_staff=True)
