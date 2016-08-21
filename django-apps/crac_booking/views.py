
from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from rest_framework import viewsets
from rest_framework.response import Response
import datetime
from django.contrib.auth.decorators import login_required

@login_required
def index(request):
    context = {  }
    return render(request, 'booking/index.html', context)

