// Copies includes/header.html and includes/footer.html into every page's
// <div id="site-header"></div> / <div id="site-footer"></div> placeholder, so
// the live site ships the header in the HTML instead of fetching it after load
// (which made it pop in late). nav.js sees the header is already there and
// skips the fetch. Runs in the deploy workflow, on the CI checkout only: the
// repo keeps the empty placeholders, so you still edit the header in one file.
//
//   node tools/inline-includes.mjs [siteDir]    (default: httpdocs/dist)

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = process.argv[2] ?? join(repo, "httpdocs", "dist");

const header = readFileSync(join(site, "includes", "header.html"), "utf8");
const footer = readFileSync(join(site, "includes", "footer.html"), "utf8");

// The includes use relative links ("services.html", "./assets/..."), which only
// resolve on top-level pages. Pages in a subfolder, and the 404 page (served at
// whatever URL was requested), get root-absolute links instead.
const rootAbsolute = (html) =>
  html.replace(/\b(href|src)="(?![a-z][a-z0-9+.-]*:|\/|#)(?:\.\/)?([^"]*)"/gi, '$1="/$2"');

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "includes") yield* htmlFiles(p);
    } else if (name.endsWith(".html")) {
      yield p;
    }
  }
}

let count = 0;
for (const file of htmlFiles(site)) {
  const html = readFileSync(file, "utf8");
  if (!html.includes('<div id="site-header"></div>')) continue;
  const rel = relative(site, file);
  const absolute = rel.includes(sep) || rel === "404.html";
  const h = absolute ? rootAbsolute(header) : header;
  const f = absolute ? rootAbsolute(footer) : footer;
  const out = html
    .replace('<div id="site-header"></div>', () => `<div id="site-header" data-inlined>${h}</div>`)
    .replace('<div id="site-footer"></div>', () => `<div id="site-footer" data-inlined>${f}</div>`);
  writeFileSync(file, out);
  count++;
  console.log(`inlined  ${rel}${absolute ? "  (root-absolute links)" : ""}`);
}
if (count === 0) throw new Error(`No pages with placeholders found in ${site}`);
