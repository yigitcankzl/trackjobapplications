from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0004_remove_interview_date_add_index_uuid_upload"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="application",
            index=models.Index(
                fields=["user", "-applied_date"],
                name="applications_user_id_applied_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="interviewstage",
            index=models.Index(
                fields=["reminder_sent", "completed", "scheduled_at"],
                name="applications_reminder_query_idx",
            ),
        ),
    ]
