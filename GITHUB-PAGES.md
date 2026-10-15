# GitHub Pages deployment

After this workflow runs, open the repository's **Settings → Pages** and set **Source** to **GitHub Actions** if GitHub asks for a source.

The site URL will be:

`https://olamideadebisi.github.io/Shopora/`

GitHub Pages hosts the frontend only. The Supabase/Resend Express server must be deployed separately, and the frontend API URLs must point to that deployed backend instead of `/api/orders` and `/api/subscribers`.
