from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="events.index"),
    path("<slug:slug>/", views.detail, name="events.detail"),
    path("<slug:slug>/join/", views.join, name="events.join"),
]
