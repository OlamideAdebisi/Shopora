import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const env = (name: string) => Deno.env.get(name) || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await req.json();
  const supabaseUrl = env('SUPABASE_URL');
  const supabaseKey = env('SHOPORA_SUPABASE_SECRET_KEY');
  if (!supabaseUrl || !supabaseKey) return json({ error: 'Function secrets are not configured.' }, 500);
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

  if (body.type === 'subscriber') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
    const response = await fetch(`${supabaseUrl}/rest/v1/newsletter_subscribers`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ email }) });
    if (!response.ok) return json({ error: 'We could not save your email.' }, 500);
    return json({ ok: true }, 201);
  }

  const { customer, items, total } = body;
  if (!customer?.email || !Array.isArray(items) || !items.length) return json({ error: 'Customer email and items are required.' }, 400);
  const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, { method: 'POST', headers, body: JSON.stringify({ customer_email: customer.email, customer_name: [customer.firstName, customer.lastName].filter(Boolean).join(' '), address: customer.address || null, city: customer.city || null, postal_code: customer.postalCode || null, items, total: Number(total) || 0, status: 'confirmed' }) });
  const saved = await orderResponse.json();
  if (!orderResponse.ok || !saved[0]) return json({ error: 'The order could not be saved. No email was sent.', details: saved }, 500);
  const order = saved[0];
  const rows = items.map((item: { name: string; qty: number; price: number }) => `<tr><td>${item.name}</td><td>${item.qty}</td><td>$${(item.price * item.qty).toFixed(2)}</td></tr>`).join('');
  const emailResponse = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env('RESEND_FROM_EMAIL'), to: [customer.email], subject: `Shopora order confirmation #${order.id}`, html: `<h1>Thank you for your Shopora order</h1><p>Your order <strong>#${order.id}</strong> has been received.</p><table><tr><th>Item</th><th>Qty</th><th>Total</th></tr>${rows}</table><p><strong>Total: $${Number(order.total).toFixed(2)}</strong></p>` }) });
  if (!emailResponse.ok) return json({ error: 'Order saved, but the confirmation email could not be sent.', orderId: order.id }, 502);
  return json({ ok: true, orderId: order.id }, 201);
});
