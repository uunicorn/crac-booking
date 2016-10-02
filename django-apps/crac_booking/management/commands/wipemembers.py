import csv
from crac_booking.models import *
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

class Command(BaseCommand):
    help = 'Deletes all members'

    def handle(self, *args, **options):
        ImportedMember.objects.all().delete()
        Member.objects.all().delete()
