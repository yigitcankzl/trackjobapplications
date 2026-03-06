from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0002_applicationnote"),
    ]

    operations = [
        migrations.AddField(
            model_name="application",
            name="source",
            field=models.CharField(
                blank=True,
                choices=[
                    ("linkedin", "LinkedIn"),
                    ("indeed", "Indeed"),
                    ("glassdoor", "Glassdoor"),
                    ("referral", "Referral"),
                    ("company_website", "Company Website"),
                    ("other", "Other"),
                ],
                default="",
                max_length=20,
            ),
        ),
    ]
