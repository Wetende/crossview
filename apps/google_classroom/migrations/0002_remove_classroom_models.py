from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("google_classroom", "0001_initial"), ("google_workspace", "0001_initial")]
    operations = [
        migrations.DeleteModel(name="ClassroomGradeSync"),
        migrations.DeleteModel(name="ClassroomSyncJob"),
        migrations.DeleteModel(name="ClassroomRosterPreview"),
        migrations.DeleteModel(name="ClassroomSyncAudit"),
        migrations.DeleteModel(name="ClassroomRosterMapping"),
        migrations.DeleteModel(name="ClassroomResourceMapping"),
        migrations.DeleteModel(name="ClassroomCourseLink"),
        migrations.DeleteModel(name="ClassroomOAuthCredential"),
    ]
