from django.db import models

# Create your models here.


class Application(models.Model):
	pd_surname = models.CharField('Surname', max_length=30)
	pd_firstnames = models.CharField('First names', max_length=30)
	pd_address = models.CharField(max_length=100)
	pd_home_phone = models.CharField(max_length=15, blank=True, null=True)
	pd_work_phone = models.CharField(max_length=15, blank=True, null=True)
	pd_cell_phone = models.CharField('Cell phone', max_length=15)
	pd_email = models.EmailField('Email')
	pd_occupation = models.CharField(max_length=30, blank=True, null=True)
	pd_dob = models.DateField('date of birth')
	
	nok_surname = models.CharField(max_length=30)
	nok_firstnames = models.CharField(max_length=30)
	nok_address = models.CharField(max_length=100)
	nok_daytime_phone = models.CharField(max_length=15)
	nok_cell_phone = models.CharField(max_length=15)
	NOK_RELATIONSHIP_CHOICES = (
		('partner', 'Partner'),
		('family', 'Family'),
		('other', 'Other')
	)
	nok_relationship = models.CharField(max_length=7, choices=NOK_RELATIONSHIP_CHOICES, default='other')
	
	MEMBERSHIP_TYPE_CHOICES = (
		('flying', 'Flying'),
		('social', 'Social')
	)
	m_type = models.CharField('Membership', max_length=6, choices=MEMBERSHIP_TYPE_CHOICES, default='flying')
	m_proposer = models.CharField('Proposer', max_length=30, blank=True, null=True)
	m_seconder = models.CharField('Seconder', max_length=30, blank=True, null=True)
	
	sd_signed = models.CharField(max_length=30)
	sd_date = models.DateField('Date signed', auto_now_add=True)
	
	def __str__(self):
		return self.pd_firstnames + ' ' + self.pd_surname 

	

