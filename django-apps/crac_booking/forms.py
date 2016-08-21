from django import forms

class DoorCombinationForm(forms.Form):
    combination = forms.CharField(label='Door Combination', max_length=4)

    def clean(self):
        cleaned_data = super(DoorCombinationForm, self).clean()
        combination = cleaned_data.get('combination')
        if combination != '1234':
            raise forms.ValidationError('Door combination is incorrect', code='invalid')

