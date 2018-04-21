import sys
import csv
from crac_booking.models import *
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

class Command(BaseCommand):
    help = 'Loads all external members from a given CSV file'

    def add_arguments(self, parser):
        parser.add_argument('fname', type=str)
        parser.add_argument('wipe', type=str)

    def handle(self, *args, **options):
        with open(options['fname'], 'rb') as csvfile:
            with transaction.atomic():
		if options['wipe'] == 'true': 
		    ImportedMember.objects.all().delete()
		    Member.objects.all().delete()

                reader = csv.DictReader(csvfile)
                for row in reader:
                    member = Member()
                    member.first_name = row['FirstName']
                    member.last_name = row['LastName']
                    member.home_phone = row['PhoneNumber']
                    member.cell_phone = row['MobileNumber']
                    member.email = row['EmailAddress']

                    if member.first_name and member.last_name:
                    	member.save()

                        print repr(member)
		
		if Member.objects.count() < 10:
		    sys.exit('Members file ' + options['fname'] + ' is too small, aborting.')

	
