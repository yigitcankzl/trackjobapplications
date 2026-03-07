from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("applications", "0005_application_status_updated_at_idx"),
    ]

    operations = [
        migrations.CreateModel(
            name="Tag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=50)),
                ("color", models.CharField(default="#3B82F6", max_length=7)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tags", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["name"],
                "unique_together": {("user", "name")},
            },
        ),
        migrations.AddField(
            model_name="application",
            name="tags",
            field=models.ManyToManyField(blank=True, related_name="applications", to="applications.tag"),
        ),
    ]
