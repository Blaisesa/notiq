from django.contrib import admin
from .models import SystemPage


# Register your models here.
class SystemPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}


admin.site.register(SystemPage, SystemPageAdmin)
