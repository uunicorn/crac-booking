from django.db import models

class Aircraft(models.Model):
    rego = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
    status_reason = models.CharField(max_length=1000, blank=True)
    status_contact_name = models.CharField(max_length=100, blank=True)
    status_contact_email = models.CharField(max_length=100, blank=True)
    status_contact_phone = models.CharField(max_length=100, blank=True)
    status_from_time = models.DateTimeField(blank=True, null=True)
    status_to_time = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.rego

class Member(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    home_phone = models.CharField(max_length=100, blank=True, null=True)
    cell_phone = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ('first_name', 'last_name')

    def __str__(self):
        return self.first_name + " " + self.last_name
    
class ImportedMember(models.Model):
    booking = models.ForeignKey(Member, blank=True, null=True)

    external_id = models.IntegerField(db_index=True, unique=True)


class Booking(models.Model):
    aircraft = models.ForeignKey(Aircraft, on_delete=models.CASCADE)

    from_time = models.DateTimeField()
    to_time = models.DateTimeField()
    
    pax = models.CharField(max_length=100, blank=True)
    pic = models.CharField(max_length=100)
    contact_email = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=100)
    details = models.CharField(max_length=1000)

    hobs_start = models.DecimalField(db_index=True, max_digits=10, decimal_places=1, null=True)
    hobs_end = models.DecimalField(db_index=True, max_digits=10, decimal_places=1, null=True)

    class Meta:
        ordering = ('from_time',)

    def __str__(self):
        return "%s: %s..%s" % (self.pic, str(self.from_time), str(self.to_time))

class ImportedBooking(models.Model):
    booking = models.ForeignKey(Booking, blank=True, null=True)

    external_id = models.IntegerField(db_index=True, unique=True)

