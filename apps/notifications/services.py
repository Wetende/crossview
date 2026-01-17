"""
Notification service - Helper methods for creating notifications.
"""

from django.utils import timezone
from .models import Notification


class NotificationService:
    """Service class for creating and managing notifications."""
    
    @staticmethod
    def create(
        recipient,
        notification_type,
        title,
        message,
        priority='normal',
        action_url=None,
        related_program_id=None,
        related_enrollment_id=None,
        related_assessment_id=None,
    ):
        """
        Create a single notification for a user.
        
        Args:
            recipient: User instance to receive the notification
            notification_type: One of Notification.NOTIFICATION_TYPES
            title: Short notification title
            message: Full notification message
            priority: 'low', 'normal', or 'high'
            action_url: Optional URL to navigate to when clicked
            related_program_id: Optional related program ID
            related_enrollment_id: Optional related enrollment ID
            related_assessment_id: Optional related assessment ID
            
        Returns:
            Created Notification instance
        """
        return Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
            related_program_id=related_program_id,
            related_enrollment_id=related_enrollment_id,
            related_assessment_id=related_assessment_id,
        )
    
    @staticmethod
    def bulk_create(
        recipients,
        notification_type,
        title,
        message,
        priority='normal',
        action_url=None,
        related_program_id=None,
    ):
        """
        Create notifications for multiple users (e.g., announcements).
        
        Args:
            recipients: QuerySet or list of User instances
            notification_type: One of Notification.NOTIFICATION_TYPES
            title: Short notification title
            message: Full notification message
            priority: 'low', 'normal', or 'high'
            action_url: Optional URL to navigate to when clicked
            related_program_id: Optional related program ID
            
        Returns:
            List of created Notification instances
        """
        notifications = [
            Notification(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                priority=priority,
                action_url=action_url,
                related_program_id=related_program_id,
            )
            for recipient in recipients
        ]
        return Notification.objects.bulk_create(notifications)
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """Mark a single notification as read."""
        return Notification.objects.filter(
            id=notification_id,
            recipient=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
    
    @staticmethod
    def mark_all_as_read(user):
        """Mark all notifications for a user as read."""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
    
    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for a user."""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()

    @staticmethod
    def get_recent(user, limit=10):
        """
        Get recent notifications for a user.
        
        Args:
            user: User instance
            limit: Maximum number of notifications to return
            
        Returns:
            List of notification dicts ready for frontend
        """
        notifications = Notification.objects.filter(
            recipient=user
        ).order_by('-created_at')[:limit]
        
        return [
            {
                'id': n.id,
                'type': n.notification_type,
                'title': n.title,
                'message': n.message,
                'priority': n.priority,
                'is_read': n.is_read,
                'action_url': n.action_url,
                'created_at': n.created_at.isoformat(),
                'read_at': n.read_at.isoformat() if n.read_at else None,
            }
            for n in notifications
        ]
    
    # =========================================================================
    # Convenience methods for specific notification types
    # =========================================================================
    
    @staticmethod
    def notify_enrollment_approved(enrollment):
        """Send notification when enrollment is approved."""
        return NotificationService.create(
            recipient=enrollment.user,
            notification_type='enrollment_approved',
            title='Enrollment Approved',
            message=f'Your enrollment in "{enrollment.program.name}" has been approved.',
            action_url=f'/student/programs/{enrollment.program.id}/',
            related_program_id=enrollment.program.id,
            related_enrollment_id=enrollment.id,
        )
    
    @staticmethod
    def notify_enrollment_rejected(enrollment, reason=''):
        """Send notification when enrollment is rejected."""
        message = f'Your enrollment request for "{enrollment.program.name}" was not approved.'
        if reason:
            message += f' Reason: {reason}'
        
        return NotificationService.create(
            recipient=enrollment.user,
            notification_type='enrollment_rejected',
            title='Enrollment Request Update',
            message=message,
            related_program_id=enrollment.program.id,
            related_enrollment_id=enrollment.id,
        )
    
    @staticmethod
    def notify_grade_published(enrollment):
        """Send notification when grades are published for an enrollment."""
        return NotificationService.create(
            recipient=enrollment.user,
            notification_type='grade_published',
            title='Grades Published',
            message=f'Your grades for "{enrollment.program.name}" have been published.',
            action_url=f'/student/programs/{enrollment.program.id}/grades/',
            related_program_id=enrollment.program.id,
            related_enrollment_id=enrollment.id,
            priority='high',
        )
    
    @staticmethod
    def notify_assignment_graded(submission):
        """Send notification when an assignment is graded."""
        return NotificationService.create(
            recipient=submission.enrollment.user,
            notification_type='assignment_graded',
            title='Assignment Graded',
            message=f'Your assignment has been graded.',
            action_url=f'/student/assignments/{submission.id}/',
            related_assessment_id=submission.id,
        )
    
    @staticmethod
    def notify_quiz_graded(attempt):
        """Send notification when a quiz is graded."""
        return NotificationService.create(
            recipient=attempt.enrollment.user,
            notification_type='quiz_graded',
            title='Quiz Results Available',
            message=f'Your quiz results are now available.',
            action_url=f'/student/quizzes/{attempt.id}/',
            related_assessment_id=attempt.id,
        )
    
    @staticmethod
    def notify_announcement(announcement, enrolled_users):
        """
        Notify all enrolled students of a new announcement.
        
        Args:
            announcement: Announcement instance
            enrolled_users: QuerySet of User instances enrolled in the program
        """
        return NotificationService.bulk_create(
            recipients=enrolled_users,
            notification_type='announcement',
            title=f'New Announcement: {announcement.title}',
            message=announcement.content[:200] + ('...' if len(announcement.content) > 200 else ''),
            action_url=f'/student/programs/{announcement.program.id}/announcements/',
            related_program_id=announcement.program.id,
        )
    
    @staticmethod
    def notify_instructor_approved(user):
        """Send notification when instructor application is approved."""
        return NotificationService.create(
            recipient=user,
            notification_type='instructor_approved',
            title='Instructor Application Approved',
            message='Congratulations! Your instructor application has been approved. You can now create and manage programs.',
            action_url='/instructor/programs/',
            priority='high',
        )
    
    @staticmethod
    def notify_instructor_rejected(user, reason=''):
        """Send notification when instructor application is rejected."""
        message = 'Your instructor application was not approved at this time.'
        if reason:
            message += f' Reason: {reason}'
        
        return NotificationService.create(
            recipient=user,
            notification_type='instructor_rejected',
            title='Instructor Application Update',
            message=message,
        )
    
    @staticmethod
    def notify_program_approved(program):
        """Send notification when a program is approved for publication."""
        # Notify all instructors assigned to the program
        notifications = []
        for instructor in program.instructors.all():
            notifications.append(
                NotificationService.create(
                    recipient=instructor,
                    notification_type='program_approved',
                    title='Program Approved',
                    message=f'Your program "{program.name}" has been approved and is now published.',
                    action_url=f'/instructor/programs/{program.id}/',
                    related_program_id=program.id,
                    priority='high',
                )
            )
        return notifications
    
    @staticmethod
    def notify_program_changes_requested(program, feedback=''):
        """Send notification when changes are requested for a program."""
        message = f'Changes have been requested for your program "{program.name}".'
        if feedback:
            message += f' Feedback: {feedback}'
        
        notifications = []
        for instructor in program.instructors.all():
            notifications.append(
                NotificationService.create(
                    recipient=instructor,
                    notification_type='program_changes_requested',
                    title='Program Changes Requested',
                    message=message,
                    action_url=f'/instructor/programs/{program.id}/edit/',
                    related_program_id=program.id,
                )
            )
        return notifications
