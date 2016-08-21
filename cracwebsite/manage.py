#!/usr/bin/env python
import os
import sys

PROJECT_ROOT = os.path.dirname(__file__)
apps = os.path.join(PROJECT_ROOT, "..", "django-apps")
sys.path.insert(0, apps)

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cracwebsite.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
