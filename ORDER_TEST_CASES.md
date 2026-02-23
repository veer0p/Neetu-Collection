# Order Creation Test Cases
**App:** Neetu Collection • **Version:** 1.0.0  
**Purpose:** Verify order creation UI flow, ledger generation, and Order Detail display across all scenarios.

---

## 🔑 Key Terms

| Term | Meaning |
|---|---|
| **Udhar** | Not yet paid / pending |
| **Paid** | Payment settled |
| **Direct Order** | No pickup person involved |
| **Pickup Order** | A pickup person delivers the product |
| **PaidByDriver** | Pickup person paid the vendor on behalf of the shop |
| **Ledger** | Account-wise transaction history (Accounts screen → tap a person) |
| **Order Detail** | Opened by tapping any order in the Orders list |

---

## 📋 Test Case Structure

Each test case covers:
1. **Input** — What to fill in the order form
2. **Expected: Order Detail** — What the Order Detail screen must show
3. **Expected: Ledger entries** — Which ledger rows appear for each involved person

---

## ─────────────────────────────────────────
## SCENARIO A — Direct Order, All Udhar (Most Basic)
## ─────────────────────────────────────────

**Description:** Simple sale with no pickup person. No one has paid yet.

### Input (Add Order Form)
| Field | Value |
|---|---|
| Product | Silk Saree |
| Customer | Anjali Sharma |
| Vendor | Bombay Selection |
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Pickup Person | *(none)* |
| Shipping Charges | ₹0 |
| Pickup Charges | ₹0 |
| Customer Payment | Udhar |
| Vendor Payment | Udhar |

### ✅ Expected: Order Detail Screen
- **Status:** Pending / Booked
- **Net Margin Card:** ₹800 (green)
- **Payment Status:**
  - Customer → 🟡 Udhar
  - Vendor → 🟡 Udhar
  - Pickup → *(not shown, no pickup person)*
- **Order Details card:** shows all above fields correctly
- **Ledger History:** 2 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali Sharma | +₹2,800 🟢 green |
  | 2 | Purchase | Bombay Selection | -₹2,000 🔴 red |

### ✅ Expected: Ledger (Account Detail)
- **Anjali Sharma (Customer):**
  - Balance: ₹2,800 `You are owed`
  - Entries: `Sale +₹2,800`
- **Bombay Selection (Vendor):**
  - Balance: ₹2,000 `You owe`
  - Entries: `Purchase -₹2,000`

---

## ─────────────────────────────────────────
## SCENARIO B — Direct Order, Customer Paid, Vendor Udhar
## ─────────────────────────────────────────

**Description:** Customer paid upfront. Vendor bill pending.

### Input
| Field | Value |
|---|---|
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Pickup Person | *(none)* |
| Customer Payment | **Paid** |
| Vendor Payment | Udhar |

### ✅ Expected: Order Detail Screen
- **Net Margin:** ₹800 (green)
- **Payment Status:**
  - Customer → 🟢 Paid
  - Vendor → 🟡 Udhar
- **Ledger History:** 3 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 🟢 |
  | 2 | Purchase | Bombay Selection | -₹2,000 🔴 |
  | 3 | PaymentIn | Anjali | -₹2,800 🔴 |

### ✅ Expected: Ledger
- **Anjali Sharma:** Balance ₹0 `Settled` (Sale +2800 cancelled by PaymentIn -2800)
- **Bombay Selection:** Balance ₹2,000 `You owe`

---

## ─────────────────────────────────────────
## SCENARIO C — Direct Order, Both Paid
## ─────────────────────────────────────────

**Description:** All payments settled at time of order creation.

### Input
| Field | Value |
|---|---|
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Pickup Person | *(none)* |
| Customer Payment | **Paid** |
| Vendor Payment | **Paid** |

### ✅ Expected: Order Detail
- **Net Margin:** ₹800 (green)
- **Both payment pills:** 🟢 Paid
- **Ledger History:** 4 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 🟢 |
  | 2 | Purchase | Bombay Sel. | -₹2,000 🔴 |
  | 3 | PaymentIn | Anjali | -₹2,800 🔴 |
  | 4 | PaymentOut | Bombay Sel. | +₹2,000 🟢 |

### ✅ Expected: Ledger
- **Anjali Sharma:** Balance ₹0 `Settled`
- **Bombay Selection:** Balance ₹0 `Settled`

---

## ─────────────────────────────────────────
## SCENARIO D — Direct Order + Shipping Charges, Vendor Udhar
## ─────────────────────────────────────────

**Description:** Direct order (no pickup person), shipping charged from vendor.

### Input
| Field | Value |
|---|---|
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Pickup Person | *(none)* |
| Shipping Charges | **₹200** |
| Customer Payment | Udhar |
| Vendor Payment | Udhar |

### ✅ Expected: Order Detail
- **Net Margin:** ₹600 (green) *(2800 - 2000 - 200)*
- **Ledger History:** 3 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 |
  | 2 | Purchase | Bombay Sel. | -₹2,000 |
  | 3 | Expense | Bombay Sel. | -₹200 *(Shipping charges)* |

### ✅ Expected: Ledger
- **Anjali:** Balance ₹2,800 `You are owed`
- **Bombay Selection:** Balance ₹2,200 `You owe`

---

## ─────────────────────────────────────────
## SCENARIO E — Direct Order + Shipping, Vendor Paid
## ─────────────────────────────────────────

**Description:** Direct order with shipping, vendor payment settled.

### Input
| Field | Value |
|---|---|
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Shipping Charges | **₹200** |
| Customer Payment | Udhar |
| Vendor Payment | **Paid** |

### ✅ Expected: Order Detail
- **Ledger History:** 5 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 |
  | 2 | Purchase | Bombay Sel. | -₹2,000 |
  | 3 | Expense | Bombay Sel. | -₹200 |
  | 4 | PaymentOut | Bombay Sel. | +₹2,000 |
  | 5 | PaymentOut | Bombay Sel. | +₹200 *(Shipping settled)* |

### ✅ Expected: Ledger
- **Anjali:** Balance ₹2,800 `You are owed`
- **Bombay Selection:** Balance ₹0 `Settled`

---

## ─────────────────────────────────────────
## SCENARIO F — Pickup Order, All Udhar
## ─────────────────────────────────────────

**Description:** Pickup person involved. Shop owner pays vendor and pickup charges separately.

### Input
| Field | Value |
|---|---|
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Pickup Person | **Rahul Express** |
| Pickup Charges | **₹100** |
| Shipping Charges | **₹150** |
| Paid by Driver? | ❌ No |
| Customer Payment | Udhar |
| Vendor Payment | Udhar |
| Pickup Payment | Udhar |

### ✅ Expected: Order Detail
- **Net Margin:** ₹550 *(2800 - 2000 - 100 - 150)*
- **Payment Status:**
  - Customer 🟡 | Vendor 🟡 | Pickup 🟡
- **Ledger History:** 4 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 |
  | 2 | Purchase | Bombay Sel. | -₹2,000 |
  | 3 | Expense | Rahul Express | -₹100 *(Pickup charges)* |
  | 4 | Expense | Rahul Express | -₹150 *(Shipping charges)* |

### ✅ Expected: Ledger
- **Anjali:** Balance ₹2,800 `You are owed`
- **Bombay Selection:** Balance ₹2,000 `You owe`
- **Rahul Express:** Balance ₹250 `You owe`

---

## ─────────────────────────────────────────
## SCENARIO G — Pickup Order, Pickup Payment Paid
## ─────────────────────────────────────────

**Description:** Pickup person is settled. Vendor and customer still pending.

### Input
*(same as Scenario F but)*  
| Pickup Payment | **Paid** |

### ✅ Expected: Order Detail
- **Pickup Status:** 🟢 Paid
- **Ledger History:** 6 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 |
  | 2 | Purchase | Bombay Sel. | -₹2,000 |
  | 3 | Expense | Rahul | -₹100 |
  | 4 | Expense | Rahul | -₹150 |
  | 5 | PaymentOut | Rahul | +₹100 *(Pickup settled)* |
  | 6 | PaymentOut | Rahul | +₹150 *(Shipping settled)* |

### ✅ Expected: Ledger
- **Rahul Express:** Balance ₹0 `Settled`
- **Bombay Selection:** Balance ₹2,000 `You owe`

---

## ─────────────────────────────────────────
## SCENARIO H — Pickup Order, Paid by Driver (पेमेंट ड्राइवर ने किया)
## ─────────────────────────────────────────

**Description:** Pickup person (Rahul) paid the vendor's bill directly. Shop owes reimbursement to driver.

### Input
| Field | Value |
|---|---|
| Original Price | ₹2,000 |
| Selling Price | ₹2,800 |
| Pickup Person | Rahul Express |
| Pickup Charges | ₹100 |
| Shipping Charges | ₹0 |
| **Paid by Driver?** | ✅ **Yes** |
| Customer Payment | Udhar |
| Vendor Payment | — *(auto-managed)* |
| Pickup Payment | Udhar |

### ✅ Expected: Order Detail
- **Net Margin:** ₹700 *(2800 - 2000 - 100)*
- **Ledger History:** 5 rows
  | Row | Type | Person | Amount |
  |---|---|---|---|
  | 1 | Sale | Anjali | +₹2,800 |
  | 2 | Purchase | Bombay Sel. | -₹2,000 |
  | 3 | Expense | Rahul | -₹100 |
  | 4 | PaymentOut | Bombay Sel. | +₹2,000 *(Paid by driver)* |
  | 5 | Reimbursement | Rahul | -₹2,000 *(Product cost reimbursement)* |

### ✅ Expected: Ledger
- **Anjali:** Balance ₹2,800 `You are owed`
- **Bombay Selection:** Balance ₹0 `Settled` *(vendor's debt was cleared by driver)*
- **Rahul Express:** Balance ₹2,100 `You owe` *(₹100 pickup + ₹2,000 advance)*

> **Note:** Bombay Selection's vendor account will show a `PaymentOut (Paid by driver)` entry which is correctly **hidden** in the vendor's ledger view (see AccountDetail filter logic) to avoid confusing the shop owner.

---

## ─────────────────────────────────────────
## SCENARIO I — Edit Order: Change Vendor Payment Udhar → Paid
## ─────────────────────────────────────────

**Description:** Order was saved with Vendor=Udhar. Later edit to mark Vendor=Paid.

### Steps
1. Create order (use Scenario A values).
2. Open Order Detail → tap pencil icon (Edit).
3. Change **Vendor Payment** to **Paid**.
4. Save.

### ✅ Expected After Edit
- Order Detail: Vendor pill → 🟢 Paid
- **Ledger History adds 1 row:**
  | New Row | PaymentOut | Bombay Selection | +₹2,000 |
- **Bombay Selection ledger:** Balance → ₹0 `Settled`

> **Idempotency Check:** Edit again, keep Vendor=Paid and save → Ledger must still have **exactly the same entries**, no duplicates.

---

## ─────────────────────────────────────────
## SCENARIO J — Order Status: Canceled
## ─────────────────────────────────────────

**Description:** An order is set to Canceled status.

### Steps
1. Create any order.
2. In Orders list → tap status badge → select **Canceled**.
3. Confirm.

### ✅ Expected
- Order Detail: Status badge → 🔴 Canceled
- **Ledger History: EMPTY** — all ledger entries are deleted when status is Canceled
- **All account balances return to their pre-order state**

---

## ─────────────────────────────────────────
## SCENARIO K — PaymentIn Toggle on Order Detail (Post-creation)
## ─────────────────────────────────────────

**Description:** Order created with Customer=Udhar. Later mark Paid from Order Detail screen.

### Steps
1. Create order (Scenario A — Customer Udhar).
2. Open Order Detail.
3. Tap **Customer** payment row → toggles from `Udhar` → `Paid`.

### ✅ Expected
- Customer pill immediately shows 🟢 Paid
- Ledger History refreshes — adds `PaymentIn -₹2,800` row
- **Anjali's balance:** ₹0 `Settled`
4. Tap again to toggle back to Udhar.
- `PaymentIn` row disappears
- **Anjali's balance:** ₹2,800 `You are owed`

---

## ─────────────────────────────────────────
## SCENARIO L — Mark Paid from Account Detail Screen
## ─────────────────────────────────────────

**Description:** Use the "Mark Received" button on the Sale entry in Anjali's account.

### Steps
1. Create order (Scenario A).
2. Go to **Accounts** → tap **Anjali Sharma**.
3. See `Sale +₹2,800` with **"Mark Received"** button.
4. Tap it → confirm → verify.

### ✅ Expected
- Anjali's balance → ₹0 `Settled`
- Tap **"Mark Received"** again → **No new entry added** (idempotent — same result)
- Anjali's Order Detail page: Customer payment → 🟢 Paid

---

## ─────────────────────────────────────────
## ⚠️ EDGE CASES TO VERIFY
## ─────────────────────────────────────────

| # | Test | Expected |
|---|---|---|
| E1 | Create order with no customer selected | Customer pill hidden or shows "N/A". Ledger entry has `person_id = null`. |
| E2 | Create order with ₹0 shipping + pickup person | Only Pickup Expense entry generates. No Shipping Expense. |
| E3 | Editing an order that changes the selling price | Old ledger deleted, rebuilt with new amount. No leftover old entries. |
| E4 | Delete order | All ledger entries for that order removed. All balances revert. |
| E5 | Two orders same customer | Anjali's balance = sum of both orders. Entries shown chronologically. |
| E6 | Status: Delivered (no payment change) | Ledger unchanged, status timeline adds "Delivered" entry. Order status badge green. |

---

## 🗂 Regression Checklist (Run After Any Code Change)

- [ ] Scenario A — Create & verify ledger (2 entries)
- [ ] Scenario B — Customer Paid, verify balance = 0
- [ ] Scenario C — All Paid, all balances = 0
- [ ] Scenario F — Pickup order basic
- [ ] Scenario H — Paid by driver, vendor settled, driver owes
- [ ] Scenario I — Edit Vendor payment Udhar → Paid → no duplicate
- [ ] Scenario J — Cancel order → ledger empty
- [ ] Scenario K — Toggle Paid/Udhar on Order Detail → instant reflect
- [ ] E3 — Edit price → verify rebuild, no orphan rows
- [ ] E4 — Delete order → balances revert

---

*Last updated: 2026-02-23*
