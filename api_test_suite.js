/**
 * Neetu Collection — Comprehensive API Test Suite
 * 26 test cases across 7 modules, all via Supabase API calls.
 * Run: node api_test_suite.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ─── Config ──────────────────────────────────────────────
const SUPABASE_URL = 'https://pavmpakpbzdrxmqomblw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdm1wYWtwYnpkcnhtcW9tYmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTkzMjQsImV4cCI6MjA4NjM5NTMyNH0.KgVOq_5KyARO8pzTybVrUKeCE8BX4GcrRRUnQCoX62Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_ID = '8d4f02b0-f902-4f33-9370-5d3a6f9b7931';
const TEST_PREFIX = 'TEST-API-';
const TEST_PHONE = '9999999999';
const TEST_PIN = '9999';

// ─── State ───────────────────────────────────────────────
let ctx = {}; // shared test context (IDs, etc.)
const results = []; // { id, module, name, passed, error?, duration }

// ─── Helpers ─────────────────────────────────────────────
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;
const dim = (t) => `\x1b[2m${t}\x1b[0m`;

function assert(condition, message) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTest(id, module, name, fn) {
    const start = Date.now();
    try {
        await fn();
        const dur = Date.now() - start;
        results.push({ id, module, name, passed: true, duration: dur });
        console.log(`  ${green('✓')} ${dim(id)} ${name} ${dim(`(${dur}ms)`)}`);
    } catch (err) {
        const dur = Date.now() - start;
        results.push({ id, module, name, passed: false, error: err.message, duration: dur });
        console.log(`  ${red('✗')} ${dim(id)} ${name}`);
        console.log(`    ${red(err.message)}`);
    }
}

// Helper: get balance for a person
async function getBalance(personId) {
    const { data } = await supabase.from('ledger').select('amount').eq('person_id', personId);
    return (data || []).reduce((sum, r) => sum + Number(r.amount), 0);
}

// Helper: get ledger entries for an order
async function getLedgerForOrder(orderId) {
    const { data } = await supabase.from('ledger').select('*').eq('order_id', orderId);
    return data || [];
}

// Helper: replicates the saveOrder logic from supabaseService.ts
async function saveOrder(order, userId) {
    const isUpdate = !!order.id;
    const margin = (order.sellingPrice || 0) - (order.originalPrice || 0) - (order.pickupCharges || 0) - (order.shippingCharges || 0);
    const orderPayload = {
        user_id: userId,
        date: order.date || new Date().toLocaleDateString('en-GB'),
        product_id: order.productId || null,
        customer_id: order.customerId || null,
        vendor_id: order.vendorId || null,
        original_price: order.originalPrice || 0,
        selling_price: order.sellingPrice || 0,
        paid_by_driver: order.paidByDriver || false,
        pickup_person_id: order.pickupPersonId || null,
        tracking_id: order.trackingId || null,
        courier_name: order.courierName || null,
        pickup_charges: order.pickupCharges || 0,
        shipping_charges: order.shippingCharges || 0,
        status: order.status || 'Pending',
        status_history: order.statusHistory || [{ status: order.status || 'Pending', date: new Date().toISOString() }],
        notes: order.notes || null,
        vendor_payment_status: order.vendorPaymentStatus || 'Udhar',
        customer_payment_status: order.customerPaymentStatus || 'Udhar',
        pickup_payment_status: order.pickupPaymentStatus || 'Paid',
        margin,
    };

    let savedOrder;
    if (isUpdate) {
        const { data, error } = await supabase.from('orders').update(orderPayload).eq('id', order.id).select().single();
        if (error) throw error;
        savedOrder = data;
    } else {
        const { data, error } = await supabase.from('orders').insert([orderPayload]).select().single();
        if (error) throw error;
        savedOrder = data;
    }

    // Delete-and-recreate ledger
    if (isUpdate) {
        const { error: delErr } = await supabase.from('ledger').delete().eq('order_id', savedOrder.id);
        if (delErr) throw delErr;
    }

    if (order.status === 'Canceled') return savedOrder;

    const entries = [];
    const orderId = savedOrder.id;
    const hasPickup = !!order.pickupPersonId;
    const op = order.originalPrice || 0;
    const sp = order.sellingPrice || 0;
    const pc = order.pickupCharges || 0;
    const sc = order.shippingCharges || 0;
    const pbd = order.paidByDriver || false;

    // Sale
    entries.push({ user_id: userId, order_id: orderId, person_id: order.customerId, amount: sp, transaction_type: 'Sale' });
    // Purchase
    entries.push({ user_id: userId, order_id: orderId, person_id: order.vendorId, amount: -op, transaction_type: 'Purchase' });

    // Shipping without pickup → vendor
    if (!hasPickup && sc > 0) {
        entries.push({ user_id: userId, order_id: orderId, person_id: order.vendorId, amount: -sc, transaction_type: 'Expense', notes: 'Shipping charges' });
    }
    // Pickup charges
    if (hasPickup && pc > 0) {
        entries.push({ user_id: userId, order_id: orderId, person_id: order.pickupPersonId, amount: -pc, transaction_type: 'Expense', notes: 'Pickup charges' });
    }
    // Shipping with pickup → pickup person
    if (hasPickup && sc > 0) {
        entries.push({ user_id: userId, order_id: orderId, person_id: order.pickupPersonId, amount: -sc, transaction_type: 'Expense', notes: 'Shipping charges' });
    }
    // Paid by driver
    if (pbd && hasPickup) {
        entries.push({ user_id: userId, order_id: orderId, person_id: order.vendorId, amount: op, transaction_type: 'PaymentOut', notes: 'Paid by driver' });
        entries.push({ user_id: userId, order_id: orderId, person_id: order.pickupPersonId, amount: -op, transaction_type: 'Reimbursement', notes: 'Product cost reimbursement' });
    }
    // Customer paid
    if (order.customerPaymentStatus === 'Paid') {
        entries.push({ user_id: userId, order_id: orderId, person_id: order.customerId, amount: -sp, transaction_type: 'PaymentIn' });
    }
    // Vendor paid (not driver-paid)
    if (order.vendorPaymentStatus === 'Paid' && !pbd) {
        entries.push({ user_id: userId, order_id: orderId, person_id: order.vendorId, amount: op, transaction_type: 'PaymentOut' });
        if (!hasPickup && sc > 0) {
            entries.push({ user_id: userId, order_id: orderId, person_id: order.vendorId, amount: sc, transaction_type: 'PaymentOut', notes: 'Shipping settled' });
        }
    }
    // Pickup paid
    if (order.pickupPaymentStatus === 'Paid' && hasPickup) {
        if (pc > 0) entries.push({ user_id: userId, order_id: orderId, person_id: order.pickupPersonId, amount: pc, transaction_type: 'PaymentOut', notes: 'Pickup settled' });
        if (sc > 0) entries.push({ user_id: userId, order_id: orderId, person_id: order.pickupPersonId, amount: sc, transaction_type: 'PaymentOut', notes: 'Shipping settled' });
        if (pbd) entries.push({ user_id: userId, order_id: orderId, person_id: order.pickupPersonId, amount: op, transaction_type: 'PaymentOut', notes: 'Product cost reimbursed' });
    }

    if (entries.length > 0) {
        const { error: ledgerErr } = await supabase.from('ledger').insert(entries);
        if (ledgerErr) throw ledgerErr;
    }

    return savedOrder;
}

// ─── Cleanup ─────────────────────────────────────────────
async function cleanup() {
    console.log(cyan('\n🧹 Cleaning up previous test data...'));
    // Delete test orders → cascade deletes ledger
    const { data: orders } = await supabase.from('orders').select('id').eq('user_id', USER_ID).ilike('notes', `%${TEST_PREFIX}%`);
    if (orders && orders.length > 0) {
        const ids = orders.map(o => o.id);
        await supabase.from('ledger').delete().in('order_id', ids);
        await supabase.from('orders').delete().in('id', ids);
    }
    // Delete test directory items
    await supabase.from('directory').delete().eq('user_id', USER_ID).ilike('name', `${TEST_PREFIX}%`);
    // Delete test profile
    await supabase.from('profiles').delete().eq('phone', TEST_PHONE);
    console.log(green('  ✓ Cleanup complete\n'));
}

// ═══════════════════════════════════════════════════════════
// MODULE 1: Authentication
// ═══════════════════════════════════════════════════════════
async function module1_auth() {
    console.log(bold(cyan('\n━━ Module 1: Authentication ━━')));

    await runTest('AUTH-01', 'Authentication', 'Sign up new user', async () => {
        const { data, error } = await supabase.from('profiles').insert([{ phone: TEST_PHONE, pin: TEST_PIN, name: `${TEST_PREFIX}User` }]).select().single();
        if (error) throw error;
        assert(data.phone === TEST_PHONE, 'Phone should match');
        assert(data.name === `${TEST_PREFIX}User`, 'Name should match');
        ctx.testProfileId = data.id;
    });

    await runTest('AUTH-02', 'Authentication', 'Sign in with valid credentials', async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('phone', TEST_PHONE).eq('pin', TEST_PIN).single();
        if (error) throw error;
        assert(data.id === ctx.testProfileId, 'Should return same profile');
    });

    await runTest('AUTH-03', 'Authentication', 'Sign in with wrong PIN (should fail)', async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('phone', TEST_PHONE).eq('pin', 'WRONG').single();
        assert(error !== null || data === null, 'Should fail or return null for wrong PIN');
    });
}

// ═══════════════════════════════════════════════════════════
// MODULE 2: Directory CRUD
// ═══════════════════════════════════════════════════════════
async function module2_directory() {
    console.log(bold(cyan('\n━━ Module 2: Directory CRUD ━━')));

    await runTest('DIR-01', 'Directory', 'Create Product, Customer, Vendor, Pickup Person', async () => {
        const items = [
            { user_id: USER_ID, name: `${TEST_PREFIX}Product`, type: 'Product' },
            { user_id: USER_ID, name: `${TEST_PREFIX}Customer`, type: 'Customer' },
            { user_id: USER_ID, name: `${TEST_PREFIX}Vendor`, type: 'Vendor' },
            { user_id: USER_ID, name: `${TEST_PREFIX}Driver`, type: 'Pickup Person' },
        ];
        const { data, error } = await supabase.from('directory').insert(items).select();
        if (error) throw error;
        assert(data.length === 4, 'Should create 4 items');
        data.forEach(d => {
            if (d.type === 'Product') ctx.productId = d.id;
            if (d.type === 'Customer') ctx.customerId = d.id;
            if (d.type === 'Vendor') ctx.vendorId = d.id;
            if (d.type === 'Pickup Person') ctx.pickupId = d.id;
        });
    });

    await runTest('DIR-02', 'Directory', 'Fetch directory by user contains test items', async () => {
        const { data, error } = await supabase.from('directory').select('*').eq('user_id', USER_ID);
        if (error) throw error;
        const testItems = data.filter(d => d.name.startsWith(TEST_PREFIX));
        assert(testItems.length >= 4, `Should find at least 4 test items, found ${testItems.length}`);
    });

    await runTest('DIR-03', 'Directory', 'Fetch contacts by type filter', async () => {
        const { data, error } = await supabase.from('directory').select('id, name').eq('user_id', USER_ID).eq('type', 'Vendor').order('name');
        if (error) throw error;
        const found = data.find(d => d.id === ctx.vendorId);
        assert(!!found, 'Test vendor should be in filtered result');
    });

    await runTest('DIR-04', 'Directory', 'Update directory item name', async () => {
        const newName = `${TEST_PREFIX}Product-Updated`;
        const { error } = await supabase.from('directory').update({ name: newName }).eq('id', ctx.productId);
        if (error) throw error;
        const { data } = await supabase.from('directory').select('name').eq('id', ctx.productId).single();
        assert(data.name === newName, 'Name should be updated');
        // Revert for later tests
        await supabase.from('directory').update({ name: `${TEST_PREFIX}Product` }).eq('id', ctx.productId);
    });

    await runTest('DIR-05', 'Directory', 'Initial balances are all zero', async () => {
        const { data } = await supabase.from('directory').select('*, ledger:ledger(amount)').eq('user_id', USER_ID).in('id', [ctx.customerId, ctx.vendorId, ctx.pickupId]);
        for (const item of data) {
            const balance = (item.ledger || []).reduce((s, l) => s + Number(l.amount), 0);
            assert(balance === 0, `${item.name} balance should be 0, got ${balance}`);
        }
    });
}

// ═══════════════════════════════════════════════════════════
// MODULE 3: Order Creation & Ledger
// ═══════════════════════════════════════════════════════════
async function module3_orders() {
    console.log(bold(cyan('\n━━ Module 3: Order Creation & Ledger ━━')));

    await runTest('ORD-01', 'Orders', 'Create basic order → 2 ledger entries (Sale + Purchase)', async () => {
        const saved = await saveOrder({
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            originalPrice: 1000, sellingPrice: 1500,
            status: 'Pending', notes: `${TEST_PREFIX}Order-1`,
        }, USER_ID);
        ctx.orderId1 = saved.id;

        const ledger = await getLedgerForOrder(saved.id);
        assert(ledger.length === 2, `Expected 2 ledger entries, got ${ledger.length}`);
        const sale = ledger.find(l => l.transaction_type === 'Sale');
        const purchase = ledger.find(l => l.transaction_type === 'Purchase');
        assert(sale && Number(sale.amount) === 1500, 'Sale should be +1500');
        assert(purchase && Number(purchase.amount) === -1000, 'Purchase should be -1000');
    });

    await runTest('ORD-02', 'Orders', 'Margin calculation = SP - OP = 500', async () => {
        const { data } = await supabase.from('orders').select('margin').eq('id', ctx.orderId1).single();
        assert(Number(data.margin) === 500, `Margin should be 500, got ${data.margin}`);
    });

    await runTest('ORD-03', 'Orders', 'Customer balance = +1500 (receivable)', async () => {
        const bal = await getBalance(ctx.customerId);
        assert(bal === 1500, `Customer balance should be 1500, got ${bal}`);
    });

    await runTest('ORD-04', 'Orders', 'Vendor balance = -1000 (payable)', async () => {
        const bal = await getBalance(ctx.vendorId);
        assert(bal === -1000, `Vendor balance should be -1000, got ${bal}`);
    });

    await runTest('ORD-05', 'Orders', 'Canceled order → no ledger entries', async () => {
        const saved = await saveOrder({
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            originalPrice: 500, sellingPrice: 800,
            status: 'Canceled', notes: `${TEST_PREFIX}Order-Canceled`,
        }, USER_ID);
        ctx.canceledOrderId = saved.id;

        const ledger = await getLedgerForOrder(saved.id);
        assert(ledger.length === 0, `Canceled order should have 0 ledger entries, got ${ledger.length}`);
    });
}

// ═══════════════════════════════════════════════════════════
// MODULE 4: Pickup Person & Driver-Paid Flows
// ═══════════════════════════════════════════════════════════
async function module4_pickup() {
    console.log(bold(cyan('\n━━ Module 4: Pickup & Driver-Paid Flows ━━')));

    await runTest('PICK-01', 'Pickup', 'Update order to add pickup person + charges → ledger regenerated', async () => {
        await saveOrder({
            id: ctx.orderId1,
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            pickupPersonId: ctx.pickupId,
            originalPrice: 1000, sellingPrice: 1500,
            pickupCharges: 50, shippingCharges: 100,
            status: 'Pending', notes: `${TEST_PREFIX}Order-1`,
            pickupPaymentStatus: 'Udhar',
        }, USER_ID);

        const ledger = await getLedgerForOrder(ctx.orderId1);
        // Expected: Sale, Purchase, Expense(pickup), Expense(shipping) = 4
        assert(ledger.length === 4, `Expected 4 ledger entries, got ${ledger.length}`);
    });

    await runTest('PICK-02', 'Pickup', 'Expense charges assigned to pickup person', async () => {
        const { data } = await supabase.from('ledger').select('*').eq('order_id', ctx.orderId1).eq('person_id', ctx.pickupId);
        const expenseSum = data.filter(l => l.transaction_type === 'Expense').reduce((s, l) => s + Number(l.amount), 0);
        assert(expenseSum === -150, `Pickup expense sum should be -150, got ${expenseSum}`);
    });

    await runTest('PICK-03', 'Pickup', 'Toggle paid_by_driver → Vendor PaymentOut + Pickup Reimbursement', async () => {
        await saveOrder({
            id: ctx.orderId1,
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            pickupPersonId: ctx.pickupId,
            originalPrice: 1000, sellingPrice: 1500,
            pickupCharges: 50, shippingCharges: 100,
            paidByDriver: true,
            status: 'Pending', notes: `${TEST_PREFIX}Order-1`,
            pickupPaymentStatus: 'Udhar',
        }, USER_ID);

        const ledger = await getLedgerForOrder(ctx.orderId1);
        const vendorPO = ledger.filter(l => l.person_id === ctx.vendorId && l.transaction_type === 'PaymentOut');
        const pickupReimb = ledger.filter(l => l.person_id === ctx.pickupId && l.transaction_type === 'Reimbursement');
        assert(vendorPO.length === 1 && Number(vendorPO[0].amount) === 1000, 'Vendor PaymentOut should be +1000');
        assert(pickupReimb.length === 1 && Number(pickupReimb[0].amount) === -1000, 'Pickup Reimbursement should be -1000');
    });

    await runTest('PICK-04', 'Pickup', 'After driver-paid, vendor balance = 0 (settled)', async () => {
        const bal = await getBalance(ctx.vendorId);
        assert(bal === 0, `Vendor balance should be 0 after driver-paid, got ${bal}`);
    });
}

// ═══════════════════════════════════════════════════════════
// MODULE 5: Payment Settlement
// ═══════════════════════════════════════════════════════════
async function module5_payments() {
    console.log(bold(cyan('\n━━ Module 5: Payment Settlement ━━')));

    await runTest('PAY-01', 'Payments', 'Customer pays → balance = 0', async () => {
        await saveOrder({
            id: ctx.orderId1,
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            pickupPersonId: ctx.pickupId,
            originalPrice: 1000, sellingPrice: 1500,
            pickupCharges: 50, shippingCharges: 100,
            paidByDriver: true,
            customerPaymentStatus: 'Paid',
            status: 'Pending', notes: `${TEST_PREFIX}Order-1`,
            pickupPaymentStatus: 'Udhar',
        }, USER_ID);

        const bal = await getBalance(ctx.customerId);
        assert(bal === 0, `Customer balance should be 0 after payment, got ${bal}`);
    });

    await runTest('PAY-02', 'Payments', 'Vendor paid (non-driver order) → balance settles', async () => {
        // Create a new order without driver-paid, then settle vendor
        const saved = await saveOrder({
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            originalPrice: 2000, sellingPrice: 3000,
            vendorPaymentStatus: 'Paid',
            status: 'Booked', notes: `${TEST_PREFIX}Order-VendorPaid`,
        }, USER_ID);
        ctx.orderId2 = saved.id;

        // Check vendor ledger for this order: should have Purchase(-2000) + PaymentOut(+2000) = 0
        const ledger = await getLedgerForOrder(saved.id);
        const vendorEntries = ledger.filter(l => l.person_id === ctx.vendorId);
        const vendorSum = vendorEntries.reduce((s, l) => s + Number(l.amount), 0);
        assert(vendorSum === 0, `Vendor entries for this order should sum to 0, got ${vendorSum}`);
    });

    await runTest('PAY-03', 'Payments', 'Pickup settled → pickup balance includes all payouts', async () => {
        await saveOrder({
            id: ctx.orderId1,
            productId: ctx.productId, customerId: ctx.customerId, vendorId: ctx.vendorId,
            pickupPersonId: ctx.pickupId,
            originalPrice: 1000, sellingPrice: 1500,
            pickupCharges: 50, shippingCharges: 100,
            paidByDriver: true,
            customerPaymentStatus: 'Paid',
            pickupPaymentStatus: 'Paid',
            status: 'Pending', notes: `${TEST_PREFIX}Order-1`,
        }, USER_ID);

        // For this order: Expense(-50) + Expense(-100) + Reimbursement(-1000) + PaymentOut(50) + PaymentOut(100) + PaymentOut(1000) = 0
        const ledger = await getLedgerForOrder(ctx.orderId1);
        const pickupEntries = ledger.filter(l => l.person_id === ctx.pickupId);
        const pickupSum = pickupEntries.reduce((s, l) => s + Number(l.amount), 0);
        assert(pickupSum === 0, `Pickup entries for this order should net to 0, got ${pickupSum}`);
    });

    await runTest('PAY-04', 'Payments', 'Manual addPayment entry recorded', async () => {
        const { error } = await supabase.from('ledger').insert([{
            user_id: USER_ID, person_id: ctx.customerId,
            amount: -500, transaction_type: 'PaymentIn',
            notes: `${TEST_PREFIX}ManualPayment`,
        }]);
        if (error) throw error;

        const { data } = await supabase.from('ledger').select('*').eq('person_id', ctx.customerId).eq('notes', `${TEST_PREFIX}ManualPayment`);
        assert(data.length === 1, 'Manual payment should be recorded');
        assert(Number(data[0].amount) === -500, 'Amount should be -500');

        // Clean up manual entry (not order-linked)
        await supabase.from('ledger').delete().eq('notes', `${TEST_PREFIX}ManualPayment`);
    });
}

// ═══════════════════════════════════════════════════════════
// MODULE 6: Order Lifecycle
// ═══════════════════════════════════════════════════════════
async function module6_lifecycle() {
    console.log(bold(cyan('\n━━ Module 6: Order Lifecycle ━━')));

    await runTest('LIFE-01', 'Lifecycle', 'Update status to Booked then Shipped → 3 history entries', async () => {
        // Fetch current order
        const { data: order } = await supabase.from('orders').select('*').eq('id', ctx.orderId1).single();
        const currentHistory = Array.isArray(order.status_history) ? order.status_history : [];

        // Update to Booked
        const history2 = [...currentHistory, { status: 'Booked', date: new Date().toISOString() }];
        await supabase.from('orders').update({ status: 'Booked', status_history: history2 }).eq('id', ctx.orderId1);

        // Update to Shipped
        const history3 = [...history2, { status: 'Shipped', date: new Date().toISOString() }];
        await supabase.from('orders').update({ status: 'Shipped', status_history: history3 }).eq('id', ctx.orderId1);

        const { data: updated } = await supabase.from('orders').select('status_history').eq('id', ctx.orderId1).single();
        assert(Array.isArray(updated.status_history), 'status_history should be an array');
        assert(updated.status_history.length >= 3, `Should have at least 3 history entries, got ${updated.status_history.length}`);
    });

    await runTest('LIFE-02', 'Lifecycle', 'Get order by ID returns correct data', async () => {
        const { data, error } = await supabase.from('orders').select(`*, customer:directory!customer_id(name), product:directory!product_id(name), vendor:directory!vendor_id(name)`).eq('id', ctx.orderId1).single();
        if (error) throw error;
        assert(data.id === ctx.orderId1, 'ID should match');
        assert(data.product?.name === `${TEST_PREFIX}Product`, `Product name should match, got ${data.product?.name}`);
        assert(data.customer?.name === `${TEST_PREFIX}Customer`, `Customer name should match`);
        assert(data.vendor?.name === `${TEST_PREFIX}Vendor`, `Vendor name should match`);
        assert(Number(data.original_price) === 1000, 'Original price should be 1000');
        assert(Number(data.selling_price) === 1500, 'Selling price should be 1500');
    });

    await runTest('LIFE-03', 'Lifecycle', 'Delete order → order + ledger cascade deleted', async () => {
        // Delete the canceled order (no ledger to worry about)
        const { error } = await supabase.from('orders').delete().eq('id', ctx.canceledOrderId);
        if (error) throw error;

        const { data } = await supabase.from('orders').select('id').eq('id', ctx.canceledOrderId);
        assert(data.length === 0, 'Canceled order should be deleted');

        // Also delete orderId2 and check ledger cascade
        const ledgerBefore = await getLedgerForOrder(ctx.orderId2);
        assert(ledgerBefore.length > 0, 'Order2 should have ledger entries before deletion');

        await supabase.from('orders').delete().eq('id', ctx.orderId2);
        const ledgerAfter = await getLedgerForOrder(ctx.orderId2);
        assert(ledgerAfter.length === 0, 'Ledger entries should be cascade deleted');
    });
}

// ═══════════════════════════════════════════════════════════
// MODULE 7: Reporting & Dashboard Queries
// ═══════════════════════════════════════════════════════════
async function module7_reports() {
    console.log(bold(cyan('\n━━ Module 7: Reporting & Dashboard Queries ━━')));

    await runTest('RPT-01', 'Reports', 'getTransactions returns orders with correct margin', async () => {
        const { data, error } = await supabase.from('orders')
            .select('*, customer:directory!customer_id(name), product:directory!product_id(name), vendor:directory!vendor_id(name)')
            .eq('user_id', USER_ID).eq('id', ctx.orderId1).single();
        if (error) throw error;

        const op = Number(data.original_price);
        const sp = Number(data.selling_price);
        const pc = Number(data.pickup_charges);
        const sc = Number(data.shipping_charges);
        const expectedMargin = sp - op - pc - sc;
        assert(Number(data.margin) === expectedMargin, `Margin should be ${expectedMargin}, got ${data.margin}`);
    });

    await runTest('RPT-02', 'Reports', 'getDirectoryWithBalances shows correct live balances', async () => {
        const { data } = await supabase.from('directory').select('*, ledger:ledger(amount)').eq('user_id', USER_ID).in('id', [ctx.customerId, ctx.vendorId, ctx.pickupId]);

        for (const item of data) {
            const balanceFromJoin = (item.ledger || []).reduce((s, l) => s + Number(l.amount), 0);
            const balanceDirect = await getBalance(item.id);
            assert(balanceFromJoin === balanceDirect, `Balance mismatch for ${item.name}: join=${balanceFromJoin} vs direct=${balanceDirect}`);
        }
    });
}

// ─── Report Generation ──────────────────────────────────
function generateReport() {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    const totalTime = results.reduce((s, r) => s + r.duration, 0);

    // Console summary
    console.log('\n' + bold('═══════════════════════════════════════'));
    console.log(bold('  TEST RESULTS SUMMARY'));
    console.log(bold('═══════════════════════════════════════'));
    console.log(`  Total:  ${bold(total)}`);
    console.log(`  Passed: ${green(passed)}`);
    console.log(`  Failed: ${failed > 0 ? red(failed) : dim(failed)}`);
    console.log(`  Time:   ${dim(totalTime + 'ms')}`);
    console.log(bold('═══════════════════════════════════════\n'));

    if (failed === 0) {
        console.log(green(bold('  🎉 ALL TESTS PASSED!\n')));
    } else {
        console.log(red(bold('  ⚠  SOME TESTS FAILED\n')));
    }

    // Markdown report
    const now = new Date().toISOString();
    const modules = [...new Set(results.map(r => r.module))];
    let md = `# Neetu Collection — API Test Report\n\n`;
    md += `**Date:** ${now}  \n`;
    md += `**Total:** ${total} | **Passed:** ${passed} | **Failed:** ${failed} | **Duration:** ${totalTime}ms\n\n`;
    md += `## Overall: ${failed === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}\n\n`;

    for (const mod of modules) {
        const modResults = results.filter(r => r.module === mod);
        const modPass = modResults.every(r => r.passed);
        md += `### ${modPass ? '✅' : '❌'} ${mod}\n\n`;
        md += `| ID | Test | Result | Duration | Error |\n`;
        md += `|----|------|--------|----------|-------|\n`;
        for (const r of modResults) {
            md += `| ${r.id} | ${r.name} | ${r.passed ? '✅ Pass' : '❌ Fail'} | ${r.duration}ms | ${r.error || '—'} |\n`;
        }
        md += `\n`;
    }

    md += `---\n*Generated by api_test_suite.js*\n`;

    fs.writeFileSync('test_report.md', md);
    console.log(dim(`  📄 Report saved to test_report.md\n`));
}

// ─── Final Cleanup ───────────────────────────────────────
async function finalCleanup() {
    console.log(cyan('\n🧹 Final cleanup...'));
    const { data: orders } = await supabase.from('orders').select('id').eq('user_id', USER_ID).ilike('notes', `%${TEST_PREFIX}%`);
    if (orders && orders.length > 0) {
        const ids = orders.map(o => o.id);
        await supabase.from('ledger').delete().in('order_id', ids);
        await supabase.from('orders').delete().in('id', ids);
    }
    // Clean up any orphan manual payment ledger entries
    await supabase.from('ledger').delete().ilike('notes', `%${TEST_PREFIX}%`);
    await supabase.from('directory').delete().eq('user_id', USER_ID).ilike('name', `${TEST_PREFIX}%`);
    await supabase.from('profiles').delete().eq('phone', TEST_PHONE);
    console.log(green('  ✓ All test data removed\n'));
}

// ─── Main Runner ─────────────────────────────────────────
async function main() {
    console.log(bold(cyan('\n╔════════════════════════════════════════════╗')));
    console.log(bold(cyan('║  Neetu Collection — API Test Suite         ║')));
    console.log(bold(cyan('║  26 tests · 7 modules · Live Supabase      ║')));
    console.log(bold(cyan('╚════════════════════════════════════════════╝')));

    try {
        await cleanup();
        await module1_auth();
        await module2_directory();
        await module3_orders();
        await module4_pickup();
        await module5_payments();
        await module6_lifecycle();
        await module7_reports();
    } catch (fatalError) {
        console.error(red(`\nFATAL ERROR: ${fatalError.message}`));
    }

    generateReport();
    await finalCleanup();
}

main().catch(console.error);
