from django.contrib import admin
from .models import SystemPage, NewsletterSubscriber

admin.site.register(SystemPage)
admin.site.register(NewsletterSubscriber)


# Register your models here.
class SystemPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}


class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'subscribed_at')
    search_fields = ('email',)
