# Complete Business Test Suite: Neetu Collection
**Target Version:** 1.0.0 | **Document Type:** Comprehensive Quality Assurance (UI + Logic)

This document is the definitive source of truth for verifying the Neetu Collection accounting engine. It covers every permutation of Order creation, Settlement, and Account Integrity.

---

## 🔑 Icon & Color Legend (UI Verification)

| Element | Appearance | Business Meaning |
|---|---|---|
| **Green Up Arrow** | 🟢 ↗️ | **Inflow**: Sale or PaymentReceived. |
| **Red Down Arrow** | 🔴 ↘️ | **Outflow**: Purchase, Expense, or PaymentGiven. |
| **Success Badge** | 🟢 Paid | Full settlement of that specific party. |
| **Warning Badge** | 🟡 Udhar | Pending payment or debt. |
| **Plus Sign (+)** | +₹XXX (Green) | Increases current account balance (Owed to us). |
| **Minus Sign (-)** | -₹XXX (Red) | Decreases current account balance (We owe them). |

---

## 📦 PHASE 1: DIRECT ORDER SCENARIOS (No Pickup Person)

### SCENARIO 1: The Basic Udhar Order
**Goal:** Verify base accounting for a standard credit sale.

| Step | Action | Values |
|---|---|---|
| **Inputs** | Add Order | Prod: Saree, Cust: Anjali, Vendor: Bombay Sel, OP: 1000, SP: 1500, Ship: 0, CustPay: Udhar, VendPay: Udhar |
| **UI Check** | Order Detail | Net Margin: +₹500. Cust Pill: 🟡 Udhar. Vend Pill: 🟡 Udhar. |
| **Ledger Check** | Account Detail | **Anjali:** `Sale +₹1500` (🟢 ↗️). **Bombay:** `Purchase -₹1000` (🔴 ↘️). |
| **Balance** | Accounts List | **Anjali:** ₹1500 (You are owed). **Bombay:** ₹1000 (You owe). |

### SCENARIO 2: Customer Pays Upfront
**Goal:** Verify PaymentIn logic during order creation.

| Step | Action | Values |
|---|---|---|
| **Inputs** | Add Order | (Same as above) EXCEPT: **Customer Payment: Paid** |
| **UI Check** | Order Detail | Cust Pill: 🟢 Paid. Vend Pill: 🟡 Udhar. |
| **Ledger Check** | Account Detail | **Anjali:** 1. `Sale +₹1500` (🟢 ↗️), 2. `PaymentIn -₹1500` (🔴 ↘️). |
| **Balance** | Accounts List | **Anjali:** ₹0 (Settled). **Bombay:** ₹1000 (You owe). |

### SCENARIO 3: Direct Order with Shipping (Vendor Udhar)
**Goal:** Verify Expense attribution when no pickup person exists.

| Step | Action | Values |
|---|---|---|
| **Inputs** | Add Order | OP: 1000, SP: 1500, **Shipping: 200**, VendPay: Udhar |
| **UI Check** | Order Detail | Net Margin: +₹300 (1500 - 1000 - 200). |
| **Ledger Check** | Account Detail | **Bombay:** 1. `Purchase -₹1000`, 2. `Expense -₹200` (Shipping). |
| **Balance** | Accounts List | **Bombay:** ₹1200 (You owe). |

---

## 🛵 PHASE 2: PICKUP PERSON SCENARIOS

### SCENARIO 4: Standard Pickup (Everyone Udhar)
**Goal:** Verify split expenses between Vendor and Pickup Person.

| Step | Action | Values |
|---|---|---|
| **Inputs** | Add Order | OP: 1000, SP: 1500, **Pickup: Rahul**, **Pickup Charges: 50**, **Shipping: 100**, All Udhar |
| **UI Check** | Order Detail | Cust Pill: 🟡, Vend Pill: 🟡, Pickup Pill: 🟡. |
| **Ledger Check** | Account Detail | **Rahul:** 1. `Expense -₹50` (Pickup), 2. `Expense -₹100` (Shipping). |
| **Balance** | Accounts List | **Rahul:** ₹150 (You owe). **Bombay:** ₹1000 (You owe). |

### SCENARIO 5: The "Paid by Driver" Flow (पेमेंट ड्राइवर ने किया)
**Goal:** Verify Vendor clearing and Driver reimbursement logic.

| Step | Action | Values |
|---|---|---|
| **Inputs** | Add Order | OP: 1000, **Paid by Driver: YES**, Pickup: Rahul, Charges: 50 |
| **UI Check** | Order Detail | Vend Pill: 🟢 Paid (Auto). Pickup Pill: 🟡 Udhar. |
| **Ledger Check** | Account Detail | **Bombay:** 1. `Purchase -₹1000`, 2. `PaymentOut +₹1000` (Paid by driver).<br>**Rahul:** 1. `Expense -₹50`, 2. `Reimbursement -₹1000` (Product cost). |
| **Balance** | Accounts List | **Bombay:** ₹0 (Settled). **Rahul:** ₹1050 (You owe). |

---

## 🔄 PHASE 3: UPDATES, DELETIONS & CANCELLATIONS

### SCENARIO 6: Post-Creation Settlement (Toggling Pills)
**Goal:** Verify that marking "Paid" on the Order Detail screen updates the ledger instantly.

| Step | Action | Expected Result |
|---|---|---|
| **1. View** | Open Order Detail | See Customer Pill as 🟡 Udhar. |
| **2. Toggle** | Tap Customer Pill | Pill turns 🟢 Paid. **Ledger** instantly adds `PaymentIn` row. |
| **3. Toggle Back** | Tap Customer Pill | Pill turns 🟡 Udhar. **Ledger** row for `PaymentIn` is deleted. |
| **4. Verification** | Check Balance | Balance toggles between ₹1500 and ₹0 correctly. |

### SCENARIO 7: Price Correction (Editing Order)
**Goal:** Verify that changing prices rebuilds the ledger without orphans.

| Step | Action | Expected Result |
|---|---|---|
| **1. Edit** | Edit Order → Change SP from 1500 to 2000 | Save Order. |
| **2. Verify** | Check Account Detail | Old `Sale +1500` is GONE. New `Sale +2000` exists. |
| **3. Integrity** | Check Balance | Balance is exactly ₹2000. No leftover 1500 remains. |

### SCENARIO 8: Order Cancellation
**Goal:** Verify complete reversal of financial impact.

| Step | Action | Expected Result |
|---|---|---|
| **1. Cancel** | Order Detail → Status → **Canceled** | Status Badge turns 🔴 Canceled. |
| **2. Verify** | Check Account Detail | **All ledger rows for this order are deleted.** |
| **3. Integrity** | Check Balance | Account balances return to 0 (or pre-order state). |

---

## 🏦 PHASE 4: ACCOUNT MODULE & MANUAL INTEGRITY

### SCENARIO 9: The Manual Return Case (Anti-Corruption Test)
**Goal:** Verify that manual payments always affect the balance, even after deletion of other entries.

| Step | Action | Logic Verification |
|---|---|---|
| **1. Give** | Add Payment (Out) for ₹1000 | Balance: -₹1000 (You owe). |
| **2. Return** | Add Payment (In) for ₹1000 | Balance: ₹0 (Settled). |
| **3. Delete** | Delete the "Give" entry (Step 1) | **Balance must become +₹1000 (You are owed).** |
| **4. Reason** | Verification | Manual payments are historical facts. Deleting one reveals the true state of the other. |

### SCENARIO 10: Quick Settle from Account Screen
**Goal:** Verify the "Mark Paid" button on a specific Sale.

| Step | Action | Expected Result |
|---|---|---|
| **1. Settle** | Tap **Mark Paid** on a `Sale` row | A `PaymentIn` counter-row is created. |
| **2. Indicators** | UI Check | The `Sale` row shows a 🟢 SETTLED badge. |
| **3. Balance** | Account Header | Current Balance updates to reflect the settlement. |

---

## ✅ Final Regression Checklist for User
- [ ] Do Green Arrows always mean money coming in?
- [ ] Do Red Arrows always mean money/debt going out?
- [ ] Does deleting an order remove all its ledger impact?
- [ ] Does adding a manual payment change the balance immediately?
- [ ] Can you see the "Net Margin" correctly accounting for all expenses?

---
*End of Complete Business Test Suite*
