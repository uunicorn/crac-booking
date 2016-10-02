import csv
from crac_booking.models import *
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

class Command(BaseCommand):
    help = 'Loads all external members from a given CSV file'

    def add_arguments(self, parser):
        parser.add_argument('fname', type=str)

    def handle(self, *args, **options):
        with open(options['fname'], 'rb') as csvfile:
            with transaction.atomic():
                reader = csv.DictReader(csvfile)
                for row in reader:
                    member = Member()
                    member.first_name = row['First Name']
                    member.last_name = row['Last Name']
                    member.home_phone = row['Phone']
                    member.cell_phone = row['Alt. Phone']
                    member.email = row['Email']

                    if member.first_name and member.last_name:
                        member.save()

                        print repr(row)
