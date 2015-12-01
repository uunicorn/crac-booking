from django import forms
from django.forms import ModelForm
from eoi.models import *

class ApplicationForm(ModelForm):
	class Meta:
		model = Application
		fields = '__all__'



