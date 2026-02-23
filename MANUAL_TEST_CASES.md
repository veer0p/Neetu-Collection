# Manual Test Suite: Neetu Collection
**Version:** 1.0.0 | **Last Updated:** 2026-02-23

This document provides step-by-step instructions for manually verifying the UI, UX, and business logic of the Neetu Collection application.

---

## 🎨 1. Global UI & Consistency
Verify that the app feels premium and consistent across screens.

| ID | Feature | Action | Expected Result |
|---|---|---|---|
| UI-01 | Button Height | Go to **Account Details** → tap **Pay** | The **Confirm Payment** button height matches the Input fields (`h-12`). |
| UI-02 | Theme Toggle | Open Sidebar → tap **Theme Toggle** | App switches smoothly between Light/Dark mode. Cards/Text remain readable. |
| UI-03 | Responsiveness | Open app on **Web** and **Mobile** | UI adapts layout. No horizontal scrolling or overlapping elements. |

---

## 📋 2. Directory & Master Data
Verify management of products, customers, vendors, and pickup persons.

| ID | Feature | Action | Expected Result |
|---|---|---|---|
| DIR-01 | Add Contact | **Directory** → tap **+** → add a Customer | Contact appears in list. Swipe to edit works. |
| DIR-02 | Search | Type contact name in search bar | List filters correctly in real-time. |
| DIR-03 | Type Filtering | Tap tabs (Customer, Vendor, etc.) | Only contacts of that specific type are shown. |

---

## 📦 3. Order Management (Logical Verifications)
Verify order creation, ledger generation, and status flows.

| ID | Feature | Action | Expected Result |
|---|---|---|---|
| ORD-01 | Basic Order | Create order (Customer/Vendor Udhar) | 1. Order appears in **Orders** list.<br>2. Ledger shows Sale (+) and Purchase (-). |
| ORD-02 | Paid by Driver | Create order → check **Paid by Driver** | 1. Vendor ledger shows **PaymentOut (Paid by driver)**.<br>2. Pickup ledger shows **Reimbursement (-)**. |
| ORD-03 | Edit Order | Edit an existing order's Selling Price | Ledger entries are deleted and rebuilt with new values. No duplicates. |
| ORD-04 | Cancel Order | Set Order Status → **Canceled** | All ledger entries disappear. Account balances revert to pre-order state. |

---

## 🏦 4. Account Details & Ledger Logic
Verify arrows, colors, signs, and balance integrity.

| ID | Feature | Action | Expected Result |
|---|---|---|---|
| ACC-01 | Arrow Flow (In) | View a **Sale** or **PaymentIn** | Icon is **Green Up Arrow** (Money coming in). |
| ACC-02 | Arrow Flow (Out) | View a **Purchase**, **Expense**, or **PaymentOut** | Icon is **Red Down Arrow** (Money/Owes going out). |
| ACC-03 | Color Coding | View all transactions in an account | Inflow is **Green (+)**. Outflow is **Red (-)**. |
| ACC-04 | Manual Balance | Add a payment (OUT) → then Delete it | Balance correctly increments by the amount, then reverts. |
| ACC-05 | Settlement Toggle | Tap a payment pill (Udhar/Paid) in Order Detail | Ledger row appears/disappears instantly. Balance updates. |
| ACC-06 | Quick Settle | Tap **Mark Paid** on a ledger row | Counter-entry is created. Balance becomes zero for that item. |

---

## 📊 5. Dashboard & Analytics
Verify that financial totals are accurate.

| ID | Feature | Action | Expected Result |
|---|---|---|---|
| DASH-01 | Net Profit | Check **Net Margin** card | Matches sum of margins from all non-canceled orders. |
| DASH-02 | Receivables | Check **You are Owed** total | Matches sum of all Customer balances > 0. |
| DASH-03 | Payables | Check **You Owe** total | Matches sum of all Vendor/Driver balances < 0. |

---

## ⚠️ 6. Edge Cases
Verify robustness under unusual conditions.

| ID | Feature | Action | Expected Result |
|---|---|---|---|
| EDGE-01 | Zero Prices | Create order with ₹0 Selling Price | App allows it, but records ₹0 in ledger. No crashes. |
| EDGE-02 | Deleted Person | Delete a person with ledger history | Ledger records are orphaned but don't cause app to crash (Cascade delete verified). |
| EDGE-03 | No Internet | Attempt to save order while offline | App shows an error toast or loading indicator (Supabase timeout). |

---
*Manual Test Suite V1.0*
