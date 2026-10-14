import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const app = express();
const port = process.env.PORT || 8000;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_URL || !supabaseKey) throw new Error('SUPABASE_URL and a Supabase key are required in .env');
const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(express.static('.'));

app.post('/api/orders', async (req, res) => {
  const { customer, items, total } = req.body || {};
  if (!customer?.email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'A customer email and at least one item are required.' });
  }

  const order = {
    customer_email: customer.email,
    customer_name: [customer.firstName, customer.lastName].filter(Boolean).join(' '),
    address: customer.address || null,
    city: customer.city || null,
    postal_code: customer.postalCode || null,
    items,
    total: Number(total) || 0,
    status: 'confirmed'
  };

  // The email is deliberately sent only after this insert succeeds.
  const { data: savedOrder, error: saveError } = await supabase
    .from('orders')
    .insert(order)
    .select('id, created_at, customer_email, total')
    .single();

  if (saveError) {
    console.error('Order save failed:', saveError);
    return res.status(500).json({ error: 'The order could not be saved. No email was sent.' });
  }

  const itemRows = items.map(item => `<tr><td>${item.name}</td><td>${item.qty}</td><td>$${(item.price * item.qty).toFixed(2)}</td></tr>`).join('');
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: [customer.email],
    subject: `Shopora order confirmation #${savedOrder.id}`,
    html: `<h1>Thank you for your Shopora order</h1><p>Your order <strong>#${savedOrder.id}</strong> has been received.</p><table><tr><th>Item</th><th>Qty</th><th>Total</th></tr>${itemRows}</table><p><strong>Total: $${Number(savedOrder.total).toFixed(2)}</strong></p>`
  });

  if (emailError) {
    console.error('Confirmation email failed:', emailError);
    return res.status(502).json({ error: 'Order saved, but the confirmation email could not be sent.', orderId: savedOrder.id });
  }

  return res.status(201).json({ ok: true, orderId: savedOrder.id });
});

app.listen(port, () => console.log(`Shopora running at http://localhost:${port}`));
