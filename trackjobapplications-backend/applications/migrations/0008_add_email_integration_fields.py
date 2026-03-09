from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0007_unique_user_company_position"),
    ]

    operations = [
        migrations.AddField(
            model_name="application",
            name="job_posting_content",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="application",
            name="email_thread_id",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.CreateModel(
            name="EmailLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message_id", models.CharField(max_length=255)),
                ("thread_id", models.CharField(blank=True, default="", max_length=255)),
                ("subject", models.CharField(max_length=500)),
                ("sender_email", models.EmailField(max_length=254)),
                ("sender_name", models.CharField(blank=True, default="", max_length=200)),
                ("email_type", models.CharField(
                    choices=[
                        ("rejection", "Rejection"),
                        ("interview_invite", "Interview Invitation"),
                        ("offer", "Offer"),
                        ("follow_up", "Follow-up"),
                        ("general", "General"),
                    ],
                    default="general",
                    max_length=20,
                )),
                ("snippet", models.TextField(blank=True, default="")),
                ("suggested_status", models.CharField(blank=True, default="", max_length=20)),
                ("received_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("application", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="email_logs",
                    to="applications.application",
                )),
            ],
            options={
                "ordering": ["-received_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="emaillog",
            constraint=models.UniqueConstraint(
                fields=("application", "message_id"),
                name="unique_application_email",
            ),
        ),
    ]
