/**
 * Neetu Collection — Comprehensive API Test Suite V2.2
 * Fixed pickup logic and settlement sync.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { Scenarios, AccountIntegrityCases } = require('./test_scenarios');

const SUPABASE_URL = 'https://pavmpakpbzdrxmqomblw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdm1wYWtwYnpkcnhtcW9tYmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTkzMjQsImV4cCI6MjA4NjM5NTMyNH0.KgVOq_5KyARO8pzTybVrUKeCE8BX4GcrRRUnQCoX62Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_ID = '8d4f02b0-f902-4f33-9370-5d3a6f9b7931';

const results = [];

async function getBalance(personId) {
    const { data } = await supabase.from('ledger').select('amount, is_settled, order_id').eq('person_id', personId);
    return (data || []).reduce((acc, l) => {
        if (l.order_id === null || !l.is_settled) return acc + Number(l.amount);
        return acc;
    }, 0);
}

async function saveOrder(order, userId) {
    const margin = (order.sellingPrice || 0) - (order.originalPrice || 0) - (order.pickupCharges || 0) - (order.shippingCharges || 0);
    const orderPayload = {
        user_id: userId,
        date: new Date().toLocaleDateString('en-GB'),
        customer_id: order.customerId,
        vendor_id: order.vendorId,
        pickup_person_id: order.pickupPersonId,
        product_id: order.productId,
        original_price: order.originalPrice || 0,
        selling_price: order.sellingPrice || 0,
        margin,
        pickup_charges: order.pickupCharges || 0,
        shipping_charges: order.shippingCharges || 0,
        paid_by_driver: order.paidByDriver || false,
        customer_payment_status: order.customerPaymentStatus || 'Udhar',
        vendor_payment_status: order.vendorPaymentStatus || 'Udhar',
        pickup_payment_status: order.pickupPaymentStatus || 'Paid',
        notes: order.notes,
        status: order.status || 'Pending'
    };

    const { data: saved, error } = await supabase.from('orders').insert([orderPayload]).select().single();
    if (error) throw error;

    const entries = [];
    const op = order.originalPrice || 0;
    const sp = order.sellingPrice || 0;
    const pc = order.pickupCharges || 0;
    const sc = order.shippingCharges || 0;
    const pbd = order.paidByDriver || false;

    // Sale & Purchase
    entries.push({ user_id: userId, order_id: saved.id, person_id: order.customerId, amount: sp, transaction_type: 'Sale', is_settled: false });
    entries.push({ user_id: userId, order_id: saved.id, person_id: order.vendorId, amount: -op, transaction_type: 'Purchase', is_settled: false });

    if (!order.pickupPersonId && sc > 0) entries.push({ user_id: userId, order_id: saved.id, person_id: order.vendorId, amount: -sc, transaction_type: 'Expense', is_settled: false });
    if (order.pickupPersonId && pc > 0) entries.push({ user_id: userId, order_id: saved.id, person_id: order.pickupPersonId, amount: -pc, transaction_type: 'Expense', is_settled: false });
    if (order.pickupPersonId && sc > 0) entries.push({ user_id: userId, order_id: saved.id, person_id: order.pickupPersonId, amount: -sc, transaction_type: 'Expense', is_settled: false });

    if (pbd && order.pickupPersonId) {
        entries.push({ user_id: userId, order_id: saved.id, person_id: order.vendorId, amount: op, transaction_type: 'PaymentOut', notes: 'Paid by driver', is_settled: true });
        entries.push({ user_id: userId, order_id: saved.id, person_id: order.pickupPersonId, amount: -op, transaction_type: 'Reimbursement', is_settled: false });
    }

    if (order.customerPaymentStatus === 'Paid') entries.push({ user_id: userId, order_id: saved.id, person_id: order.customerId, amount: -sp, transaction_type: 'PaymentIn', is_settled: true });
    if (order.vendorPaymentStatus === 'Paid' && !pbd) entries.push({ user_id: userId, order_id: saved.id, person_id: order.vendorId, amount: op, transaction_type: 'PaymentOut', is_settled: true });

    // Pickup paid
    if (order.pickupPaymentStatus === 'Paid' && order.pickupPersonId) {
        if (pc > 0) entries.push({ user_id: userId, order_id: saved.id, person_id: order.pickupPersonId, amount: pc, transaction_type: 'PaymentOut', notes: 'Pickup settled', is_settled: true });
        if (sc > 0) entries.push({ user_id: userId, order_id: saved.id, person_id: order.pickupPersonId, amount: sc, transaction_type: 'PaymentOut', notes: 'Shipping settled', is_settled: true });
    }

    if (entries.length > 0) {
        const { error: ledgerErr } = await supabase.from('ledger').insert(entries);
        if (ledgerErr) throw ledgerErr;
    }

    // Settlement Sync
    if (order.customerPaymentStatus === 'Paid') await supabase.from('ledger').update({ is_settled: true }).eq('order_id', saved.id).eq('transaction_type', 'Sale');
    if (order.vendorPaymentStatus === 'Paid' || pbd) await supabase.from('ledger').update({ is_settled: true }).eq('order_id', saved.id).eq('transaction_type', 'Purchase');
    if (order.pickupPaymentStatus === 'Paid' && order.pickupPersonId) await supabase.from('ledger').update({ is_settled: true }).eq('order_id', saved.id).eq('transaction_type', 'Expense').eq('person_id', order.pickupPersonId);

    return saved;
}

async function runScenario(s) {
    const name = `T-${s.id}-${Math.floor(Math.random() * 10000)}`;
    const items = [
        { user_id: USER_ID, name: name + '-C', type: 'Customer' },
        { user_id: USER_ID, name: name + '-V', type: 'Vendor' },
        { user_id: USER_ID, name: name + '-P', type: 'Pickup Person' },
        { user_id: USER_ID, name: name + '-Prod', type: 'Product' },
    ];
    const { data: dirData, error: dirErr } = await supabase.from('directory').insert(items).select();
    if (dirErr) throw dirErr;

    const ids = {};
    dirData.forEach(d => {
        if (d.type === 'Customer') ids.customerId = d.id;
        if (d.type === 'Vendor') ids.vendorId = d.id;
        if (d.type === 'Pickup Person') ids.pickupId = d.id;
        if (d.type === 'Product') ids.productId = d.id;
    });

    try {
        const orderData = {
            ...s.input,
            customerId: ids.customerId,
            vendorId: ids.vendorId,
            productId: ids.productId,
            pickupPersonId: s.input.hasPickup ? ids.pickupId : null,
            notes: name
        };
        const saved = await saveOrder(orderData, USER_ID);

        const balC = await getBalance(ids.customerId);
        const balV = await getBalance(ids.vendorId);
        const balP = await getBalance(ids.pickupId);

        if (balC !== s.expected.balances.customer) throw new Error(`Customer balance mismatch. Expected ${s.expected.balances.customer}, got ${balC}`);
        if (balV !== s.expected.balances.vendor) throw new Error(`Vendor balance mismatch. Expected ${s.expected.balances.vendor}, got ${balV}`);
        if (balP !== s.expected.balances.pickup) throw new Error(`Pickup balance mismatch. Expected ${s.expected.balances.pickup}, got ${balP}`);

        const { data: ledger } = await supabase.from('ledger').select('*').eq('order_id', saved.id);
        if (ledger.length !== s.expected.ledgerCount) throw new Error(`Ledger count mismatch. Expected ${s.expected.ledgerCount}, got ${ledger.length}`);

        return true;
    } finally {
        const { data: orders } = await supabase.from('orders').select('id').eq('notes', name);
        if (orders && orders.length > 0) {
            await supabase.from('ledger').delete().eq('order_id', orders[0].id);
            await supabase.from('orders').delete().eq('id', orders[0].id);
        }
        await supabase.from('directory').delete().in('id', Object.values(ids));
    }
}

async function addPayment(personId, amount, type, userId) {
    const { error } = await supabase.from('ledger').insert([{
        user_id: userId, person_id: personId, amount, transaction_type: type, is_settled: false
    }]);
    if (error) throw error;
}

async function runIntegrity(c) {
    const name = `INT-${c.id}-${Math.floor(Math.random() * 10000)}`;
    const { data: person } = await supabase.from('directory').insert([{ user_id: USER_ID, name: name, type: 'Customer' }]).select().single();

    try {
        for (const step of c.steps) {
            if (step.action === 'ADD_PAYMENT') {
                await addPayment(person.id, step.amount, step.type, USER_ID);
            } else if (step.action === 'DELETE_FIRST') {
                const { data } = await supabase.from('ledger').select('id').eq('person_id', person.id).order('created_at', { ascending: true }).limit(1).single();
                await supabase.from('ledger').delete().eq('id', data.id);
            }
            const bal = await getBalance(person.id);
            if (bal !== step.expectedBalance) throw new Error(`Step failed. Expected balance ${step.expectedBalance}, got ${bal}`);
        }
        return true;
    } finally {
        await supabase.from('ledger').delete().eq('person_id', person.id);
        await supabase.from('directory').delete().eq('id', person.id);
    }
}

async function main() {
    process.stdout.write(`\n🚀 Neetu Collection V2.2 Test Suite\n\n`);

    for (const s of Scenarios) {
        const start = Date.now();
        try {
            await runScenario(s);
            results.push({ id: s.id, name: s.name, passed: true, duration: Date.now() - start });
            process.stdout.write(`  \x1b[32m✓\x1b[0m \x1b[2m${s.id}\x1b[0m ${s.name}\n`);
        } catch (err) {
            results.push({ id: s.id, name: s.name, passed: false, error: err.message, duration: Date.now() - start });
            process.stdout.write(`  \x1b[31m✗\x1b[0m \x1b[2m${s.id}\x1b[0m ${s.name} - \x1b[31m${err.message}\x1b[0m\n`);
        }
    }

    for (const c of AccountIntegrityCases) {
        const start = Date.now();
        try {
            await runIntegrity(c);
            results.push({ id: c.id, name: c.name, passed: true, duration: Date.now() - start });
            process.stdout.write(`  \x1b[32m✓\x1b[0m \x1b[2m${c.id}\x1b[0m ${c.name}\n`);
        } catch (err) {
            results.push({ id: c.id, name: c.name, passed: false, error: err.message, duration: Date.now() - start });
            process.stdout.write(`  \x1b[31m✗\x1b[0m \x1b[2m${c.id}\x1b[0m ${c.name} - \x1b[31m${err.message}\x1b[0m\n`);
        }
    }

    const passed = results.filter(r => r.passed).length;
    process.stdout.write(`\nSummary: ${passed}/${results.length} passed\n\n`);

    let md = `# API Test Report\n\n`;
    md += `| Test | Name | Result | Error |\n|---|---|---|---|\n`;
    results.forEach(r => md += `| ${r.id} | ${r.name} | ${r.passed ? '✅' : '❌'} | ${r.error || '-'} |\n`);
    fs.writeFileSync('V2_TEST_REPORT.md', md);
}

main();
