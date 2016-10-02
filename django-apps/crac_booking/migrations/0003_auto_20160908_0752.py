# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-09-08 07:52
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('crac_booking', '0002_auto_20160906_1110'),
    ]

    operations = [
        migrations.CreateModel(
            name='ImportedMember',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('external_id', models.IntegerField(db_index=True, unique=True)),
            ],
        ),
        migrations.AddField(
            model_name='member',
            name='home_phone',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='member',
            name='cell_phone',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='member',
            name='email',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='importedmember',
            name='booking',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='crac_booking.Member'),
        ),
    ]