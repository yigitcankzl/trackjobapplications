from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_avatar_user_resume"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="notification_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
    ]
