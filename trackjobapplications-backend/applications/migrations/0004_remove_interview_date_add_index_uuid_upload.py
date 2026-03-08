import applications.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0003_alter_application_status"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="application",
            name="interview_date",
        ),
        migrations.AddIndex(
            model_name="application",
            index=models.Index(fields=["-applied_date"], name="application_applied_idx"),
        ),
        migrations.AlterField(
            model_name="applicationattachment",
            name="file",
            field=models.FileField(upload_to=applications.models.attachment_upload_path),
        ),
    ]
