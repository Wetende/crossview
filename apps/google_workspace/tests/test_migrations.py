from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class GoogleWorkspaceCredentialMigrationTests(TransactionTestCase):
    """Prove credentials survive before the destructive Classroom table drop."""

    migrate_from = [
        ("google_workspace", None),
        ("google_classroom", "0001_initial"),
    ]
    migrate_to = [
        ("google_workspace", "0001_initial"),
        ("google_classroom", "0002_remove_classroom_models"),
    ]

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        self.latest_targets = executor.loader.graph.leaf_nodes()
        executor.migrate(self.migrate_from)
        old_apps = executor.loader.project_state(
            [("google_classroom", "0001_initial")]
        ).apps

        User = old_apps.get_model("core", "User")
        Credential = old_apps.get_model(
            "google_classroom", "ClassroomOAuthCredential"
        )
        self.user = User.objects.create(
            username="workspace-migration-teacher",
            email="teacher@example.test",
        )
        self.credential_id = Credential.objects.create(
            user_id=self.user.id,
            google_user_id="google-user-123",
            google_email="teacher@gmail.test",
            refresh_token_ciphertext="encrypted-refresh-token",
            granted_scopes=["https://www.googleapis.com/auth/calendar.events"],
            status="invalid",
            last_error="Reconnect required",
        ).id

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        self.migrated_apps = executor.loader.project_state(self.migrate_to).apps

    def tearDown(self):
        MigrationExecutor(connection).migrate(self.latest_targets)
        super().tearDown()

    def test_credential_is_copied_before_classroom_tables_are_removed(self):
        Credential = self.migrated_apps.get_model(
            "google_workspace", "GoogleWorkspaceCredential"
        )
        migrated = Credential.objects.get(id=self.credential_id)

        self.assertEqual(migrated.user_id, self.user.id)
        self.assertEqual(migrated.google_user_id, "google-user-123")
        self.assertEqual(migrated.google_email, "teacher@gmail.test")
        self.assertEqual(
            migrated.refresh_token_ciphertext, "encrypted-refresh-token"
        )
        self.assertEqual(
            migrated.granted_scopes,
            ["https://www.googleapis.com/auth/calendar.events"],
        )
        self.assertEqual(migrated.status, "invalid")
        self.assertEqual(migrated.last_error, "Reconnect required")
        self.assertNotIn(
            "google_classroom_oauth_credentials",
            connection.introspection.table_names(),
        )
