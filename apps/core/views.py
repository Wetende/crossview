"""Core views."""
from inertia import render

def home(request):
    return render(request, 'Home', props={
        'message': 'Welcome to Crossview LMS'
    })
