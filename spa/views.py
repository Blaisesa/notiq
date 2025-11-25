from django.shortcuts import render


# Create your views here.
def spa_view(request):
    """
    View to render the Single Page Application (SPA) main page.
    """
    return render(request, 'spa/index.html')
