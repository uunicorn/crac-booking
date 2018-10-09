
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from rest_framework import viewsets
from rest_framework.response import Response
import datetime
from .forms import DoorCombinationForm
from .models import *
from django.contrib.auth.decorators import login_required

def index(request):
    if not request.session.get('door-combination', False):
        return HttpResponseRedirect('/booking/door-combination/')

    context = {  }
    return render(request, 'booking/index.html', context)

def door_combination(request):
    if request.session.get('door-combination', False):
        return HttpResponseRedirect('/booking/')

    if request.method == 'POST':
        form = DoorCombinationForm(request.POST)
        if form.is_valid():
            request.session['door-combination'] = True
            if request.GET.get('target') == 'members':
                return HttpResponseRedirect('/booking/members')
            else: 
                return HttpResponseRedirect('/booking/')
    else:
        form = DoorCombinationForm()

    return render(request, 'booking/door-combination.html', { 'form': form })

def members(request):
    if not request.session.get('door-combination', False):
        return HttpResponseRedirect('/booking/door-combination/?target=members')
    context = { 'members': Member.objects.all() }
    return render(request, 'booking/members.html', context)

def reset(request):
    del request.session['door-combination']
    return HttpResponseRedirect('/booking/door-combination/')

def popup(request):
    context = {  }
    return render(request, 'booking/popup.html', context)
