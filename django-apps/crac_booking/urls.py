from django.conf.urls import url, include
from .models import *
from rest_framework import routers, serializers, viewsets

from . import views

class BookingSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Booking

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

class AircraftSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Aircraft

class AircraftViewSet(viewsets.ModelViewSet):
    queryset = Aircraft.objects.all()
    serializer_class = AircraftSerializer

class MemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Member

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

router = routers.DefaultRouter()
router.register(r'aircraft', AircraftViewSet)
router.register(r'booking', BookingViewSet)
router.register(r'member', MemberViewSet)

urlpatterns = [
    url(r'api/', include(router.urls)),
    url(r'api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^$', views.index, name='index'),
]

