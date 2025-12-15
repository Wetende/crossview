# JSON Schema Documentation for Crossview College of Theology and Technology

This document outlines the expected JSON structure for various JSON fields in the database. These schemas serve as documentation for developers and ensure consistency across the application.

## Table of Contents
1. [Subscription Tier Features](#subscription-tier-features)
2. [Course Requirements](#course-requirements)
3. [Course What You Will Learn](#course-what-you-will-learn)
4. [Course Tags](#course-tags)
5. [Quiz Question Types & Structures](#quiz-question-types--structures)
   - [Multiple Choice](#multiple-choice)
   - [True/False](#truefalse)
   - [Fill in the Blank](#fill-in-the-blank)
   - [Multiple Response](#multiple-response)
   - [Matching](#matching)
   - [Image Matching](#image-matching)
   - [Keywords](#keywords)
   - [Text Input](#text-input)
6. [Quiz Attempt Answers](#quiz-attempt-answers)
7. [Payment Details](#payment-details)
8. [Payout Details](#payout-details)

## Subscription Tier Features

Stored in the `features` column of the `subscription_tiers` table.

```json
[
  "Feature 1 description",
  "Feature 2 description",
  "Feature 3 description"
]
```

Example:
```json
[
  "Unlimited course access",
  "Priority support",
  "Downloadable resources"
]
```

## Course Requirements

Stored in the `requirements` column of the `courses` table.

```json
[
  "Requirement 1",
  "Requirement 2",
  "Requirement 3"
]
```

Example:
```json
[
  "Basic knowledge of algebra",
  "Computer with internet connection",
  "Recommended: Previous exposure to physics concepts"
]
```

## Course What You Will Learn

Stored in the `what_you_will_learn` column of the `courses` table.

```json
[
  "Learning outcome 1",
  "Learning outcome 2",
  "Learning outcome 3"
]
```

Example:
```json
[
  "Master the fundamentals of calculus",
  "Solve complex differential equations",
  "Apply calculus concepts to real-world problems"
]
```

## Course Tags

Stored in the `tags` column of the `courses` table.

```json
[
  "tag1",
  "tag2",
  "tag3"
]
```

Example:
```json
[
  "mathematics",
  "algebra",
  "beginner"
]
```

## Quiz Question Types & Structures

### Multiple Choice

Stored in the `quiz_questions` table where `question_type` is "multiple_choice".

Options are stored in the `quiz_question_options` table with `is_correct` flag.

### True/False

Stored in the `quiz_questions` table where `question_type` is "true_false".

Options are stored in the `quiz_question_options` table with two options (True/False) and `is_correct` flag.

### Fill in the Blank

Stored in the `quiz_questions` table where `question_type` is "fill_in_blank".

For answers, correct text is stored in the `quiz_attempt_answers` table's `text_answer` field.

### Multiple Response

Stored in the `quiz_questions` table where `question_type` is "multiple_response".

Multiple options in the `quiz_question_options` table can have `is_correct` set to true.

### Matching

Stored in the `quiz_questions` table where `question_type` is "matching".

Options contain pairs that should be matched. Answer format in `quiz_attempt_answers`:

```json
{
  "matches": [
    {"left_id": 1, "right_id": 3},
    {"left_id": 2, "right_id": 1},
    {"left_id": 3, "right_id": 2}
  ]
}
```

### Image Matching

Similar to matching, but with image references:

```json
{
  "matches": [
    {"image_id": 1, "label_id": 3},
    {"image_id": 2, "label_id": 1},
    {"image_id": 3, "label_id": 2}
  ]
}
```

### Keywords

Stored in the `quiz_questions` table where `question_type` is "keywords".

Answer format in `quiz_attempt_answers`:

```json
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
```

### Text Input

Stored in the `quiz_questions` table where `question_type` is "text_input".

For answers, free text is stored in the `quiz_attempt_answers` table's `text_answer` field.

## Quiz Attempt Answers

The structure varies based on question type:

```json
{
  "question_id": 123,
  "answer_type": "multiple_choice",
  "selected_option_id": 456
}
```

Or for multiple response:

```json
{
  "question_id": 123,
  "answer_type": "multiple_response",
  "selected_option_ids": [456, 789]
}
```

Or for text input/fill in blank:

```json
{
  "question_id": 123,
  "answer_type": "text_input",
  "text_answer": "User's answer text"
}
```

## Payment Details

Stored in the `payment_details` JSON column of the `payments` table.

```json
{
  "gateway": "stripe",
  "card_last4": "4242",
  "card_brand": "visa",
  "card_exp_month": 12,
  "card_exp_year": 2025,
  "billing_address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postal_code": "12345",
    "country": "US"
  }
}
```

Or for mobile money:

```json
{
  "gateway": "mobile_money",
  "provider": "MTN",
  "phone_number": "+256712345678",
  "transaction_ref": "MM123456789"
}
```

## Payout Details

Stored in the `payout_details` JSON column of the `teacher_payouts` table.

```json
{
  "payment_method": "bank_transfer",
  "bank_name": "Example Bank",
  "account_number": "XXXXX1234",
  "transaction_ref": "TRF123456789",
  "processing_fee": 2.50,
  "notes": "Monthly payout for course sales"
}
```

Or for mobile money:

```json
{
  "payment_method": "mobile_money",
  "provider": "MTN",
  "phone_number": "+256712345678",
  "transaction_ref": "MM123456789",
  "processing_fee": 1.00,
  "notes": "Weekly payout for course sales"
}
``` 