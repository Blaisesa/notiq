from django.contrib import admin
from .models import Category

admin.site.register(Category)


# Register your models here.
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
