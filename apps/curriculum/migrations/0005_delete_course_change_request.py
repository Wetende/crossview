from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("curriculum", "0004_coursechangerequest_updated_at"),
    ]

    operations = [
        migrations.DeleteModel(
            name="CourseChangeRequest",
        ),
    ]
