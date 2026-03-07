from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0004_application_interview_date"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="application",
            index=models.Index(
                fields=["status", "updated_at"],
                name="applications_status_updated_idx",
            ),
        ),
    ]
