from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0010_add_indexes_status_source_email_thread_id"),
    ]

    operations = [
        migrations.AlterField(
            model_name="application",
            name="source",
            field=models.CharField(
                blank=True,
                choices=[
                    ("linkedin", "LinkedIn"),
                    ("indeed", "Indeed"),
                    ("glassdoor", "Glassdoor"),
                    ("ziprecruiter", "ZipRecruiter"),
                    ("referral", "Referral"),
                    ("company_website", "Company Website"),
                    ("other", "Other"),
                ],
                default="",
                max_length=20,
            ),
        ),
    ]
