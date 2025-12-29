# Question Management

This document details how questions are structured, validated, and graded.

## 1. Architecture
We use a **Factory Pattern** combined with a **Strategy Pattern** to handle different question types:
1. **QuestionFactory**: Determines which handler to use based on the `type` field.
2. **Handlers**: Each type (e.g., `multi-choice`, `multiple-select`) has its own handler for:
   - **Validation**: Ensuring the structure is correct (e.g., at least 2 options).
   - **Marking**: Logic for scoring (e.g., "all-or-nothing" for multiple-select).
   - **Rendering**: Stripping sensitive data like `correctAnswer` before sending to participants.

## 2. Supported Types
1. **Multi-Choice**: Single selection from a list of options.
2. **Multiple-Select**: Multiple correct answers allowed; requires selecting all correct options for points.

## 3. Data Integrity
- **Order Management**: Questions have an `order` field to maintain sequence.
- **Transactions**: Adding or deleting a question is atomic, ensuring the `Exam` model's reference list stays accurate.

