# Canopy — The AI Platform for Australian Teachers

> 7 AI tools: Worksheets · Report Writer · Behaviour Coach · Decodable Stories · Differentiation · NCCD Planner · Cross-Curriculum Priorities

---

## 🚀 Deploy to Production — Step by Step

### What you need
- A computer (Mac or Windows)
- 60–90 minutes
- Credit card for domain (~$20/yr) and Anthropic API (~$5 to start)

---

### STEP 1 — Install Node.js (5 mins)
1. Go to https://nodejs.org → download **LTS** version → install
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Type `node --version` → should show a number like `v20.x.x`

---

### STEP 2 — Get your Anthropic API Key (10 mins)
1. Go to https://console.anthropic.com → create account
2. **API Keys** → **Create Key** → copy it (starts with `sk-ant-...`)
3. **Billing** → add a credit card → set a spend limit of $50/month to be safe
4. Keep this key safe — don't share it

---

### STEP 3 — Set up Clerk (authentication) (15 mins)
1. Go to https://clerk.com → **Start for free**
2. Click **Create Application**
   - Application name: `Canopy`
   - Sign-in options: tick **Email** and **Google**
   - Click **Create application**
3. You'll see your keys on the next screen. Copy both:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...`
4. Under **User & Authentication → Email, Phone, Username**:
   - Make sure **Email address** is enabled
5. Under **Customization → Branding** (optional):
   - Add your logo, set colours to match Canopy

---

### STEP 4 — Upload code to GitHub (15 mins)
1. Go to https://github.com → create a free account
2. Click **New repository** → name: `canopy` → **Private** → Create
3. Download **GitHub Desktop** from https://desktop.github.com
4. In GitHub Desktop: **File → Add Local Repository** → select this folder
5. **Publish repository** → keep Private → Publish

---

### STEP 5 — Deploy to Vercel (10 mins)
1. Go to https://vercel.com → **Sign up with GitHub**
2. **New Project** → import your `canopy` repository
3. Vercel detects Vite automatically — just click **Deploy**
4. Wait ~2 minutes for first deploy

---

### STEP 6 — Add environment variables to Vercel (10 mins)
In Vercel: **Settings → Environment Variables** — add ALL of these:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | Your key from Step 2 |
| `VITE_CLERK_PUBLISHABLE_KEY` | Your pk_test_... from Step 3 |
| `CLERK_SECRET_KEY` | Your sk_test_... from Step 3 |
| `VITE_STRIPE_PRO_LINK` | Your Stripe link (add after Step 8) |

After adding all variables: **Deployments → ⋯ → Redeploy**

---

### STEP 7 — Connect your domain (10 mins)
1. Buy domain at https://ventraip.com.au
   - Try: `canopy.edu.au` or `canopyedu.com.au` or `getcanopy.com.au`
2. In Vercel: **Settings → Domains** → add your domain
3. Vercel shows you DNS records to add
4. In VentraIP: **DNS Management** → add the records Vercel shows you
5. Wait 10–30 mins → your site is live at your domain ✅

---

### STEP 8 — Set up Stripe payments (20 mins)
1. Go to https://stripe.com/au → create account
2. **Products → Add Product**
   - Name: `Canopy Pro`
   - Price: `$9.00 AUD` / month / recurring
3. **Payment Links → Create link** for this product
4. Copy the link (e.g. `https://buy.stripe.com/xxxxx`)
5. Add `VITE_STRIPE_PRO_LINK` to Vercel env vars (Step 6)
6. Redeploy — the **Create account** button now leads to Stripe ✅

---

### STEP 9 — Add your Canopy app URL to Clerk (5 mins)
1. Go to https://dashboard.clerk.com → your Canopy app
2. **Domains** → add your live domain (e.g. `canopy.edu.au`)
3. This allows Clerk to work on your custom domain

---

### STEP 10 — Test everything ✅
- [ ] Visit your domain
- [ ] Click "Create account" → Clerk signup appears → create a test account
- [ ] Click any tool card → sign-up gate appears for non-users
- [ ] After signing in → tools are accessible
- [ ] Click "Create account" in pricing → goes to Stripe
- [ ] State selector works (NSW, VIC etc)
- [ ] Generate a worksheet — appears correctly

---

## 🔧 Making updates after launch

1. Ask Claude to update the code
2. Copy updated `App.jsx` into `canopy-project/src/App.jsx`
3. GitHub Desktop → see the changes → write a commit message → **Commit to main**
4. **Push origin** → Vercel auto-redeploys in ~60 seconds ✅

---

## 💰 Running costs

| Item | Cost |
|------|------|
| Domain | ~$20/year |
| Vercel (Hobby) | Free |
| Clerk (up to 10,000 users) | Free |
| Anthropic API | ~$3–15/month |
| Stripe fees | 1.75% + 30¢/transaction |
| **50 subscribers** | **~$450 revenue, ~$120 costs = ~$330/month profit** |
| **200 subscribers** | **~$1,800 revenue, ~$280 costs = ~$1,520/month profit** |

---

## 📁 Project structure

```
canopy-project/
├── api/
│   └── claude.js          ← Secure proxy: verifies Clerk auth + calls Anthropic
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx           ← Wraps app in ClerkProvider
│   └── App.jsx            ← Full Canopy app (1063 lines)
├── .env.example           ← Copy to .env.local, add real keys
├── .gitignore             ← Keeps keys out of GitHub
├── index.html             ← HTML with SEO meta tags
├── package.json           ← React + Vite + Clerk dependencies
├── vercel.json            ← Vercel routing config
└── vite.config.js         ← Build config
```

---

## 🔑 Local development

```bash
# 1. Install dependencies
npm install

# 2. Set up env variables
cp .env.example .env.local
# Edit .env.local and add all 3 real keys

# 3. Run dev server
npm run dev

# 4. Open http://localhost:5173
```

---

## ❓ Common issues

**"Missing VITE_CLERK_PUBLISHABLE_KEY"**
→ You forgot to add it to `.env.local` (local) or Vercel env vars (production)

**Tools show "Please sign in" error**
→ The Clerk secret key isn't in Vercel env vars, or you need to redeploy after adding it

**Blank page after deploy**
→ Check Vercel **Deployments → Functions** tab for error logs

**"Session expired" errors**
→ Clerk tokens expire — user needs to sign in again. Normal behaviour.

---

Built by Luke Hall Education · Ballina NSW · hello@canopy.edu.au
