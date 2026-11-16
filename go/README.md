# freemocap.org/go short links and QR codes

Our own replacement for Bitly. Each QR code points at `https://freemocap.org/go/<slug>`, which redirects to the real page. Printed codes never need reprinting: change the destination here and redeploy.

## Add or change a link

1. Edit `links.csv`, one row per link: `slug,url,note`.
   - slug: lowercase letters, numbers, and dashes (`sfn26-booth`)
   - url: the destination, must be `https://`
   - note: anything, for us (where the code is printed, etc.)
2. Build:
   ```bash
   cd go && npm install && npm run build
   ```
3. Commit and deploy the site as usual.

The build writes, all inside the site so they deploy with it:

- `httpdocs/dist/go/.htaccess`: the redirects
- `httpdocs/dist/go/qr/<slug>.svg` + `.png`: the QR codes (SVG for print, PNG for slides and the web)
- `httpdocs/dist/go/qr/index.html`: the public download page at **freemocap.org/go/qr/** (noindex, so it stays out of search results)

`qr` is reserved and can't be used as a slug.

Every code has its destination URL printed underneath (without `https://`), sized to span exactly the width of the code, and the b&w skelly (`logo-bw.png`) in a white circle in the center. The codes use the highest error correction level (H), so the logo doesn't hurt scanning. Swap `logo-bw.png` to change the logo; keep it black on transparent.

## Rules of thumb

- Never delete or rename a slug that's been printed. Repoint it instead.
- Mistyped or deleted slugs land on the homepage, not a 404.
- Redirects are 302 (temporary) on purpose so phones and browsers don't cache them.

## Why this doesn't trigger security warnings

- The QR codes show our own domain, over HTTPS, so phone cameras preview `freemocap.org`, not a shortener domain that spam filters distrust.
- It is not an "open redirect": destinations come only from this file, never from the URL, so nobody can use our domain to bounce people to a phishing site (the thing that gets domains flagged by Google Safe Browsing).
- The build refuses `http://` destinations.
