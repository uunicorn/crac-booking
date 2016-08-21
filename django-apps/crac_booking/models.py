from django.db import models

class Aircraft(models.Model):
    rego = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
    status_reason = models.CharField(max_length=1000)
    status_contact_name = models.CharField(max_length=100)
    status_contact_email = models.CharField(max_length=100)
    status_contact_phone = models.CharField(max_length=100)
    status_from_time = models.DateTimeField()
    status_to_time = models.DateTimeField()

    def __str__(self):
        return rego

class Member(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    cell_phone = models.CharField(max_length=100)
    email = models.CharField(max_length=100)

    def __str__(self):
        return first_name + " " + last_name
    

class Booking(models.Model):
    aircraft = models.ForeignKey(Aircraft, on_delete=models.CASCADE)

    from_time = models.DateTimeField()
    to_time = models.DateTimeField()
    
    pax_instructor = models.CharField(max_length=100)
    pilot_student = models.CharField(max_length=100)
    contact_email = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=100)
    details = models.CharField(max_length=1000)

    def __str__(self):
        return "%s: %s..%s" % (self.pilot_student, str(self.from_time), str(self.to_time))

