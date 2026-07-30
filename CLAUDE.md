# Working rules for this repo

## RULE 1: NEVER CHANGE COPY. NO EXCEPTIONS.

**Do not write, rewrite, edit, shorten, lengthen, reword, "improve", or
otherwise touch any user-facing text anywhere in this repo.**

This includes but is not limited to:

- The Mission text on the index
- The Services copy on the index and on `services.html`
- Headings, subheadings, section titles
- Body paragraphs, descriptions, taglines
- Button labels, link text, nav labels
- Alt text, titles, meta descriptions

The only way copy changes is if Paul explicitly asks for a copy change **and
provides the specific text to use**. Not a direction, not a vibe, not "make it
punchier". The literal words.

If a structural task appears to require moving or cutting copy, **stop and ask
first**. Do not proceed on the assumption that moving text is not the same as
changing it.

This applies to `SITE-ARCHITECTURE.md` as well. That document proposes moving
the Mission text to `/about-us` and shrinking several index sections. Those are
proposals only. None of them happen without explicit instruction.

## RULE 2: Never run destructive git commands.

Never run `git checkout --`, `git restore`, `git reset --hard`, `git clean`, or
`git stash`. Paul edits the same working tree in VS Code simultaneously.

Stage only files edited in this session, by explicit path. If `git status` shows
a change that was not made in this session, report it and leave it alone.

## RULE 3: Deploy is out of scope.

Do not mention, ask about, or comment on deployment. Paul handles pushes to
production. Commit to a branch and stop there.

## RULE 4: No em-dashes.

Not in code, not in comments, not in commit messages, not in documents, not in
chat. Use periods, commas, colons, and parentheses.

## Context

- Site lives in `httpdocs/dist/`. Flat HTML, no build step.
- Six live pages share `includes/header.html` and `includes/footer.html`, loaded
  by `js/nav.js`: index, services, showcase, resources, about-us, data.
- Styles are in `css/mainv2.css`. The SCSS in `scss/` is stale, nothing compiles
  it.
- CTA button system: `.cta-button` (nav size), plus `.cta-button-lg` and
  `.cta-button-xl` modifiers. `.cta-button-lg` must stay after `.cta-button` in
  the stylesheet, equal specificity, source order decides.
