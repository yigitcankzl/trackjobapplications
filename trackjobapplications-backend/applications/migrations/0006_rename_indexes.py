from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0005_add_composite_indexes"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="application",
            old_name="application_applied_idx",
            new_name="application_applied_c9c2a6_idx",
        ),
        migrations.RenameIndex(
            model_name="application",
            old_name="applications_user_id_applied_idx",
            new_name="application_user_id_19c344_idx",
        ),
        migrations.RenameIndex(
            model_name="interviewstage",
            old_name="applications_reminder_query_idx",
            new_name="application_reminde_78d256_idx",
        ),
    ]
