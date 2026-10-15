# Supabase Edge Function deployment

Create a Supabase Edge Function named `shopora-api` and paste in `supabase/functions/shopora-api/index.ts`.

Set these production secrets in **Supabase → Edge Functions → Secrets**:

```text
SHOPORA_SUPABASE_SECRET_KEY=your-secret-key
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=Shopora <onboarding@resend.dev>
```

`SUPABASE_URL` is provided automatically by Supabase Edge Functions.

Deploy with the Supabase CLI:

```bash
supabase functions deploy shopora-api --no-verify-jwt
```

The function URL is:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/shopora-api
```

The frontend must call that URL for both orders and newsletter subscribers. Supabase Edge Functions handle CORS preflight requests using the supplied CORS headers.
