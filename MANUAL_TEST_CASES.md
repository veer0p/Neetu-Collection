# Neetu Collection — Manual Test Cases

> **Date:** 29 March 2026  
> **Priority:** 🔴 Critical (CssInterop fix) · 🟡 High · 🟢 Medium  
> **Legend:** ✅ Pass · ❌ Fail · ⏭️ Not Tested  

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [Dashboard](#2-dashboard)
3. [Add Entry / New Order](#3-add-entry--new-order)
4. [Orders (Transactions)](#4-orders-transactions)
5. [Order Detail](#5-order-detail)
6. [Ledger](#6-ledger)
7. [Account Detail](#7-account-detail)
8. [Directory](#8-directory)
9. [Insights (Reports)](#9-insights-reports)
10. [Calendar](#10-calendar)
11. [Calculator](#11-calculator)
12. [Settings](#12-settings)
13. [Navigation & General UI](#13-navigation--general-ui)
14. [Dark Mode (Cross-Screen)](#14-dark-mode-cross-screen)

---

## 1. Authentication & Security

### 1.1 Sign Up

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 1.1.1 | New account creation | 1. On Login screen, tap "Don't have an account? Sign Up"<br>2. Enter full name, 10-digit phone, 4-digit PIN<br>3. Tap "Create Account" | Success dialog: "Account created! You can now sign in." Form switches back to Sign In mode | 🟡 |
| 1.1.2 | Validation — empty fields | 1. Leave all fields empty<br>2. Tap "Create Account" | Error dialog: "Please fill in all fields." | 🟡 |
| 1.1.3 | Validation — short phone | 1. Enter name, 5-digit phone, 4-digit PIN<br>2. Tap "Create Account" | Error dialog: "Please enter a valid 10-digit phone number." | 🟡 |
| 1.1.4 | Validation — short PIN | 1. Enter name, 10-digit phone, 2-digit PIN<br>2. Tap "Create Account" | Error dialog: "PIN must be at least 4 digits." | 🟡 |
| 1.1.5 | Duplicate phone | 1. Sign up with an already registered phone number | Error dialog with appropriate message from Supabase | 🟢 |

### 1.2 Sign In

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 1.2.1 | Successful login | 1. Enter valid phone + PIN<br>2. Tap "Sign In" | Navigates to Dashboard (or LockScreen if biometrics enabled) | 🟡 |
| 1.2.2 | Wrong credentials | 1. Enter invalid phone or wrong PIN<br>2. Tap "Sign In" | Error dialog: "Authentication failed." | 🟡 |
| 1.2.3 | Loading state | 1. Tap "Sign In" with valid credentials | Button text changes to "Processing..." with no arrow icon. Button should be disabled (no double-tap) | 🟢 |

### 1.3 Biometric Lock Screen

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 1.3.1 | Auto-prompt on launch | 1. Enable biometrics in Settings<br>2. Close and reopen app | Lock screen appears → biometric prompt shows after 500ms | 🟡 |
| 1.3.2 | Successful unlock | 1. Authenticate with fingerprint/face | App unlocks → navigates to MainTabs (Dashboard) | 🟡 |
| 1.3.3 | Failed unlock | 1. Cancel or fail biometric auth | Error message: "Authentication failed. Try again." Button remains to retry | 🟡 |
| 1.3.4 | Manual retry | 1. After failed auth, tap "Use Biometrics" button | Biometric prompt appears again | 🟢 |

---

## 2. Dashboard

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 2.1 | Greeting display | 1. Open Dashboard at different times of day | Shows "Good Morning" (before 12pm), "Good Afternoon" (12-5pm), or "Good Evening" (after 5pm) + user name with 👋 | 🟢 |
| 2.2 | Hero profit card | 1. Check Monthly Profit card at top | Shows `₹X,XXX` for this month's total profit. Shows order count badge. Shows week-over-week % change (green ↑ or red ↓) and "₹X this week" text | 🟡 |
| 2.3 | Receivable/Payable cards | 1. View the two cards below hero | **Left card:** Green, shows total amount owed TO you + "X people owe you". **Right card:** Red, shows total amount you OWE + "You owe X vendors" | 🟡 |
| 2.4 | Net Position card | 1. View the Net Position row | Shows `₹X` in green (net positive) or red (net negative) with corresponding "Net positive/negative" label. Tapping navigates to Ledger | 🟡 |
| 2.5 | Alerts section | 1. Have orders undelivered >5 days or account balances >₹10,000 | "Needs Attention" section appears with alert cards: "X orders undelivered >5 days" and/or "₹X overdue from [Name]" | 🟡 |
| 2.6 | Recent Orders | 1. View recent orders list (max 5) | Shows product name, customer name, amount, payment dot (green=Paid, orange=Udhar), and status badge (color-coded). Tapping an order navigates to OrderDetail | 🟡 |
| 2.7 | Quick Actions | 1. Tap "New Order" | Navigates to AddEntry screen | 🟢 |
| 2.8 | Quick Actions | 1. Tap "Ledger" | Navigates to Ledger screen | 🟢 |
| 2.9 | Quick Actions | 1. Tap "Insights" | Navigates to Insights/Reports screen | 🟢 |
| 2.10 | Pull-to-refresh | 1. Pull down on Dashboard | RefreshControl spinner appears → data reloads → spinner disappears. All stats, alerts, and recent orders update | 🟡 |
| 2.11 | Empty state | 1. Login with a fresh account (no data) | No crash. Shows ₹0 everywhere. No alerts or recent orders sections | 🟢 |

---

## 3. Add Entry / New Order

### 3.1 Creating a New Order

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 3.1.1 | Basic order creation | 1. Tap + (New Order)<br>2. Select Product, Customer, Vendor from dropdowns<br>3. Enter cost price and sale price<br>4. Leave defaults (Booked, Udhar for all)<br>5. Tap "Save Order" | Order saved. Navigates back. Order appears in Transactions and Dashboard. Margin = selling - cost price. Ledger entries created | 🟡 |
| 3.1.2 | With Pickup Person | 1. Select a Pickup Person from dropdown<br>2. Enter pickup charges<br>3. Save | Order saved with pickup person. Margin = selling - cost - pickup charges. Pickup ledger entry created | 🟡 |
| 3.1.3 | With shipping | 1. Enter shipping charges + tracking ID + courier name<br>2. Save | Order saved with shipping info. Margin deducts shipping charges. Tracking info visible in OrderDetail | 🟡 |
| 3.1.4 | Date picker | 1. Tap the date field<br>2. Select a different date | Date picker opens. Selected date reflected in form in DD/MM/YYYY format | 🟢 |
| 3.1.5 | Status selection | 1. Tap Status dropdown<br>2. Select each status (Pending, Booked, Shipped, Delivered, Canceled, Returned) | Bottom sheet picker opens with all 6 options. Selected status shown in form | 🟢 |

### 3.2 Payment Status Toggles (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 3.2.1 | Customer payment toggle | 1. In new order form, tap "Paid" under Customer Payment<br>2. Tap "Udhar" again<br>3. Rapidly toggle multiple times | **🔴 NO CRASH.** Toggle smoothly changes: active = colored background (green for Paid), inactive = transparent. Text changes to white when active, gray when inactive | 🔴 |
| 3.2.2 | Vendor payment toggle (3-way) | 1. Toggle between "Udhar", "Paid", "Driver Paid"<br>2. Rapidly toggle all 3 | **🔴 NO CRASH.** Each option highlights with appropriate color (red for danger, green for success, blue for driver). Only one option active at a time | 🔴 |
| 3.2.3 | Pickup payment toggle | 1. Select a pickup person to show the pickup payment toggle<br>2. Toggle between "Paid" and "Udhar"<br>3. Rapidly toggle | **🔴 NO CRASH.** Same smooth toggle behavior as customer payment | 🔴 |

### 3.3 Editing an Existing Order

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 3.3.1 | Pre-filled form | 1. From OrderDetail, tap Edit (pencil) icon | AddEntry opens with ALL fields pre-filled from the order (product, customer, vendor, prices, status, payment statuses, date, notes, tracking) | 🟡 |
| 3.3.2 | Edit and save | 1. Change the selling price<br>2. Tap "Update Order" | Order updated. Margin recalculated. Navigates back. OrderDetail reflects new values | 🟡 |
| 3.3.3 | Change payment status on edit | 1. Edit an order<br>2. Change customer payment from "Udhar" to "Paid"<br>3. Save | **🔴 NO CRASH on toggle.** Payment status updated. Ledger may be auto-settled | 🔴 |

### 3.4 Validation

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 3.4.1 | Missing required fields | 1. Leave product/customer/vendor empty<br>2. Tap Save | Validation error appears. Order not saved | 🟡 |
| 3.4.2 | Keyboard flow | 1. Fill product, then tap next<br>2. Continue through all fields | Keyboard moves to next field in order: Product → Customer → Vendor → Cost → Sale → Shipping → Notes. Keyboard doesn't close between fields | 🟢 |

---

## 4. Orders (Transactions)

### 4.1 Order List

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 4.1.1 | List display | 1. Navigate to Orders tab | Shows list of all orders with: product name, customer/vendor names, selling price, margin, date, and color-coded status badge | 🟡 |
| 4.1.2 | Search | 1. Type a product name in search bar | List filters to matching orders. Search matches against product name, customer name, vendor name | 🟡 |
| 4.1.3 | Pull-to-refresh | 1. Pull down on orders list | Data refreshes. New orders appear if added from another interaction | 🟢 |
| 4.1.4 | Tap order | 1. Tap any order in the list | Navigates to OrderDetail screen for that order | 🟡 |

### 4.2 Status Filter Chips (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 4.2.1 | Filter by All | 1. Tap "All" chip at top | **🔴 NO CRASH.** All chip highlighted (indigo background, white text). Count shown: "All (N)". All orders displayed | 🔴 |
| 4.2.2 | Filter by Booked | 1. Tap "Booked" chip | **🔴 NO CRASH.** Booked chip becomes active (indigo). Only Booked orders shown. "All" chip deactivates (white/dark bg) | 🔴 |
| 4.2.3 | Filter by Shipped | 1. Tap "Shipped" chip | **🔴 NO CRASH.** Only Shipped orders shown | 🔴 |
| 4.2.4 | Filter by Delivered | 1. Tap "Delivered" chip | **🔴 NO CRASH.** Only Delivered orders shown | 🔴 |
| 4.2.5 | Filter by Canceled | 1. Tap "Canceled" chip | **🔴 NO CRASH.** Only Canceled orders shown. List may be empty | 🔴 |
| 4.2.6 | Filter by Returned | 1. Tap "Returned" chip | **🔴 NO CRASH.** Only Returned orders shown. List may be empty | 🔴 |
| 4.2.7 | Rapid switching | 1. Rapidly tap between All → Booked → Shipped → Delivered → All | **🔴 NO CRASH.** Each chip activates/deactivates correctly. List updates instantly | 🔴 |
| 4.2.8 | Empty filter result | 1. Tap a status with no matching orders | Empty state shown. No crash | 🟢 |

### 4.3 Bulk Operations

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 4.3.1 | Bulk select mode | 1. Long-press an order | Selection mode activates. Checkboxes appear on all orders. Selected order has filled checkbox | 🟡 |
| 4.3.2 | Bulk delete | 1. Select multiple orders<br>2. Tap delete action | Confirm dialog appears. On confirm, selected orders deleted. List updates | 🟡 |

---

## 5. Order Detail

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 5.1 | Header display | 1. Open any order detail | Shows product name as title, status badge (color-coded), and date. Edit and Delete icons in header | 🟡 |
| 5.2 | Net Margin card | 1. Check the margin card | Shows `₹X` = sellingPrice − originalPrice − pickupCharges − shippingCharges. Green if positive, red if negative | 🟡 |
| 5.3 | Payment Status section | 1. Check payment status rows | Shows Customer, Vendor, and (if pickup person exists) Pickup rows with Paid (green pill) or Udhar (orange pill) badges | 🟡 |
| 5.4 | Order Details section | 1. Check info rows | Shows: Product, Customer, Vendor, Pickup (if any), Original Price, Selling Price (green), Pickup Charges (red, if >0), Shipping (red, if >0) | 🟡 |
| 5.5 | Shipping Info | 1. Open an order with tracking ID / courier name | Shipping Info card shows with Tracking ID and Courier name | 🟢 |
| 5.6 | Status Timeline | 1. Check timeline section | Shows status history entries with dots, dates, times. Latest entry has accent dot + "Current Status" label. If no history, shows single entry with current status | 🟡 |
| 5.7 | Ledger History | 1. Check ledger history section | Shows all ledger entries for this order with: transaction type, person name, amount (green +₹ for credit, red -₹ for debit) | 🟡 |
| 5.8 | Edit order | 1. Tap Edit (pencil) icon | Navigates to AddEntry with order data pre-filled | 🟡 |
| 5.9 | Delete order | 1. Tap Delete (trash) icon<br>2. Confirm in dialog | Confirm dialog: "This will also delete related ledger entries. This action cannot be undone." On confirm, order deleted, navigates back | 🟡 |
| 5.10 | No order data | 1. Navigate to OrderDetail without order params (edge case) | Shows "No order data" text. No crash | 🟢 |

---

## 6. Ledger

### 6.1 Account List

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 6.1.1 | List display | 1. Navigate to Ledger tab | Shows list of all people (customers, vendors, pickup persons) with: name, type badge, and balance. Positive balance (green) = they owe you. Negative balance (red) = you owe them | 🟡 |
| 6.1.2 | Search | 1. Type a name in search bar | List filters to matching accounts | 🟡 |
| 6.1.3 | Tap account | 1. Tap any account | Navigates to AccountDetail screen for that person | 🟡 |

### 6.2 Filter Chips (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 6.2.1 | Filter All | 1. Tap "All" chip | **🔴 NO CRASH.** All chip active (indigo). All accounts shown | 🔴 |
| 6.2.2 | Filter Customers | 1. Tap "Customers" chip | **🔴 NO CRASH.** Only customer accounts shown. Chip becomes active | 🔴 |
| 6.2.3 | Filter Vendors | 1. Tap "Vendors" chip | **🔴 NO CRASH.** Only vendor accounts shown | 🔴 |
| 6.2.4 | Filter Pickup | 1. Tap "Pickup" chip | **🔴 NO CRASH.** Only pickup person accounts shown | 🔴 |
| 6.2.5 | Rapid switching | 1. Rapidly toggle All → Customers → Vendors → Pickup → All | **🔴 NO CRASH.** Smooth transitions. Correct filtering each time | 🔴 |

### 6.3 Summary Section

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 6.3.1 | Receivable total | 1. Check green "Receivable" summary | Shows total of all positive balances. Number matches sum of green account balances | 🟡 |
| 6.3.2 | Payable total | 1. Check red "Payable" summary | Shows total of all negative balances (shown as positive ₹). Number matches sum of red account balances | 🟡 |

---

## 7. Account Detail

### 7.1 Account Header & Balance

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 7.1.1 | Balance display | 1. Open any account | Shows person name, type, and balance. Positive = green ▲ "Receivable" (they owe you). Negative = red ▼ "Payable" (you owe them) | 🟡 |
| 7.1.2 | Vendor account filtering | 1. Open a Vendor account where driver paid for some orders | "Paid by driver" PaymentOut entries are hidden (these are internal bookkeeping). Balance still correct | 🟡 |

### 7.2 Type Filter Tabs (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 7.2.1 | Filter All | 1. Tap "All" tab | **🔴 NO CRASH.** All ledger entries shown. Tab highlighted with indigo background | 🔴 |
| 7.2.2 | Filter Sale | 1. Tap "Sale" tab | **🔴 NO CRASH.** Only Sale-type entries shown | 🔴 |
| 7.2.3 | Filter Purchase | 1. Tap "Purchase" tab | **🔴 NO CRASH.** Only Purchase-type entries shown | 🔴 |
| 7.2.4 | Filter Payment In / Payment Out | 1. Tap "Payment In" or "Payment Out" tab | **🔴 NO CRASH.** Only matching entries shown | 🔴 |
| 7.2.5 | Rapid filter switching | 1. Rapidly toggle between All → Sale → Purchase → PaymentIn → All | **🔴 NO CRASH.** Each filter applies correctly | 🔴 |

### 7.3 Add Payment

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 7.3.1 | Open payment modal | 1. Tap + button (Add Payment) | Payment modal opens | 🟡 |
| 7.3.2 | Payment In/Out toggle (🔴) | 1. In payment modal, toggle between "Payment In" and "Payment Out"<br>2. Rapidly toggle multiple times | **🔴 NO CRASH.** IN = green highlight, OUT = red highlight. Toggle switches smoothly | 🔴 |
| 7.3.3 | Add Payment In | 1. Select "Payment In"<br>2. Enter amount (e.g., ₹500)<br>3. Add notes<br>4. Tap "Record Payment" | Payment recorded. Balance decreases by ₹500 (they paid you). New PaymentIn entry appears in ledger list | 🟡 |
| 7.3.4 | Add Payment Out | 1. Select "Payment Out"<br>2. Enter amount<br>3. Tap "Record Payment" | Payment recorded. Balance increases by payment amount (you paid them). New PaymentOut entry appears | 🟡 |
| 7.3.5 | Empty amount | 1. Leave amount empty<br>2. Tap "Record Payment" | Nothing happens (button should be disabled or no action) | 🟢 |

### 7.4 Ledger Entry Actions

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 7.4.1 | Settle entry | 1. Long-press an unsettled ledger entry<br>2. Tap "Settle" | Confirm dialog appears. On confirm, entry marked as settled (lock icon appears). Entry visually changes | 🟡 |
| 7.4.2 | Delete entry | 1. Select a ledger entry<br>2. Tap delete option | Confirm dialog: warns about permanent deletion. On confirm, entry removed. Balance updates | 🟡 |
| 7.4.3 | Edit notes | 1. Tap on a ledger entry<br>2. Edit notes in modal<br>3. Save | Notes updated for the entry | 🟢 |

### 7.5 Statement Sharing

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 7.5.1 | Open share modal | 1. Tap Share button on Account Detail | Share modal opens with date range picker and Full/Udhar toggle | 🟡 |
| 7.5.2 | Share type toggle (🔴) | 1. Toggle between "Full" and "Udhar" statements<br>2. Rapidly toggle | **🔴 NO CRASH.** Toggle switches smoothly between Full (indigo) and Udhar (indigo). No flicker, no errors | 🔴 |
| 7.5.3 | Quick date ranges | 1. Tap "Today", "Week", "Month", "All" quick buttons | Date pickers update to show correct ranges | 🟡 |
| 7.5.4 | Generate Full statement | 1. Select Full, set date range<br>2. Tap "Generate & Share" | PDF generated with: business logo, person name, date range, ALL transactions in range (sorted by date), running balance, UPI ID (if set). System share sheet opens | 🟡 |
| 7.5.5 | Generate Udhar statement | 1. Select Udhar<br>2. Generate | PDF contains ONLY unsettled non-payment entries (no PaymentIn, PaymentOut, or settled entries). Shows outstanding balance | 🟡 |
| 7.5.6 | No data in range | 1. Set a date range with no transactions<br>2. Tap Generate | Alert: "No transactions found for the selected range." No PDF generated | 🟡 |

### 7.6 Bulk Operations

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 7.6.1 | Select by date | 1. In selection mode, tap a date header | All entries for that date get selected/deselected as a group | 🟡 |
| 7.6.2 | Bulk Cancel | 1. Select orders<br>2. Tap Cancel action | Action modal appears with refund options. On confirm, selected orders canceled. Ledger updated | 🟡 |
| 7.6.3 | Bulk Return | 1. Select orders<br>2. Tap Return action<br>3. Enter return fee | Orders processed as returned with fee. Ledger updated | 🟡 |
| 7.6.4 | Exit selection mode (back button) | 1. Enter selection mode<br>2. Press hardware back button | Selection mode exits. Selections cleared. Normal view restored | 🟡 |

---

## 8. Directory

### 8.1 Directory List

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 8.1.1 | List display | 1. Navigate to Directory tab | Shows list of all directory items grouped by type: Customer, Vendor, Product, Pickup Person. Each shows name, phone (if set), and type badge | 🟡 |
| 8.1.2 | Search | 1. Type a name in search bar | List filters to matching items across all types | 🟡 |

### 8.2 Type Filter Tabs (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 8.2.1 | Filter Customer | 1. Tap "Customer" tab | **🔴 NO CRASH.** Tab becomes active (indigo bg, white text + icon). Only customers shown | 🔴 |
| 8.2.2 | Filter Vendor | 1. Tap "Vendor" tab | **🔴 NO CRASH.** Only vendors shown | 🔴 |
| 8.2.3 | Filter Product | 1. Tap "Product" tab | **🔴 NO CRASH.** Only products shown | 🔴 |
| 8.2.4 | Filter Pickup Person | 1. Tap "Pickup" tab | **🔴 NO CRASH.** Only pickup persons shown | 🔴 |
| 8.2.5 | Rapid switching | 1. Rapidly toggle Customer → Vendor → Product → Pickup → Customer | **🔴 NO CRASH.** Smooth tab transitions with correct icon colors (white active, gray inactive) | 🔴 |

### 8.3 CRUD Operations

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 8.3.1 | Add new item | 1. Tap + button<br>2. Enter name, phone, type<br>3. Save | New item appears in directory under correct type | 🟡 |
| 8.3.2 | Edit item | 1. Tap on existing item<br>2. Modify fields<br>3. Save | Item updated in list | 🟡 |
| 8.3.3 | Delete item | 1. Delete a directory item | Confirm dialog. On confirm, item removed from list | 🟡 |
| 8.3.4 | Tap to view account | 1. Tap a Customer/Vendor/Pickup item | Navigates to AccountDetail for that person (shows their ledger) | 🟡 |

---

## 9. Insights (Reports)

### 9.1 Tab Switching (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 9.1.1 | Switch to Snapshot | 1. Tap "Snapshot" tab | **🔴 NO CRASH.** Tab becomes active (indigo bg, white text). Overview KPI cards shown with Total Revenue, Total Profit, Avg Margin, Logistics Cost | 🔴 |
| 9.1.2 | Switch to Intelligence | 1. Tap "Intelligence" tab | **🔴 NO CRASH.** Tab becomes active. AI-generated insight cards shown (e.g., top product analysis, risk alerts) | 🔴 |
| 9.1.3 | Switch to Analytics | 1. Tap "Analytics" tab | **🔴 NO CRASH.** Tab becomes active. Analytics section shown with top products, customers, vendors lists | 🔴 |
| 9.1.4 | Rapid tab switching | 1. Rapidly tap Snapshot → Intelligence → Analytics → Snapshot | **🔴 NO CRASH.** No flicker. Content updates smoothly each time. Only active tab has indigo background | 🔴 |

### 9.2 Snapshot Tab Content

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 9.2.1 | KPI Cards | 1. Check the 4 KPI cards | Shows: Total Revenue (₹), Total Profit (₹), Avg Margin (₹), Logistics Cost (₹). Each with icon and subtitle | 🟡 |
| 9.2.2 | Status Distribution | 1. Check "Revenue by Status" section | Mini bar charts showing revenue per status (Delivered, Shipped, Booked, etc.) with proportional bars | 🟡 |

### 9.3 Intelligence Tab Content

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 9.3.1 | Insight cards | 1. Check intelligence insights | Shows cards with badge labels (ACTION, INSIGHT, WARNING), title, and description based on business data | 🟡 |

### 9.4 Analytics Tab Content

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 9.4.1 | Top Products | 1. Check "Top Products" section | Shows ranked list of products by total revenue with amounts | 🟡 |
| 9.4.2 | Top Customers | 1. Check "Top Customers" section | Shows ranked list of customers by total spending | 🟡 |
| 9.4.3 | Top Vendors | 1. Check "Top Vendors" section | Shows ranked list of vendors by total purchases | 🟡 |

### 9.5 Edge Cases

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 9.5.1 | Empty data | 1. Open Insights with no orders | Loading spinner if loading. Otherwise shows empty/zero state. No crash | 🟢 |
| 9.5.2 | Loading state | 1. Open Insights while data is loading | Loading spinner displayed. Content renders after data loads | 🟢 |

---

## 10. Calendar

### 10.1 Date Selection (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 10.1.1 | Select a date | 1. Tap any date in the calendar | **🔴 NO CRASH.** Selected date highlights with indigo circle. Text turns white and bold. Previously selected date returns to normal | 🔴 |
| 10.1.2 | Rapid date selection | 1. Quickly tap 5 different dates in succession | **🔴 NO CRASH.** Each tap immediately highlights the new date and unhighlights the previous one | 🔴 |
| 10.1.3 | Day orders display | 1. Select a date that has orders | Orders for that date displayed below the calendar with: product, customer, amount, status | 🟡 |
| 10.1.4 | Empty date | 1. Select a date with no orders | Shows empty state or "No orders" message. No crash | 🟢 |

### 10.2 Month Navigation

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 10.2.1 | Navigate to next month | 1. Tap right arrow (→) | Calendar renders next month. Correct days, correct first-day offset | 🟡 |
| 10.2.2 | Navigate to previous month | 1. Tap left arrow (←) | Calendar renders previous month | 🟡 |
| 10.2.3 | February edge case | 1. Navigate to February 2026 | Shows 28 days (non-leap year). Correct weekday alignment | 🟢 |

---

## 11. Calculator

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 11.1 | Basic arithmetic | 1. Enter `100 + 50 =` | Display shows `150` | 🟢 |
| 11.2 | Subtraction | 1. Enter `200 - 75 =` | Display shows `125` | 🟢 |
| 11.3 | Multiplication | 1. Enter `25 × 4 =` | Display shows `100` | 🟢 |
| 11.4 | Division | 1. Enter `100 ÷ 4 =` | Display shows `25` | 🟢 |
| 11.5 | Clear (C) | 1. Enter any number<br>2. Tap C | Display resets to `0` | 🟢 |
| 11.6 | Decimal input | 1. Enter `10.5 + 2.3 =` | Display shows `12.8` | 🟢 |
| 11.7 | Equal button styling | 1. Check the `=` button | **🔴 NO shadow warnings in console.** Button has accent color background, no shadow-related prop warnings | 🔴 |
| 11.8 | Percentage | 1. Enter `200` then tap `%` | Display shows `2` (200 / 100) | 🟢 |

---

## 12. Settings

### 12.1 General Settings

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 12.1.1 | Theme toggle | 1. Tap dark/light mode toggle | Theme switches app-wide. All screens reflect new theme. Toggle icon changes (Sun ↔ Moon) | 🟡 |
| 12.1.2 | Biometric toggle | 1. Toggle "Biometric Lock" switch | Biometric enabled/disabled. Next app open shows/skips Lock Screen accordingly | 🟡 |
| 12.1.3 | Privacy Policy | 1. Tap "Privacy Policy" | Navigates to PrivacyPolicy screen. Content displayed | 🟢 |
| 12.1.4 | Logout | 1. Tap "Sign Out" | Confirm dialog. On confirm, navigates to Login screen. Session cleared | 🟡 |

### 12.2 Payment Details (🔴 CssInterop Fix)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 12.2.1 | Open payment modal | 1. Tap "Payment Details" | Modal opens with UPI ID text input and Save button | 🟡 |
| 12.2.2 | Save button state (🔴) | 1. Enter invalid UPI (no '@')<br>2. Check Save button | **🔴 NO CRASH.** Save button is disabled (semi-transparent at 50% opacity). Text input accepts input | 🔴 |
| 12.2.3 | Valid UPI | 1. Enter valid UPI (e.g., `name@upi`)<br>2. Tap Save | **🔴 NO CRASH.** Button becomes fully opaque (enabled). On tap: loading spinner, then success alert | 🔴 |
| 12.2.4 | Save > then reopen modal | 1. Save a UPI<br>2. Close modal<br>3. Reopen modal | UPI input pre-filled with saved value. Subtitle on Settings page shows the UPI ID | 🟡 |

### 12.3 Demo Data

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 12.3.1 | Seed demo data | 1. Tap "Load Demo Data"<br>2. Confirm in dialog | Loading state shown. On success: "Demo data seeded successfully!" alert. Dashboard, Orders, Ledger, Directory now populated with sample data | 🟡 |

---

## 13. Navigation & General UI

### 13.1 Bottom Tab Bar (Mobile)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 13.1.1 | Tab navigation | 1. Tap each bottom tab icon | Navigates to correct screen. Active tab icon highlighted (indigo). Other tabs gray | 🟡 |
| 13.1.2 | Add button (center) | 1. Tap floating + button in dock center | Navigates to Add Entry screen | 🟡 |
| 13.1.3 | Dock pagination | 1. Swipe dock left/right | Second page shows remaining tabs (Calculator, Calendar, Settings). Smooth snap scrolling | 🟡 |
| 13.1.4 | Auto-scroll to active tab | 1. Tap a tab on page 2 (e.g., Settings)<br>2. Navigate away and come back | Dock automatically scrolls to show the page containing the active tab | 🟢 |

### 13.2 Stack Navigation

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 13.2.1 | AccountDetail navigation | 1. Tap account in Ledger | Pushes AccountDetail onto stack. Back button returns to Ledger | 🟡 |
| 13.2.2 | OrderDetail navigation | 1. Tap order in Transactions or Dashboard | Pushes OrderDetail. Back button returns to previous screen | 🟡 |
| 13.2.3 | Deep navigation | 1. Dashboard → Recent Order → Edit → Back → Back | Each back press returns to previous screen correctly. No stack corruption | 🟡 |
| 13.2.4 | Slide animation | 1. Navigate to any stack screen | Screen slides in from right. Going back slides from left | 🟢 |

---

## 14. Dark Mode (Cross-Screen)

| # | Test Case | Steps | Expected Result | Priority |
|---|-----------|-------|-----------------|----------|
| 14.1 | Dashboard dark mode | 1. Enable dark mode<br>2. Open Dashboard | Background is dark (#0F172A). Text is light. Hero card adapts. Cards have dark surface bg | 🟡 |
| 14.2 | Orders dark mode | 1. Check Orders screen in dark mode | Status chips correctly show dark inactive state (#1E293B bg, #334155 border). Active chip is still indigo. No contrast issues | 🟡 |
| 14.3 | Ledger dark mode | 1. Check Ledger in dark mode | Filter chips correctly show dark inactive state (#1E293B bg). Active chip indigo. Text readable | 🟡 |
| 14.4 | Directory dark mode | 1. Check Directory in dark mode | Tabs show dark inactive state. Active tab indigo. Icon colors correct | 🟡 |
| 14.5 | Calendar dark mode | 1. Check Calendar in dark mode | Selected date shows indigo. Unselected dates show light text (#E2E8F0) on dark bg. Contrast is readable | 🟡 |
| 14.6 | AddEntry toggles dark mode | 1. Open Add Entry in dark mode<br>2. Toggle payment statuses | Inactive toggle text is light (#94A3B8) on transparent bg. Active toggle has colored bg + white text. No crash | 🟡 |
| 14.7 | Settings modal dark mode | 1. Open Payment Details modal in dark mode | Modal renders correctly. UPI input field readable. Save button correctly shows enabled/disabled state | 🟡 |
| 14.8 | Reports dark mode | 1. Open Insights → switch tabs in dark mode | Tabs switch without crash. Tab inactive state uses dark bg. Active tab indigo | 🟡 |

---

## Console Error Monitoring

> **Run these tests with Metro developer console visible.** For all 🔴 Critical tests, verify:

| Check | Expected |
|-------|----------|
| No `undefined is not an object (evaluating 'e[r]')` errors | ✅ Zero NativeWind/CssInterop bridge crashes |
| No `shadowOffset` / `shadowOpacity` prop warnings | ✅ Zero shadow-related warnings |
| No `Cannot read property 'copyAsync' of undefined` | ✅ PDF sharing uses correct expo-file-system API |
| No `require('expo-file-system/legacy')` errors | ✅ Fixed in ledgerExporter.ts |

---

## Test Execution Checklist

| Screen | Total Tests | 🔴 Critical | Status |
|--------|------------|-------------|--------|
| Auth & Security | 9 | 0 | ⏭️ |
| Dashboard | 11 | 0 | ⏭️ |
| Add Entry | 11 | 4 | ⏭️ |
| Orders (Transactions) | 12 | 8 | ⏭️ |
| Order Detail | 10 | 0 | ⏭️ |
| Ledger | 10 | 5 | ⏭️ |
| Account Detail | 18 | 6 | ⏭️ |
| Directory | 9 | 5 | ⏭️ |
| Insights (Reports) | 9 | 4 | ⏭️ |
| Calendar | 6 | 2 | ⏭️ |
| Calculator | 8 | 1 | ⏭️ |
| Settings | 7 | 2 | ⏭️ |
| Navigation | 7 | 0 | ⏭️ |
| Dark Mode | 8 | 0 | ⏭️ |
| **TOTAL** | **135** | **37** | ⏭️ |
