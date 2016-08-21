from django.conf.urls import patterns, url, include
from django.views.generic import TemplateView

from . import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^thanks/$', TemplateView.as_view(template_name="eoi/thanks.html")),
    
)

