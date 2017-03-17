from django.conf.urls import url, include
from . import views


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^door-combination', views.door_combination),
    url(r'^reset', views.reset),
    url(r'^members', views.members)
]

