from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# Create your views here.
@login_required
def profile(request):
    """
    View to display and manage user profile.
    Renders the profile.html template with user information.
    @login_required ensures only authenticated users can access this view.
    """
    user = request.user
    context = {
        'user': user,
    }
    return render(request, 'accounts/profile.html', context)
