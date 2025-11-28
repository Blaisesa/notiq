from django.shortcuts import render
from core.models import Feature


# Create your views here.
def spa_view(request):
    """
    View to render the Single Page Application (SPA) main page.
    Fetches main features to display on the features section.
    Communicates with core app for features data.
    """
    main_features = Feature.objects.filter(is_main=True, is_active=True)
    secondary_features = Feature.objects.filter(is_main=False, is_active=True)

    context = {
        'main_features': main_features,
        'secondary_features': secondary_features,
    }

    return render(request, 'spa/index.html', context)
