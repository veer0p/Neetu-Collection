const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.Project_URL;
const SUPABASE_KEY = process.env.Anon_Key;
const USER_ID = '98b50e2ddc9943efb387052637738f61';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ctx = { customerId: null, vendorId: null, productId: null, pickupPersonId: null };

async function runTest(name, module, description, fn) {
    console.log(`\n🧪 TEST ${name}: [${module}] ${description}`);
    try { await fn(); console.log(`   ✅ PASSED`); }
    catch (e) { console.log(`   ❌ FAILED: ${e.message}`); throw e; }
}

async function getBalance(personId) {
    const { data } = await supabase.from('ledger').select('amount').eq('person_id', personId);
    return (data || []).reduce((sum, r) => sum + Number(r.amount), 0);
}

async function main() {
    console.log('\n🧹 SETUP...');
    const { data: c, error: errC } = await supabase.from('directory').insert({ user_id: USER_ID, name: 'Audit Customer', type: 'Customer' }).select().single();
    if (errC) console.error('Error creating customer:', errC);
    ctx.customerId = c?.id;
    const { data: v, error: errV } = await supabase.from('directory').insert({ user_id: USER_ID, name: 'Audit Vendor', type: 'Vendor' }).select().single();
    if (errV) console.error('Error creating vendor:', errV);
    ctx.vendorId = v?.id;
    const { data: p, error: errP } = await supabase.from('directory').insert({ user_id: USER_ID, name: 'Audit Product', type: 'Product' }).select().single();
    if (errP) console.error('Error creating product:', errP);
    ctx.productId = p?.id;
    const { data: pp, error: errPP } = await supabase.from('directory').insert({ user_id: USER_ID, name: 'Audit Staff', type: 'Pickup Person' }).select().single();
    if (errPP) console.error('Error creating pickup:', errPP);
    ctx.pickupPersonId = pp?.id;

    await runTest('CANCEL-01', 'Cancel', 'Cancel Paid Order Refund Logic', async () => {
        // 1. Create Paid Order
        const { data: ord } = await supabase.from('orders').insert({
            user_id: USER_ID, customer_id: ctx.customerId, vendor_id: ctx.vendorId, product_id: ctx.productId,
            pickup_person_id: ctx.pickupPersonId,
            selling_price: 2500, shipping_charges: 200, pickup_charges: 100,
            status: 'Delivered', customer_payment_status: 'Paid'
        }).select().single();

        // Assume ledger is built: Sale entry 2500, PaymentIn entry -2500
        await supabase.from('ledger').insert([
            { user_id: USER_ID, order_id: ord.id, person_id: ctx.customerId, amount: 2500, transaction_type: 'Sale', is_settled: true },
            { user_id: USER_ID, person_id: ctx.customerId, amount: -2500, transaction_type: 'PaymentIn', is_settled: false }
        ]);

        // 2. Perform Cancellation (Simulate Service Logic)
        // a. Refund Customer
        await supabase.from('ledger').insert([{
            user_id: USER_ID, person_id: ctx.customerId, amount: 2500,
            transaction_type: 'PaymentOut', notes: 'Refund'
        }]);
        // b. Recover logistics from Staff
        await supabase.from('ledger').insert([{
            user_id: USER_ID, person_id: ctx.pickupPersonId, amount: -300,
            transaction_type: 'PaymentIn', notes: 'Recovery'
        }]);

        // 3. Verify
        const customerBal = await getBalance(ctx.customerId);
        if (customerBal !== 0) throw new Error(`Customer balance should be 0, got ${customerBal}`);

        const staffBal = await getBalance(ctx.pickupPersonId);
        if (staffBal !== -300) throw new Error(`Staff should owe us 300 back, got ${staffBal}`);
    });

    await runTest('BULK-01', 'Bulk', 'Bulk Delete Orders (No Cascading)', async () => {
        const { data: ords } = await supabase.from('orders').insert([
            { user_id: USER_ID, customer_id: ctx.customerId, status: 'Pending' },
            { user_id: USER_ID, customer_id: ctx.customerId, status: 'Pending' }
        ]).select();

        // Add one payment entry linked to first order (manual settlement)
        await supabase.from('ledger').insert([{ user_id: USER_ID, order_id: ords[0].id, person_id: ctx.customerId, amount: 100, transaction_type: 'PaymentIn' }]);

        // BULK DELETE
        await supabase.from('orders').delete().in('id', ords.map(o => o.id));

        // Verify payment still exists
        const { data: remains } = await supabase.from('ledger').select('*').eq('person_id', ctx.customerId);
        if (remains.filter(e => e.transaction_type === 'PaymentIn').length === 0) throw new Error('Payment was deleted! Incorrect.');
    });

    console.log('\n🧹 CLEANUP...');
    await supabase.from('ledger').delete().eq('user_id', USER_ID);
    await supabase.from('orders').delete().eq('user_id', USER_ID);
    await supabase.from('directory').delete().eq('user_id', USER_ID);
    console.log('\n✨ COMPLETE');
}

main().catch(e => { console.error(e); process.exit(1); });
