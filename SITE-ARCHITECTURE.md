# freemocap.org: Proposed Site Architecture

Working document. Not a spec, not final. Edit freely.

## Hard constraint on this document

**Nothing in this plan changes, shortens, moves, or removes any copy.**

Every recommendation here is structural: where links point, how the nav is
organised, what redirects exist, and which unlinked files get retired. Section
content stays exactly as written unless Paul decides otherwise, and that is a
separate decision that this document does not make and does not recommend.

Where a structural choice would depend on a content decision, it is listed under
"Content decisions" at the bottom as an open question with no recommendation
attached.

## Other constraints

- v2 of the app is mid-release and the docs are not updated yet.
- `docs.freemocap.org` owns Download for now. `/download` stays a 301.
- A local download page is wanted eventually but is out of scope here.

---

## The core problem

The problem is not the content. It is that **the same word points at different
places depending on which piece of chrome you click.**

| Word | Where it takes you, depending on where you click it |
|---|---|
| Services | Nav split button goes to `services.html`. About Us dropdown goes to `services.html`. Footer goes to index `#services`. |
| Community | Nav dropdown parent goes to index `#community`. Its child goes to `showcase.html`. Footer goes to index `#community`. |
| Documentation | Nav header goes to `docs.freemocap.org`. Resources dropdown, Resources page, and footer all go to `freemocap.github.io`. |
| Resources | The page lists 6 items. The dropdown lists 3. The footer lists 2. No two lists agree. |

Nothing above is a content problem. Every row is a link target that disagrees
with another link target for the same label.

There is also a **predictability problem**: a visitor cannot tell in advance
whether a nav item will load a page or jump to a spot on the index. Some do one,
some do the other, with no pattern.

---

## The proposed rule

**Anchors live in exactly one menu. Everything else points at pages.**

A `Home` dropdown becomes the map of the index page and owns every anchor link
on the site. No other menu, and not the footer, uses an anchor. The rule a
visitor learns in one interaction: under Home means a place on the homepage,
anywhere else means a page.

This is a pure linking change. No section is added, removed, resized, or
rewritten. Two index sections that currently have no nav access at all,
`#how-it-works` and `#features`, become reachable.

---

## Proposed structure

```mermaid
flowchart TD
    Home["Home ▾<br/>map of the index"]

    subgraph nav["Top nav"]
        Home
        R["Resources ▾"]
        C["Community ▾"]
        A["About ▾"]
        D["User Data"]
        S["Shop ↗"]
        CTA["Services | Download"]
    end

    Home --> H1["How does it work?<br/>#how-it-works"]
    Home --> H2["User Data (Highlights)<br/>#impact"]
    Home --> H3["Our Mission<br/>#mission"]
    Home --> H4["Why Choose FreeMoCap?<br/>#features"]
    Home --> HV["This Is FreeMoCap<br/>#video"]
    Home --> H5["Cheatsheet<br/>#cheatsheet"]
    Home --> H6["Services<br/>#services"]
    Home --> H7["Join Our Community<br/>#community"]

    R --> Docs["Documentation ↗<br/>docs.freemocap.org"]
    R --> Install["Installation Guide ↗"]
    R --> Code["Source Code ↗<br/>github"]
    R --> ResPage["/resources"]

    C --> Show["/showcase"]
    C --> Disc["Discord ↗"]
    C --> YT["YouTube ↗"]
    C --> Tw["Twitch ↗"]

    A --> About["/about-us"]
    A --> Donate["/about-us#donate"]

    D --> Data["/data"]
    CTA --> Serv["/services"]
    CTA --> Dl["/download → 301<br/>docs.freemocap.org"]
```

---

## Canonical destination per concept

This table says only **which URL a link with that label should point to**. It
says nothing about where content lives or how much of it there is.

| Label | Points at | Currently |
|---|---|---|
| Services | `/services` | Split CTA and About Us dropdown correct. Footer points at the index anchor. |
| Community | `/showcase` | **Done.** Nav parent now points at `/showcase`, matching where `/community` has always redirected. Footer still points at the index anchor. |
| Showcase | `/showcase` | Correct everywhere. |
| User Data | `/data` | Correct everywhere. |
| About Us | `/about-us` | Correct everywhere. |
| Donate | `/about-us#donate` | Correct everywhere. |
| Documentation | `docs.freemocap.org` | Header correct. Resources dropdown, Resources page, and footer still on `freemocap.github.io`. |
| Download | `/download` | Correct. |
| Any index section | `Home ▾` only | Anchors are currently scattered across the nav and footer. |

---

## Proposed nav

```
Home ▾         How does it work? · User Data (Highlights) · Our Mission ·
               Why Choose FreeMoCap? · This Is FreeMoCap ·
               Cheatsheet · Services · Join Our Community
Resources ▾    Documentation ↗ · Installation Guide ↗ · Source Code ↗ · Resources
Community ▾    Showcase · Discord ↗ · YouTube ↗ · Twitch ↗
About ▾        About Us · Donate
User Data
Shop ↗
[ Services | Download ]
```

`Home ▾` labels start from the existing `<h2>` heading of each index section.
Two diverge, both at Paul's direction. Section headings themselves are
unchanged.

| Menu label | Anchor | Section heading |
|---|---|---|
| How does it work? | `#how-it-works` | same |
| User Data (Highlights) | `#impact` | "User Data" |
| Our Mission | `#mission` | same |
| Why Choose FreeMoCap? | `#features` | same |
| This Is FreeMoCap | `#video` | same |
| Cheatsheet | `#cheatsheet` | "Download Our Cheatsheet" |
| Services | `#services` | same |
| Join Our Community | `#community` | same |

"User Data (Highlights)" distinguishes the index teaser from the top-level
`User Data` nav item, which goes to the full `/data` dashboard.

Structural changes:

- **`Home ▾` added** in the leftmost slot, where the plaintext Services link
  used to sit. It links to `/` on click and drops down to the index sections,
  matching the existing pattern where dropdown parents are also links.
- **Services leaves the About Us dropdown.** Services already holds the most
  prominent slot on every page as half the split CTA. The About Us entry was
  added because there was room in that menu, not because it belongs there.
- **Community dropdown parent stops pointing at an index anchor** and points at
  `/showcase`, which is where `/community` has always redirected. The dropdown
  itself becomes the channel directory, so no `/community` page is needed and
  the existing redirect rule stays untouched.
- **Cheatsheet moves out of the Resources dropdown into `Home ▾`,** because it
  is an index anchor and all anchors go in one place. The cheatsheet section
  itself does not move.
- **`freemocap.github.io` URLs updated** to `docs.freemocap.org` in the
  Resources dropdown, the Resources page, and the footer, so all four locations
  agree with the header.

---

## Index page

**No index section is added, removed, resized, reordered, or rewritten.**

The only index change is that its sections become reachable from `Home ▾`.
`#how-it-works` and `#features` currently have no nav entry at all.

---

## Footer

The footer currently mixes page links and index anchors and disagrees with the
nav about where Services and Community go. Structural fix: every footer link
points at a page, no anchors except Donate, which is a genuine deep link into
`/about-us`.

Columns mirror the top nav, and the column headings reuse the existing top-nav
labels verbatim, so no new copy is written:

```
Get Started        Resources          Community          About
Download           Documentation ↗    Showcase           About Us
Services           Installation ↗     Community          Donate
                   Source Code ↗      Shop ↗             User Data
                   Resources
```

Two details worth noting:

- **No Home column.** Anchors live in the nav only, so a footer Home column
  would either duplicate anchors or contain a single link to `/`. Neither is
  worth a column.
- **"Get Started" is the one new label.** The other three column headings reuse
  existing top-nav labels verbatim. Download and Services had no shared nav
  label to inherit, so Paul chose this one.

---

## Housekeeping

**Unlinked files** currently in the repo, referenced by nothing on the six live
pages:

```
about-us-button-template.html    announcements.html
announcements-template.html      community.html
compact-hero.html                data copy.html
default_page_template.html       footer.html
header.html                      news.html
```

`footer.html` and `header.html` at the dist root are stale duplicates of the
`includes/` versions the live pages actually load. `compact-hero.html` is still
fetched by `js/custom.js`, which only the non-live pages use.

Retiring these deletes no copy that appears anywhere on the live site, but
`community.html`, `news.html`, and `announcements.html` do contain written
content.

**Decision: safe to remove, but held until all other work is finished.** Moved
to the last phase.

**Redirect conflict:** `.htaccess` has `RewriteRule ^community/?$
/showcase.html`. Creating a real `/community` page requires removing that rule
first, or the new page is unreachable.

---

## Suggested phasing

**Phase 1: pure link and nav changes, no content implications**

1. Add `Home ▾` and move all anchor links into it
2. Remove Services from the About Us dropdown
3. Point the footer at pages instead of index anchors
4. Normalise the `freemocap.github.io` URLs to `docs.freemocap.org`
5. Align the Resources dropdown with the Resources page

Phase 2 is gone. It called for building a `/community` page, which the dropdown
now covers without one.

**Phase 2: blocked on v2 and the docs rewrite**

6. Build a local `/download` page, retire the 301
7. Revisit what `/resources` carries once the docs site is current

**Phase 3: last, once everything above is done**

8. Retire the unlinked files

---

## Content decisions

Resolved by Paul.

| Question | Decision |
|---|---|
| `Home ▾` item labels | Use the existing section headings verbatim. |
| Footer column headings | Add them, mirroring the top-nav structure. |
| Index `#services` section keeping its own button to `/services` | Stays as is. Placing it under the Home menu is expected to make the relationship clear. |
| Unlinked file retirement | Safe to remove, but hold until all other work is done. |

Both previously open items are now resolved:

| Question | Decision |
|---|---|
| `#video` had no heading to reuse as a menu label | Paul supplied "This Is FreeMoCap". Added to the section and the menu. |
| Fourth footer column heading | "Get Started". |

No open content questions remain for the phases above.

---

## Future development

Not scheduled. Recorded so the reasoning is not lost.

A real `/community` page is worth building once there is community content that
does not exist on the site yet. The dropdown handles channel links fine, but it
cannot hold any of the following:

- Code of conduct
- Contributor guidelines
- Events or office hours
- Contributors list

If that content gets written, the page earns its place and the channel links
become its top section rather than a menu. Two things to know when that happens:

- `.htaccess` redirects `/community` to `showcase.html`. That rule has to go
  first, or the new page is unreachable.
- `community.html` already exists in `dist` as an orphan. It is an old version
  of the Showcase page, `<h1>` reads "Community Showcase". It has to be dealt
  with before that filename can be reused.

