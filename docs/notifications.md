# Notification System Design

This document outlines the design for user notifications within the Crossview College of Theology and Technology LMS.

## Notification Types

Notifications will be triggered for various events. Key types include:

### 1. Subscription Notifications

*   **`SubscriptionRenewalReminder`**
    *   **Trigger:** Scheduled task checks for subscriptions expiring within a set timeframe (e.g., 7 days).
    *   **Method:** Database notification, Email.
    *   **Recipient:** User whose subscription is expiring.
    *   **Content (Example):** "Your {{ tier_name }} subscription is expiring on {{ expiry_date }}. Renew now to maintain access to premium courses and features."
    *   **Action:** Link to the subscription confirmation page for their current tier (`route('subscriptions.showSubscribeForm', $tier->id)`).

*   **`SubscriptionExpired`**
    *   **Trigger:** Scheduled task checks for subscriptions whose `expires_at` date has passed and status is not 'active' or 'cancelled'.
    *   **Method:** Database notification, Email.
    *   **Recipient:** User whose subscription has just expired.
    *   **Content (Example):** "Your {{ tier_name }} subscription expired on {{ expiry_date }}. Please renew your subscription to regain access."
    *   **Action:** Link to the pricing page (`route('pricing.index')`).

*   **`SubscriptionPaymentSuccess`** (Optional - Covered by status page)
    *   **Trigger:** Successful payment callback completion.
    *   **Method:** Database notification (optional).
    *   **Recipient:** User who made the payment.
    *   **Content (Example):** "Your payment for the {{ tier_name }} subscription was successful. Your subscription is now active until {{ expiry_date }}."
    *   **Action:** Link to Dashboard.

*   **`SubscriptionPaymentFailed`** (Optional - Covered by status page)
    *   **Trigger:** Failed payment callback.
    *   **Method:** Database notification (optional).
    *   **Recipient:** User whose payment failed.
    *   **Content (Example):** "Your payment attempt for the {{ tier_name }} subscription failed. Please try again or update your payment method."
    *   **Action:** Link to Pricing Page.

### 2. Parent Monitoring Notifications (Phase 6)

*   `StudentProgressUpdate`
*   `StudentQuizResult`
*   `StudentEnrollmentChange`

### 3. Gamification Notifications (Phase 8)

*   `BadgeAwarded`
*   `LeaderboardRankChange`

### 4. Course/Content Notifications

*   `NewCourseAnnouncement` (Potentially admin/teacher triggered)
*   `LessonUpdate` (For enrolled students)
*   `QuizReminder`

## Implementation Strategy

1.  **Laravel Notifications:** Utilize Laravel's built-in notification system.
2.  **Channels:** Primarily use `database` (for in-app display) and `mail` channels.
3.  **Notification Classes:** Create dedicated notification classes (e.g., `app/Notifications/SubscriptionRenewalReminder.php`).
4.  **Database Table:** Use the default `notifications` table provided by Laravel (`php artisan notifications:table`).
5.  **Scheduling:** Use Laravel's Task Scheduling for time-based notifications (like expiry reminders).
6.  **Dispatching:** Dispatch notifications from relevant controllers, services, or scheduled commands.
7.  **Frontend Display:** Implement UI elements to display unread database notifications to the user (e.g., in the header navbar).

## Notification Timing Rules (Examples)

*   **Renewal Reminders:** 7 days before expiry.
*   **Expiry Notices:** Within 1 day after expiry.
*   **Real-time Events (Payment, Badge):** Immediately upon event occurrence. 