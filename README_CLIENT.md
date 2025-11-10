
# KOKO IT — Client Launch Guide (Cloudflare Pages + www.kokoits.com)

This repository hosts a **static website**: everything in **`public/`** is published.
Goal: deploy on **Cloudflare Pages** with the custom domain **`www.kokoits.com`** (and redirect the apex `kokoits.com` to `www`).

---

## 1) Repository structure

├─ public/                
│  ├─ index.html
│  ├─ services.html
│  ├─ about.html
│  ├─ contact.html
│  ├─ 404.html
│  ├─ thanks.html
│  ├─ site.css
│  ├─ app.js
│  ├─ assets/            
│  │  ├─ hero.mp4
│  │  ├─ hero-poster.jpg
│  │  ├─ hw-keyboards-box.jpg
│  │  └─ ...
│  ├─ favicon.svg
│  ├─ robots.txt         # configured -> https://kokoits.com/robots.txt
│  └─ sitemap.xml        # configured -> https://kokoits.com/sitemap.xml
│  README.md
└─ README_CLIENT.md

- **No build step** required (pure static site).
- The form in `contact.html` posts to `/forms/quote` (optional backend, see §6).

---

## 2) Deploy to Cloudflare Pages

**A. Connect the GitHub repo**
1. Cloudflare Dashboard → **Pages** → **Create a project** → **Connect to Git** (select this repo).
2. **Build settings**:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **public**
3. Save → wait for the first deployment (you’ll get an URL like `https://<project>.pages.dev/`).

**B. Add the custom domain**
1. Project → **Custom domains** → **Add** → enter **`www.kokoits.com`**.
2. If your DNS zone is already on Cloudflare, validation is automatic.  
   If DNS is external, create the **CNAME** `www` → target provided by Cloudflare (`*.pages.dev`).
3. Enforce HTTPS and verify: `https://www.kokoits.com/`.

---

## 3) Redirect apex → www (recommended)

Redirect **`https://kokoits.com/*`** to **`https://www.kokoits.com/$1`** with **301**:

- Cloudflare → **Rules → Redirect Rules → Create**
  - Source: `https://kokoits.com/*`
  - Target: `https://www.kokoits.com/$1`
  - Status code: **301**

---

## 4) Updates & cache

- Edit files in **`public/`**, then **commit & push** to **`main`** → Pages deploys automatically.
- To bust browser/CDN cache on static assets, append a version query (e.g. `/site.css?v=2`, `/assets/hero.mp4?v=2`).

---

## 5) SEO & performance

- `robots.txt` allows all and points to **`https://kokoits.com/sitemap.xml`**.
- `sitemap.xml` lists the main pages (home, services, about, contact, privacy, terms).
- Ensure `<title>` and `<meta name="description">` match the final wording.
- Prefer JPEG/WebP images, sensible sizes (≤ ~2000 px wide).
- **Analytics (GA4)** can be added later **after consent** (cookie banner/logic if required).

---

## 6) Contact form (“Request a Quote”) — optional

By default `contact.html` posts to `/forms/quote`. Pick one:

**Option A — Third-party form service (fastest)**
- Use Formspark / Formcarry / Getform, etc.
- Replace `action="/forms/quote"` with the provider URL:
  ```html
  <form method="post" action="https://submit-form.com/XXXXXXXX">
Add a honeypot or reCAPTCHA if needed.

Option B — Cloudflare Pages Functions

Add a function at functions/forms/quote.ts (or .js) to handle the POST
(store data and/or send email via Resend/Sendgrid).

Keep the form action="/forms/quote".

## 7) Quick tests
https://www.kokoits.com/

https://www.kokoits.com/services.html

https://www.kokoits.com/about.html

https://www.kokoits.com/contact.html

https://www.kokoits.com/robots.txt

https://www.kokoits.com/sitemap.xml

(Optional local preview: run a static server pointing to public/, e.g. npx serve public -p 3000 and open http://localhost:3000.)

## 8) Final checklist
 *  Site live at https://www.kokoits.com

 *  Apex redirect kokoits.com → www.kokoits.com (301)

 *  robots.txt and sitemap.xml OK

 *  Pages: Home, Services, About, Contact OK

 *  Partner logos and images approved

 *  (Optional) Form connected and tested

 *  (Optional) GA4 integrated after consent

============== * Technical contact: TOOL-GO Inc. — contact@toolgoinc.com — https://www.toolgoinc.com ===============