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

**Do not suggest, recommend, propose, or float copy changes either.** Not in
chat, not in planning documents, not as an "option". Do not suggest shrinking a
section, cutting a section, condensing anything, turning a section into a
teaser, or moving text from one page to another. If a plan seems to call for it,
the plan is wrong, not the copy.

Architecture work is done with links, nav structure, redirects, and new pages.
Content volume is never an architectural conclusion. It is Paul's decision and
his alone, and he will raise it if he wants it.

If a structural task genuinely cannot proceed without a copy decision, state the
blocker in one line as an open question with **no recommendation attached**, and
wait.

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
