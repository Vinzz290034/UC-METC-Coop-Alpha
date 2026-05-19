# Requirements Document: Payment Method Selection at Checkout

## Introduction

This document specifies the requirements for adding payment method selection functionality to the UC METC Coop e-commerce checkout flow. The feature enables students to select their preferred payment method (Cash or E-Wallet) during checkout, with the selected method stored in the order and displayed to staff for payment verification.

The current system creates orders without capturing payment method preference from users. This enhancement will allow students to indicate their payment method choice upfront, improving the in-person payment verification workflow at the Coop office.

## Glossary

- **Checkout_UI**: The user interface component in CartPage.tsx where students review their cart and initiate order creation
- **Order_Creation_Service**: The backend service (AppDataSync.createOrderFromCart) that processes cart items and creates orders via the API
- **Payment_Method**: An enumerated value indicating the customer's payment choice, either "cash" or "ewallet"
- **E-Wallet**: Electronic wallet payment method (e.g., GCash, PayMaya) where students pay digitally
- **Reference_Number**: An optional alphanumeric identifier provided by students for e-wallet transactions
- **Pending_Orders_View**: The staff interface in SalesPage.tsx that displays orders awaiting payment verification
- **Order_API**: The backend REST endpoint (/orders/create) that persists order data to the database
- **Orders_Table**: The database table storing order records with payment_method field

## Requirements

### Requirement 1: Payment Method Selection at Checkout

**User Story:** As a student, I want to select my payment method during checkout, so that the Coop staff knows how I intend to pay when I arrive at the office.

#### Acceptance Criteria

1. WHEN a student views the checkout confirmation modal, THE Checkout_UI SHALL display payment method selection options for "Cash" and "E-Wallet"
2. THE Checkout_UI SHALL require the student to select exactly one payment method before allowing order submission
3. WHEN a student selects "Cash", THE Checkout_UI SHALL enable the checkout button without additional fields
4. WHEN a student selects "E-Wallet", THE Checkout_UI SHALL display an optional reference number input field
5. WHEN a student submits the checkout form, THE Order_Creation_Service SHALL include the selected Payment_Method in the order creation request

### Requirement 2: E-Wallet Reference Number Capture

**User Story:** As a student using e-wallet payment, I want to optionally provide a reference number during checkout, so that staff can verify my transaction more easily.

#### Acceptance Criteria

1. WHEN "E-Wallet" is selected as the Payment_Method, THE Checkout_UI SHALL display a text input field labeled "Reference Number (Optional)"
2. THE Checkout_UI SHALL accept alphanumeric input for the reference number field
3. WHEN a reference number is provided, THE Order_Creation_Service SHALL include it in the order creation request
4. WHEN no reference number is provided, THE Order_Creation_Service SHALL submit the order without a reference number value

### Requirement 3: Order Creation with Payment Method

**User Story:** As the system, I want to persist the selected payment method with each order, so that staff can view payment preferences for pending orders.

#### Acceptance Criteria

1. WHEN the Order_Creation_Service sends an order creation request, THE Order_API SHALL accept a payment_method parameter with values "cash" or "ewallet"
2. THE Order_API SHALL store the payment_method value in the Orders_Table
3. WHEN payment_method is not provided in the request, THE Order_API SHALL default to "cash" for backward compatibility
4. THE Order_API SHALL validate that payment_method is either "cash" or "ewallet" before persisting the order

### Requirement 4: Payment Method Display in Pending Orders

**User Story:** As a Coop staff member, I want to see the payment method for each pending order, so that I know how the customer intends to pay.

#### Acceptance Criteria

1. WHEN staff views the Pending_Orders_View, THE Pending_Orders_View SHALL display the Payment_Method for each order
2. WHEN the Payment_Method is "cash", THE Pending_Orders_View SHALL display "Cash" or a cash icon
3. WHEN the Payment_Method is "ewallet", THE Pending_Orders_View SHALL display "E-Wallet" or an e-wallet icon (📱)
4. THE Pending_Orders_View SHALL display the reference number when present for e-wallet orders

### Requirement 5: Payment Method Validation

**User Story:** As the system, I want to validate payment method data, so that only valid payment methods are stored in orders.

#### Acceptance Criteria

1. THE Order_Creation_Service SHALL validate that Payment_Method is either "cash" or "ewallet" before submitting to the API
2. WHEN an invalid Payment_Method value is provided, THE Order_Creation_Service SHALL reject the order creation and display an error message
3. THE Order_API SHALL enforce the CHECK constraint on the payment_method column to only allow "cash" or "ewallet" values
4. WHEN the Order_API receives an invalid payment_method value, THE Order_API SHALL return a 400 error response with a descriptive message

### Requirement 6: User Interface Clarity

**User Story:** As a student, I want clear instructions about the payment process, so that I understand what to do after placing my order.

#### Acceptance Criteria

1. THE Checkout_UI SHALL display explanatory text indicating that payment will be completed at the Coop office
2. WHEN "E-Wallet" is selected, THE Checkout_UI SHALL display instructions that students should pay at the Coop office where staff will verify the transaction in real-time
3. THE Checkout_UI SHALL maintain the existing checkout flow steps (review items, proceed to payment at office, collect items)
4. THE Checkout_UI SHALL use clear, concise labels for payment method options without technical jargon

### Requirement 7: Default Payment Method Behavior

**User Story:** As a developer, I want sensible default behavior for payment method selection, so that the user experience is smooth and intuitive.

#### Acceptance Criteria

1. WHEN the checkout modal opens, THE Checkout_UI SHALL not pre-select any payment method by default
2. THE Checkout_UI SHALL disable the checkout button until a payment method is selected
3. WHEN a student closes and reopens the checkout modal, THE Checkout_UI SHALL reset the payment method selection to no selection
4. THE Checkout_UI SHALL clear the reference number field when switching from "E-Wallet" to "Cash"

### Requirement 8: Backward Compatibility

**User Story:** As a system administrator, I want the payment method feature to work with existing orders, so that historical data remains accessible.

#### Acceptance Criteria

1. WHEN displaying orders created before this feature was implemented, THE Pending_Orders_View SHALL display "Cash" as the default payment method
2. THE Order_API SHALL continue to accept order creation requests without a payment_method parameter
3. WHEN payment_method is omitted from an order creation request, THE Order_API SHALL default to "cash"
4. THE system SHALL display existing orders in the Pending_Orders_View without errors regardless of whether payment_method was explicitly set

### Requirement 9: Reference Number Storage

**User Story:** As the system, I want to store e-wallet reference numbers with orders, so that staff can reference them during payment verification.

#### Acceptance Criteria

1. THE Orders_Table SHALL include a reference_number column to store optional e-wallet reference numbers
2. WHEN a reference number is provided, THE Order_API SHALL store it in the reference_number column
3. WHEN no reference number is provided, THE Order_API SHALL store NULL in the reference_number column
4. THE Order_API SHALL accept reference numbers up to 100 characters in length

### Requirement 10: Payment Method in Order History

**User Story:** As a student, I want to see the payment method I selected when viewing my order history, so that I can confirm my payment choice.

#### Acceptance Criteria

1. WHEN a student views their order history in the Transaction page, THE system SHALL display the Payment_Method for each order
2. THE system SHALL display "Cash" for orders with payment_method value "cash"
3. THE system SHALL display "E-Wallet" for orders with payment_method value "ewallet"
4. WHEN a reference number exists for an e-wallet order, THE system SHALL display it in the order details

