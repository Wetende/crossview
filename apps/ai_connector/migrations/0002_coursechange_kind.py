from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("ai_connector", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="coursechange",
            name="kind",
            field=models.CharField(default="course_edit", max_length=24),
        ),
    ]
