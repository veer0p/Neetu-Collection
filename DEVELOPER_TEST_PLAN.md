# Developer Test Plan: Neetu Collection Business Logic

This document outlines the test cases for the Neetu Collection application, focusing on the service layer and data flows.

## 1. Authentication Flow
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| AUTH-01 | New User Registration | Call `signUp` with new phone/pin | User profile created, stored in local storage. |
| AUTH-02 | User Sign In | Call `signIn` with valid credentials | Profile returned, stored in local storage. |
| AUTH-03 | Sign Out | Call `signOut` | Local storage cleared. |

## 2. Directory & Master Data
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| DIR-01 | Add Master Data | Add 1 Product, 1 Vendor, 1 Customer, 1 Pickup Person | Items visible in `getDirectory`. |
| DIR-02 | Balance Tracking | Check `getDirectoryWithBalances` initially | All balances should be 0. |

## 3. Order Lifecycle & Automated Ledger (The Core)
This sequence tests the "Cascading Ledger" logic in `saveOrder`.

### Phase A: Order Creation
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| ORD-01 | Create New Order (Pending) | Save order with Original: 1000, Selling: 1500 | 1. Order status 'Pending'.<br>2. Ledger: Customer Debit (+1500 Sale).<br>3. Ledger: Vendor Credit (-1000 Purchase). |
| ORD-02 | Verify Margin Calculation | Fetch order from DB | Margin should be 500 (Selling - Original). |

### Phase B: Status & Pickup Workflow
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| ORD-03 | Add Pickup Boy & Charges | Update order with Pickup Person (Charges: 50) and Shipping (100) | 1. Order updated.<br>2. Ledger: Previous entries deleted.<br>3. Ledger: Expense entries added for Pickup Boy. |
| ORD-04 | Pickup Boy Payment (DriverPaid) | Toggle `paidByDriver: true` | 1. Ledger: Vendor gets PaymentOut (settled).<br>2. Ledger: Pickup Person gets Reimbursement (cost cost). |

### Phase C: Final Settlement
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| ORD-05 | Customer Payment | Set `customerPaymentStatus: 'Paid'` | Ledger: PaymentIn added for Customer (-1500). Customer balance becomes 0. |
| ORD-06 | Multi-Party Settlement | Set Vendor & Pickup Status to 'Paid' | Ledger: All balances for this order should net to 0 for all parties. |

## 4. Calendar & History
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| HIST-01 | Status History Updates | Update order status to 'Booked', then 'Shipped' | `statusHistory` array should have 3 entries with timestamps. |
| CAL-01 | Calendar Data Mapping | Fetch `getTransactions` | Transaction should appear with correctly mapped `statusHistory`. |

## 5. Cleanup
| ID | Test Case | Action | Expected Result |
|----|-----------|--------|-----------------|
| DEL-01 | Delete Order | Delete the test order | Order removed, but Ledger history persists (standard accounting practice) OR deleted if cascading. |
| DEL-02 | Delete Contacts | Delete test items from Directory | Items removed. |
