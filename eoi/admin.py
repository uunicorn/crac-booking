from django.contrib import admin

# Register your models here.

from .models import *

"""
Personal details: pd_
pd_surname, pd_firstnames, pd_address
pd_home_phone, pd_work_phone, pd_cell_phone
pd_email, pd_occupation, pd_dob

Partner/Next of kin: nok_
nok_surname, nok_firsnames, nok_address,
nok_daytime_phone, nok_cell_phone,
nok_relationship[partner,family,other]

Membership: m_
m_type[flying, social]
m_proposer, m_seconder

Statutory declaration: sd_
sd_signed, sd_date
"""


class ApplicationAdmin(admin.ModelAdmin):
    fieldsets = [
        ('Personal details', {'fields': ['pd_surname', 'pd_firstnames', 'pd_address', 'pd_cell_phone', 'pd_home_phone', 'pd_work_phone',
        'pd_email', 'pd_occupation', 'pd_dob']}),
        ('Next of kin', { 'fields' : ['nok_surname', 'nok_firstnames', 'nok_address', 'nok_daytime_phone', 'nok_cell_phone', 'nok_relationship',
        ]}),
        ('Membership', { 'fields' : ['m_type', 'm_proposer', 'm_seconder',
        ]}),
        ('Statutory declaration', { 'fields' : ['sd_date', 'sd_signed', 
        ]}),
    ]
    readonly_fields = ("sd_date",)
    list_display = ('pd_surname', 'pd_firstnames', 'pd_dob', 'pd_email', 'pd_cell_phone', 'm_type', 'm_proposer', 'm_seconder', 'sd_date', )


admin.site.register(Application, ApplicationAdmin)
