from django.conf.urls import url, include
from .permissions import *
from .models import *
from rest_framework import routers, serializers, viewsets

from . import views

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = (DoorCombinationPermission,)
    

class BookingSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Booking

class BookingViewSet(MyViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

class AircraftSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Aircraft

class AircraftViewSet(MyViewSet):
    queryset = Aircraft.objects.all()
    serializer_class = AircraftSerializer

class MemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Member

class MemberViewSet(MyViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

router = routers.DefaultRouter()
router.register(r'aircraft', AircraftViewSet)
router.register(r'booking', BookingViewSet)
router.register(r'member', MemberViewSet)

urlpatterns = [
    url(r'api/', include(router.urls)),
    url(r'^$', views.index),
    url(r'^door-combination', views.door_combination),
    url(r'^reset', views.reset)
]

