from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.template import RequestContext, loader
from django.shortcuts import get_object_or_404, render
from django.core.urlresolvers import reverse

from eoi.models import *
from eoi.forms import *

# Create your views here.

def list(request):
	apps = Application.objects.order_by('-sd_date')
	context = {'apps': apps}
	return render(request, 'eoi/list.html', context)

def index(request):    
	if request.method == 'POST':
		form = ApplicationForm(request.POST)
		if form.is_valid():
			form.save();
			return HttpResponseRedirect('thanks')
		else:	
			return render(request, 'eoi/index.html', {
            'form': form,
            'error_message': "Validation errors.",
			})
	else:
		form = ApplicationForm();
	
	return render(request, 'eoi/index.html')
