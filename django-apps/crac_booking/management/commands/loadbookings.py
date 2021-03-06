import csv
import datetime
import pytz
from crac_booking.models import *
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

old_ac = {
    None: 'Unknown',
    '': 'Unknown',
    '0': 'Unknown',
    '1': 'Unknown',
    '2': 'JOR',
    '3': 'Unknown',
    '4': 'Unknown',
    '5': 'RGA',
    '6': 'RGB'
}

class Command(BaseCommand):
    help = 'Loads all external bookings from a given CSV file'

    def add_arguments(self, parser):
        parser.add_argument('fname', type=str)

    def handle(self, *args, **options):
        with open(options['fname'], 'rb') as csvfile:
            with transaction.atomic():
                reader = csv.reader(csvfile, delimiter=',', quotechar='"', escapechar='\\')
                for row in reader:
                    extid, date_from, date_to, ac, pic, pax, details = row
                    ext, created = ImportedBooking.objects.get_or_create(external_id=extid)
                    if created:
                        date_from, date_to = [datetime.datetime.fromtimestamp(int(x), pytz.utc) for x in [date_from, date_to]]
			date_to = date_to + datetime.timedelta(minutes=10)
                        ac = Aircraft.objects.get(rego=old_ac[ac])
                        ext.booking = Booking()
                        ext.booking.from_time = date_from
                        ext.booking.to_time = date_to
                        ext.booking.aircraft = ac
                        ext.booking.pic = pic
                        ext.booking.pax = pax
                        ext.booking.details = details
                        ext.booking.save()
                        ext.save()

                        print repr(row)
            

