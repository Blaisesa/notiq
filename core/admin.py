from django.contrib import admin
from .models import SystemPage, NewsletterSubscriber, Feature

admin.site.register(SystemPage)
admin.site.register(NewsletterSubscriber)
admin.site.register(Feature)


# Register your models here.
class SystemPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}


class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'subscribed_at')
    search_fields = ('email',)


class FeatureAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'is_main', 'is_active', 'created_at', 'updated_at'
        )
    list_filter = ('is_main', 'is_active')
    search_fields = ('title', 'description')
