from django.conf import settings
from django import forms

DOOR_COMBINATIONS = settings.DOOR_COMBINATIONS

widget=forms.TextInput(attrs={'class': 'form-control'})

class DoorCombinationForm(forms.Form):
    combination = forms.CharField(label='Door Combination', max_length=4, widget=widget)

    def clean(self):
        cleaned_data = super(DoorCombinationForm, self).clean()
        combination = cleaned_data.get('combination')
        if not combination in DOOR_COMBINATIONS:
            raise forms.ValidationError('Door combination is incorrect', code='invalid')

