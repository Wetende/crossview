from django.urls import path

from . import views

app_name = "inquiries"

urlpatterns = [
    path("", views.submit_inquiry, name="submit"),
]
