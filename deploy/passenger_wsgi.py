import os
import sys

# 1. Add the current directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

# 2. Set the settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

# 3. Import the Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
