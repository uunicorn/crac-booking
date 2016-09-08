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
                reader = csv.reader(csvfile, delimiter=',', quotechar='"', escapechar='\\')
                for row in reader:
                    extid, fname, lname, phone, mobile, email = row
                    ext, created = ImportedMember.objects.get_or_create(external_id=extid)
                    if created:
                        ext.member = Member()
                        ext.member.first_name = fname
                        ext.member.last_name = lname
                        ext.member.home_phone = phone
                        ext.member.cell_phone = mobile
                        ext.member.email = email
                        ext.member.save()
                        ext.save()

                        print repr(row)
            

