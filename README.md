# Shopora

## Order confirmation setup

1. Run the SQL in `supabase-schema.sql` in the Supabase SQL editor.
2. Copy `.env.example` to `.env` and fill in the Supabase and Resend values.
3. Verify the sender domain in Resend and set `RESEND_FROM_EMAIL` to that verified address.
4. Install and run:

```bash
npm install
npm start
```

Checkout saves the order in Supabase first. Resend is called only after the insert succeeds.
