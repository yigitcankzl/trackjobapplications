from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0003_application_source"),
    ]

    operations = [
        migrations.AddField(
            model_name="application",
            name="interview_date",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
