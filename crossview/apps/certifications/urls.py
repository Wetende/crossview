"""Certifications app URLs."""
from django.urls import path

app_name = 'certifications'

urlpatterns = [
    # Verification URL - public endpoint for verifying certificates
    # path('verify/<str:serial_number>/', views.verify_certificate, name='verify'),
    
    # Download URL - signed URL for downloading certificates
    # path('download/<str:signed_value>/', views.download_certificate, name='download'),
]

# Note: Views will be implemented when API layer is added
# For now, the URL patterns are commented out but the names are reserved
# The Certificate model's get_verification_url() method uses 'certifications:verify'
