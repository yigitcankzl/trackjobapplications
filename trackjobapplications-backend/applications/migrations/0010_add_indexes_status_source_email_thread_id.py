from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0009_offerdetail"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="application",
            index=models.Index(fields=["user", "status"], name="applications_user_status_idx"),
        ),
        migrations.AddIndex(
            model_name="application",
            index=models.Index(fields=["user", "source"], name="applications_user_source_idx"),
        ),
        migrations.AddIndex(
            model_name="application",
            index=models.Index(fields=["email_thread_id"], name="applications_email_thread_id_idx"),
        ),
    ]
