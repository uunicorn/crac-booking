from django.core.exceptions import ValidationError
from django.conf.urls import url, include
from django.db.models import Q
from .permissions import *
from .models import *
from .filters import BookingFilter
from rest_framework import routers, serializers, viewsets, filters
from . import views

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = (DoorCombinationPermission,)
    
class AircraftSerializer(serializers.HyperlinkedModelSerializer):
    #url = serializers.HyperlinkedIdentityField(view_name='booking:aircraft-detail')

    class Meta:
        model = Aircraft

class AircraftViewSet(MyViewSet):
    queryset = Aircraft.objects.all()
    serializer_class = AircraftSerializer

class BookingSerializer(serializers.HyperlinkedModelSerializer):
    #url = serializers.HyperlinkedIdentityField(view_name='booking:booking-detail')
    #aircraft = serializers.HyperlinkedRelatedField(view_name='booking:aircraft-detail', queryset = AircraftViewSet.queryset)

    def validate(self, data):
        print repr(data)

        q = (Q(from_time__gte=data['from_time'], from_time__lt=data['to_time']) | 
            Q(to_time__gt=data['from_time'], to_time__lte=data['to_time']))

        q = q & Q(aircraft=data['aircraft'])

        if self.instance:
            q = ~Q(pk=self.instance.pk) & q

        print '>>>> %s' % repr(q)

        overlaps = Booking.objects.filter(q)
        
        print repr(overlaps)

        if overlaps:
            raise ValidationError("Specified times overlap with nother booking")

        return data

    class Meta:
        model = Booking

class BookingViewSet(MyViewSet):
    queryset = Booking.objects.all()
    filter_backends = (filters.DjangoFilterBackend,filters.OrderingFilter)
    filter_class = BookingFilter
    ordering_fields = ('from_time',)
    serializer_class = BookingSerializer

class MemberSerializer(serializers.HyperlinkedModelSerializer):
#    url = serializers.HyperlinkedIdentityField(view_name='booking:member-detail')

    class Meta:
        model = Member

class MemberViewSet(MyViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

api_router = routers.DefaultRouter()
api_router.register(r'aircraft', AircraftViewSet)
api_router.register(r'booking', BookingViewSet)
api_router.register(r'member', MemberViewSet)

urlpatterns = api_router.urls

