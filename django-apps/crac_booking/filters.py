
from .models import Booking
from django import forms
from django.utils.encoding import force_str
from rest_framework import filters
import django_filters
import dateutil.parser


class IsoDateField(forms.DateTimeField):
    def strptime(self, value, format):
        value = force_str(value)
        parsed = dateutil.parser.parse(value)
        return parsed

class IsoFilter(django_filters.DateTimeFilter):
    field_class = IsoDateField

class BookingFilter(filters.FilterSet):
    from_time = IsoFilter(name='from_time', lookup_expr='gte')
    to_time = IsoFilter(name='to_time', lookup_expr='lte')

    class Meta:
        model = Booking
        fields = ['from_time', 'to_time']
