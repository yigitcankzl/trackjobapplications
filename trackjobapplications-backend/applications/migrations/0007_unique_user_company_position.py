from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0006_rename_indexes"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="application",
            constraint=models.UniqueConstraint(
                fields=["user", "company", "position"],
                name="unique_user_company_position",
            ),
        ),
    ]
