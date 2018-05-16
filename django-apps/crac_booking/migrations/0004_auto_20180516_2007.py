# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crac_booking', '0003_auto_20160908_0752'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='member',
            options={'ordering': ('first_name', 'last_name')},
        ),
        migrations.AlterField(
            model_name='booking',
            name='details',
            field=models.CharField(max_length=1000),
        ),
    ]
