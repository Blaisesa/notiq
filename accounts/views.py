from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.contrib import messages


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


@login_required
def account_delete(request):
    """
    View to handle account deletion.
    Renders the account_delete.html template with user information.
    @login_required ensures only authenticated users can access this view.
    """
    request.user.delete()
    messages.success(request, "Your account has been deleted.")
    return redirect('/')
