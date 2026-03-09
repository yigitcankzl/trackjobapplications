import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0008_add_email_integration_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="OfferDetail",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("salary", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("currency", models.CharField(
                    choices=[
                        ("USD", "USD"), ("EUR", "EUR"), ("GBP", "GBP"),
                        ("TRY", "TRY"), ("CAD", "CAD"), ("AUD", "AUD"),
                        ("JPY", "JPY"), ("INR", "INR"), ("OTHER", "Other"),
                    ],
                    default="USD", max_length=5,
                )),
                ("salary_period", models.CharField(
                    choices=[("yearly", "Yearly"), ("monthly", "Monthly"), ("hourly", "Hourly")],
                    default="yearly", max_length=10,
                )),
                ("signing_bonus", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("annual_bonus", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("equity", models.CharField(blank=True, default="", max_length=200)),
                ("benefits", models.TextField(blank=True, default="")),
                ("location", models.CharField(blank=True, default="", max_length=200)),
                ("remote_policy", models.CharField(
                    blank=True, default="", max_length=10,
                    choices=[("onsite", "On-site"), ("hybrid", "Hybrid"), ("remote", "Remote")],
                )),
                ("company_size", models.CharField(
                    blank=True, default="", max_length=15,
                    choices=[
                        ("startup", "Startup (1-50)"), ("small", "Small (51-200)"),
                        ("medium", "Medium (201-1000)"), ("large", "Large (1001-5000)"),
                        ("enterprise", "Enterprise (5000+)"),
                    ],
                )),
                ("start_date", models.DateField(blank=True, null=True)),
                ("deadline", models.DateField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("application", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="offer_detail",
                    to="applications.application",
                )),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
