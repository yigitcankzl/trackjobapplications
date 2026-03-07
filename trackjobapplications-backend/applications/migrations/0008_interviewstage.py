from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0007_applicationcontact"),
    ]

    operations = [
        migrations.CreateModel(
            name="InterviewStage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stage_type", models.CharField(choices=[("phone_screen", "Phone Screen"), ("technical", "Technical Interview"), ("behavioral", "Behavioral Interview"), ("onsite", "On-site"), ("take_home", "Take-home Assignment"), ("final", "Final Round"), ("other", "Other")], max_length=20)),
                ("scheduled_at", models.DateTimeField()),
                ("notes", models.TextField(blank=True, default="")),
                ("completed", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("application", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="interview_stages", to="applications.application")),
            ],
            options={
                "ordering": ["scheduled_at"],
            },
        ),
    ]
