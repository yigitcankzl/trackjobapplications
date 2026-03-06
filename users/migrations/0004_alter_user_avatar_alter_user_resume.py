import users.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_notification_email"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="avatar",
            field=models.ImageField(
                blank=True, null=True, upload_to=users.models.avatar_upload_path
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="resume",
            field=models.FileField(
                blank=True, null=True, upload_to=users.models.resume_upload_path
            ),
        ),
    ]
