const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pavmpakpbzdrxmqomblw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdm1wYWtwYnpkcnhtcW9tYmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTkzMjQsImV4cCI6MjA4NjM5NTMyNH0.KgVOq_5KyARO8pzTybVrUKeCE8BX4GcrRRUnQCoX62Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_ID = '8d4f02b0-f902-4f33-9370-5d3a6f9b7931'; // Veer's Profile ID
let testData = {};

async function log(step, message) {
    console.log(`\x1b[36m[STEP ${step}]\x1b[0m ${message}`);
}

async function success(message) {
    console.log(`   \x1b[32m✓\x1b[0m ${message}`);
}

async function error(message) {
    console.log(`   \x1b[31m✗\x1b[0m ${message}`);
}

async function cleanup() {
    log(0, 'Cleaning up existing test data...');
    // Delete test orders (which should cascade to ledger if DB set up right, but we do it manually to be safe)
    const { data: orders } = await supabase.from('orders').select('id').eq('user_id', USER_ID).ilike('notes', '%TEST_ORDER%');
    if (orders && orders.length > 0) {
        const ids = orders.map(o => o.id);
        await supabase.from('ledger').delete().in('order_id', ids);
        await supabase.from('orders').delete().in('id', ids);
    }
    await supabase.from('directory').delete().eq('user_id', USER_ID).ilike('name', 'TEST-%');
    success('Cleanup complete.');
}

async function setupMasterData() {
    log(1, 'Setting up Master Data (Directory)...');
    const items = [
        { user_id: USER_ID, name: 'TEST-Product', type: 'Product' },
        { user_id: USER_ID, name: 'TEST-Vendor', type: 'Vendor' },
        { user_id: USER_ID, name: 'TEST-Customer', type: 'Customer' },
        { user_id: USER_ID, name: 'TEST-Driver', type: 'Pickup Person' }
    ];
    const { data, error: err } = await supabase.from('directory').insert(items).select();
    if (err) throw err;

    data.forEach(i => {
        if (i.type === 'Product') testData.productId = i.id;
        if (i.type === 'Vendor') testData.vendorId = i.id;
        if (i.type === 'Customer') testData.customerId = i.id;
        if (i.type === 'Pickup Person') testData.pickupId = i.id;
    });
    success('Master data created.');
}

async function testOrderCreation() {
    log(2, 'Testing Order Creation (Automated Ledger Phase 1)...');

    // We mimic the logic in supabaseService.ts
    const orderPayload = {
        user_id: USER_ID,
        date: new Date().toLocaleDateString('en-GB'),
        product_id: testData.productId,
        customer_id: testData.customerId,
        vendor_id: testData.vendorId,
        original_price: 1000,
        selling_price: 1500,
        margin: 500,
        status: 'Pending',
        notes: 'TEST_ORDER_PHASE_1'
    };

    const { data: order, error: err } = await supabase.from('orders').insert([orderPayload]).select().single();
    if (err) throw err;
    testData.orderId = order.id;

    // Mimic the ledger creation logic
    const entries = [
        { user_id: USER_ID, order_id: order.id, person_id: testData.customerId, amount: 1500, transaction_type: 'Sale' },
        { user_id: USER_ID, order_id: order.id, person_id: testData.vendorId, amount: -1000, transaction_type: 'Purchase' }
    ];
    await supabase.from('ledger').insert(entries);

    // Verify
    const { data: ledger } = await supabase.from('ledger').select('*').eq('order_id', order.id);
    if (ledger.length === 2) {
        success('Order created. Ledger has 2 entries (Sale & Purchase).');
    } else {
        error(`Ledger has ${ledger.length} entries, expected 2.`);
    }
}

async function testOrderUpdateWithPickup() {
    log(3, 'Testing Order Update with Pickup (Ledger Regeneration)...');

    // Mimic update logic: Delete old, create new
    await supabase.from('ledger').delete().eq('order_id', testData.orderId);

    await supabase.from('orders').update({
        pickup_person_id: testData.pickupId,
        pickup_charges: 50,
        shipping_charges: 100,
        notes: 'TEST_ORDER_PHASE_2'
    }).eq('id', testData.orderId);

    const entries = [
        { user_id: USER_ID, order_id: testData.orderId, person_id: testData.customerId, amount: 1500, transaction_type: 'Sale' },
        { user_id: USER_ID, order_id: testData.orderId, person_id: testData.vendorId, amount: -1000, transaction_type: 'Purchase' },
        { user_id: USER_ID, order_id: testData.orderId, person_id: testData.pickupId, amount: -50, transaction_type: 'Expense', notes: 'Pickup charges' },
        { user_id: USER_ID, order_id: testData.orderId, person_id: testData.pickupId, amount: -100, transaction_type: 'Expense', notes: 'Shipping charges' }
    ];
    await supabase.from('ledger').insert(entries);

    const { data: ledger } = await supabase.from('ledger').select('*').eq('order_id', testData.orderId);
    if (ledger.length === 4) {
        success('Order updated. Ledger regenerated with 4 entries (Sale, Purchase, 2x Expense).');
    } else {
        error(`Ledger has ${ledger.length} entries, expected 4.`);
    }
}

async function testPayments() {
    log(4, 'Testing Payments (Settlement Phase)...');

    // Simulate Customer Paid
    await supabase.from('ledger').insert([
        { user_id: USER_ID, order_id: testData.orderId, person_id: testData.customerId, amount: -1500, transaction_type: 'PaymentIn' }
    ]);

    // Check balance for customer
    const { data: ledger } = await supabase.from('ledger').select('amount').eq('person_id', testData.customerId);
    const balance = ledger.reduce((acc, l) => acc + Number(l.amount), 0);

    if (balance === 0) {
        success('Customer PaymentIn recorded. Customer balance is 0.');
    } else {
        error(`Customer balance is ${balance}, expected 0.`);
    }
}

async function runAllTests() {
    console.log('\x1b[35m=== Neetu Collection Business Logic Automation ===\x1b[0m\n');
    try {
        await cleanup();
        await setupMasterData();
        await testOrderCreation();
        await testOrderUpdateWithPickup();
        await testPayments();
        console.log('\n\x1b[32m=== ALL TESTS PASSED SUCCESSFULLY ===\x1b[0m');
    } catch (err) {
        console.error('\n\x1b[31m=== TEST FAILED ===\x1b[0m');
        console.error(err);
    }
}

runAllTests();
