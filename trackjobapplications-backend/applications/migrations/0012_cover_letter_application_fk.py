import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0011_add_ziprecruiter_source"),
    ]

    operations = [
        migrations.AddField(
            model_name="coverlettertemplate",
            name="application",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cover_letters",
                to="applications.application",
            ),
        ),
    ]
