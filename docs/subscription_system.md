# Subscription System Documentation

## 1. Overview

The Subscription System for the LMS allows users to subscribe to various tiers, granting them access to courses and features based on their chosen plan. It includes administrative management of subscription tiers, a user-facing flow for purchasing subscriptions (with a simulated payment gateway for now), and logic for managing subscription statuses, including activations, expirations, and downgrades.

## 2. Core Functionalities

-   **Admin Subscription Tier Management:** Admins can create, read, update, and delete (soft delete) subscription tiers, defining their name, description, price, access level, duration, included features, and maximum course enrollments.
-   **User Subscription Purchase Flow:**
    -   Users can view available subscription tiers on a pricing page.
    -   Users can select a tier and proceed to a confirmation/simulated payment step.
    -   A `Payment` record is created with a 'pending' status.
    -   Users are redirected to a "Simulated DPO Page" where they can manually trigger a "Payment Success" or "Payment Failure".
    -   On callback, the system updates the payment status and, if successful, activates the user's subscription.
-   **Subscription Activation & Management:**
    -   The `SubscriptionManagerService` handles the activation of new subscriptions and updates to existing ones.
    -   Ensures a user has only one active subscription at a time.
    -   Calculates subscription start and expiry dates.
-   **Downgrade Logic:**
    -   When a user downgrades to a tier with more restrictions:
        -   Access to courses requiring a higher tier is restricted (enrollment status set to `restricted_tier`).
        -   If the new tier has a `max_courses` limit and the user exceeds it, their oldest active course enrollments (obtained via subscription) are restricted (enrollment status set to `restricted_limit`) until they are within the limit.
-   **Subscription Status Tracking:** `UserSubscription` records track the status (e.g., `active`, `pending`, `expired`, `cancelled`).
-   **Renewal & Expiry (Framework):**
    -   A scheduled command (`CheckSubscriptionExpirationsCommand`) is planned to check for expiring subscriptions and update their status or trigger renewal notifications.
    -   Users can see their current subscription status and expiry date in their profile.
    -   A "Renew" button allows users to renew their current tier, initiating the purchase flow.
-   **Webhook (Placeholder):** A basic webhook controller and route are set up for future integration with actual payment gateway callbacks.

## 3. Key Models & Relationships

-   **`SubscriptionTier` (`app/Models/SubscriptionTier.php`):**
    -   Attributes: `name`, `description`, `price`, `level` (for hierarchy), `duration_days` (0 for unlimited), `is_active`, `features` (JSON), `max_courses` (nullable integer).
    -   Relationships: HasMany `UserSubscription`.
-   **`UserSubscription` (`app/Models/UserSubscription.php`):**
    -   Attributes: `user_id`, `subscription_tier_id`, `started_at`, `expires_at`, `auto_renew` (boolean), `status` (e.g., 'active', 'pending', 'expired', 'cancelled'), `latest_payment_id`, `canceled_at`, `cancellation_reason`.
    -   Relationships: BelongsTo `User`, BelongsTo `SubscriptionTier`, BelongsTo `Payment` (latest payment).
-   **`Payment` (`app/Models/Payment.php`):**
    -   Attributes: `user_id`, `amount`, `currency`, `status` ('pending', 'completed', 'failed'), `payment_gateway`, `gateway_reference_id`, `payable_id`, `payable_type` (polymorphic, e.g., `SubscriptionTier::class` for initial purchase).
    -   Relationships: BelongsTo `User`, MorphTo `payable`.
-   **`User` (`app/Models/User.php`):**
    -   Helper methods: `activeSubscription()`, `hasActiveSubscription()`, `activeSubscriptionTier()`, `countActiveSubscriptionEnrollments()`, `isEnrollmentAllowedByMaxCoursesLimit()`, `canAccessCourseViaSubscription(Course $course)`.
-   **`Enrollment` (`app/Models/Enrollment.php`):**
    -   Attribute: `status` (e.g., `active`, `completed`, `restricted_tier`, `restricted_limit`).
    -   Attribute: `access_type` (e.g., `subscription`, `purchase`).

## 4. Key Controllers & Services

-   **`AdminSubscriptionTierController` (`app/Http/Controllers/Admin/AdminSubscriptionTierController.php`):**
    -   Handles CRUD operations for subscription tiers in the admin panel.
    -   Uses `StoreSubscriptionTierRequest` and `UpdateSubscriptionTierRequest` for validation.
-   **`SubscriptionController` (`app/Http/Controllers/SubscriptionController.php`):**
    -   `index()`: Displays available tiers to users (pricing page).
    -   `showSubscribeForm()`: Shows a confirmation page for a selected tier.
    -   `processSubscription()`: Initiates subscription, creates a pending `Payment`, redirects to simulated DPO.
    -   `showSimulatedDpoPage()`: Displays the page for simulating payment success/failure.
    -   `handlePaymentCallback()`: Handles the simulated callback, updates `Payment`, and triggers `SubscriptionManagerService`.
    -   `showPaymentStatus()`: Displays the final payment/subscription status to the user.
-   **`SubscriptionManagerService` (`app/Services/SubscriptionManagerService.php`):**
    -   `activateSubscription()`: Core logic for activating or updating a user's subscription after successful payment. Handles creation/update of `UserSubscription` and linking to the `Payment`.
    -   Contains logic for handling downgrades, including updating `Enrollment` statuses based on tier restrictions and `max_courses` limits.
-   **`WebhookController` (`app/Http/Controllers/WebhookController.php`):**
    -   `handleDpoPayment()`: Placeholder for receiving and processing actual DPO webhook notifications. Currently logs the request.
-   **`CheckSubscriptionExpirationsCommand` (`app/Console/Commands/CheckSubscriptionExpirationsCommand.php`):**
    -   Scheduled task to manage subscription expiries and potentially trigger renewal notifications.

## 5. Routes

-   **Admin Tier Management:** Grouped under `admin/subscription-tiers` (resourceful routes). Protected by admin middleware.
    -   `GET /admin/subscription-tiers`
    -   `GET /admin/subscription-tiers/create`
    -   `POST /admin/subscription-tiers`
    -   `GET /admin/subscription-tiers/{subscription_tier}/edit`
    -   `PUT/PATCH /admin/subscription-tiers/{subscription_tier}`
    -   `DELETE /admin/subscription-tiers/{subscription_tier}`
-   **User Subscription Flow:**
    -   `GET /subscriptions/tiers` (or `pricing.index`): Pricing page.
    -   `GET /subscriptions/subscribe/{subscription_tier}`: Confirmation page.
    -   `POST /subscriptions/subscribe/{subscription_tier}`: Initiate subscription.
    -   `GET /subscriptions/payment/simulate/{payment}`: Simulated DPO page.
    -   `POST /subscriptions/payment/callback`: Handles simulated DPO callback.
    -   `GET /subscriptions/payment/status`: Shows final payment status.
-   **Webhook:**
    -   `POST /webhooks/dpo-payment`: Endpoint for DPO webhook.

## 6. Database Schema (Relevant Tables & Fields)

-   **`subscription_tiers`:**
    -   `id`, `name`, `description`, `price`, `level`, `duration_days`, `features` (JSON), `max_courses` (INT, nullable), `is_active` (BOOLEAN), `created_at`, `updated_at`, `deleted_at`.
-   **`user_subscriptions`:**
    -   `id`, `user_id` (FK to `users`), `subscription_tier_id` (FK to `subscription_tiers`), `latest_payment_id` (FK to `payments`), `started_at` (DATETIME), `expires_at` (DATETIME, nullable), `status` (VARCHAR), `auto_renew` (BOOLEAN), `canceled_at` (DATETIME, nullable), `cancellation_reason` (TEXT, nullable), `created_at`, `updated_at`, `deleted_at`.
-   **`payments`:**
    -   `id`, `user_id` (FK to `users`), `payable_id` (morphs), `payable_type` (morphs), `amount`, `currency`, `status`, `payment_gateway`, `gateway_reference_id`, `paid_at` (DATETIME, nullable), `created_at`, `updated_at`.
-   **`enrollments`:**
    -   `id`, `user_id`, `course_id`, `status` (VARCHAR, e.g., 'active', 'restricted_tier', 'restricted_limit'), `access_type` (VARCHAR, e.g., 'subscription'), `enrolled_at`, `completed_at`, `progress`, `created_at`, `updated_at`, `deleted_at`.

## 7. Simulated DPO Payment Flow

1.  User selects a subscription tier and confirms.
2.  `SubscriptionController@processSubscription` is called.
3.  A `Payment` record is created with `status = 'pending'`, `payment_gateway = 'simulated_dpo'`, `payable_id` = (selected `SubscriptionTier` ID), and `payable_type = SubscriptionTier::class`.
4.  User is redirected to `SubscriptionController@showSimulatedDpoPage`, passing the `Payment` ID.
5.  The `subscriptions.simulated_dpo_page` view presents "Simulate Success" and "Simulate Failure" buttons.
6.  User clicks one of the buttons, which submits a POST request to `SubscriptionController@handlePaymentCallback`. This request includes the `payment_id`, a `status` ('success' or 'failure'), and a simulated `transaction_id`.
7.  `handlePaymentCallback` finds the `Payment` record.
    -   **If 'success':**
        -   Updates `Payment` status to 'completed', stores `transaction_id`, sets `paid_at`.
        -   Calls `SubscriptionManagerService@activateSubscription`, passing the `User`, the `SubscriptionTier` (retrieved from `Payment->payable`), and the `Payment` record.
        -   The service creates/updates the `UserSubscription` record (status 'active', `started_at`, `expires_at`, `latest_payment_id`).
        -   Redirects to a success status page.
    -   **If 'failure':**
        -   Updates `Payment` status to 'failed', stores `transaction_id`.
        -   Redirects to a failure status page.

## 8. Security Considerations

-   Ensure all routes modifying subscription data or initiating payments are protected by authentication and authorization middleware (e.g., user must be logged in, admin routes for admin actions).
-   Validate all incoming data, especially for tier creation/updates and payment callbacks.
-   The "Simulated DPO Page" should only be accessible by the user who owns the pending payment.
-   When implementing the actual payment gateway, securely handle API keys and webhook verification (e.g., signature checking).

## 9. Future Enhancements (from Phase 2 Plan)

-   **Actual Payment Gateway Integration:** Replace the simulated flow with a real DPO (or other) payment gateway.
-   **Webhook Implementation:** Fully implement webhook handling for asynchronous payment updates from the gateway, including signature verification and robust error handling.
-   **Proration for Upgrades/Downgrades:** Implement logic to calculate prorated charges or credits when users change tiers mid-cycle.
-   **Detailed Renewal Notifications:** Implement user notifications for upcoming renewals, successful renewals, and payment failures during renewal attempts.
-   **Automated Renewals:** If `auto_renew` is true, attempt to charge the user automatically before expiry.
-   **Grace Periods:** Implement grace periods for failed renewal payments.
-   **Comprehensive Subscription Management UI:** Allow users to view subscription history, cancel subscriptions, update payment methods, etc.

This document will be updated as the subscription system evolves. 