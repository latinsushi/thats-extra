# That's Extra

Charge for the extra ask in 60 seconds.

A static web tool for independent designers, developers, and consultants on fixed-price or loosely scoped client work. Describe the extra ask. Get a professional email and a one-page PDF change request.

Price: $19 once. Checkout is not wired yet. The generator works free. Licensed PDFs drop the free-version footer line.

## How to open locally

No build step. No backend.

```bash
cd projects/001-thats-extra
python3 -m http.server 8080
```

Then open http://localhost:8080/

Or open `index.html` directly in a browser. PDF download needs the jsPDF CDN, so a local server is more reliable than a `file://` URL.

Unlock a watermark-free PDF for testing:

http://localhost:8080/?license=demo

That sets `localStorage.thatsExtraLicense`. Any non-empty value removes the free-version line.

## Files

- `index.html` (marketing + the generator)
- `scope-creep-email.html` (free scope creep email template, SEO)
- `freelance-change-order.html` (freelance change order / change request template, SEO)
- `styles.css`
- `app.js`

## How to deploy

Upload this folder as static files. Any host works: GitHub Pages, Netlify, Cloudflare Pages, S3, nginx.

Keep the four HTML files at the site root of this project so these paths stay intact:

- `/` or `/index.html`
- `/scope-creep-email.html`
- `/freelance-change-order.html`

Suggested public URL slug: `thats-extra`

## Where this gets found

SEO pages first. People search “scope creep email template”, “how to charge a client for extra work”, “freelance change order”, and “change request template freelance” after a Slack that says “can you also…”

Communities next. r/freelance, r/Upwork, r/webdev. Answer the thread with the free email. Point at the generator for the priced PDF.

Later: a Gumroad listing of the template pack (email + change order), with the $19 license as the product.

## Privacy

Nothing typed in the form is uploaded. It stays in the browser.
