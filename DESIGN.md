# Design

## Source of truth

Status: Active. Updated: 2026-09-15. Surfaces: the existing AI Edu Day GitHub Pages home, workshop entry pages, Reading List and reading shells. Evidence reviewed: live root page, root HTML/README, GAS README and 60-minute handout, 36-slide GAS presentation, 20-slide **Oh-my-claude-code 사용기** presentation and PDF, existing reader HTML/CSS, original image manifests and passing regression tests. User references reviewed in Chrome: https://shedsgns.me/taste and https://emilkowal.ski/ui/developing-taste. Emil supplies the narrow, text-first reading model; Shed supplies spacing restraint, not its repeating decorative animation. No separate brand manual is available.

## Brand

An approachable, composed education team's working library. Quiet editorial styling: warm off-white paper, charcoal text, restrained sage links and lightly outlined material lists. The page should feel like a useful reading room rather than a promotional landing page. Trust comes from real materials, original source images and clear source/type labels. Avoid saturated orange/forest-green blocks, oversized heavy headings, tilted decorations, invented testimonials, exaggerated outcome claims and fake UI affordances.

## Product goals

Make the existing public website beautiful and usable, not a separate microsite. Visitors should understand the available material and choose a workshop or reading resource immediately. Keep the canonical Reading List under `reading-list/` and preserve all existing content URLs. Success: immediately visible static material rows, consistent two-link header, real resource actions, vertical-only page flow, preserved source bytes and passing regression/browser checks. Search/filter/count/read-status UI on catalogs is intentionally removed by the latest user design, not preserved as an invariant. Non-goals: accounts, a CMS, paid services, replacing original slide decks or creating a new hosting stack.

## Personas and jobs

Education team members and learners on laptops or phones. They need to start a guided exercise, revisit slides, download an existing PDF, or read a paper/article in Korean. Beginners need context before being dropped into a slide deck; returning learners need direct links to materials.

## Information architecture

- `/`: only a header with `Upstage Education` (home link) and `GitHub`, followed immediately by the four material rows. No introduction, promotional copy, visible page heading, toolbar, search, filters, result count, reading status, duplicate menu or footer. Keep a visually hidden h1 and skip link for accessibility.
- `/gas-tutorial/`: workshop orientation, start-slide action, four exercise stages and actual available prompt/code/handout links.
- `/omc-intro/`: original OMC presentation context, start-slide action, the four content themes and original PDF link. Use the actual source title (Claude Code), not Codex.
- `/reading-list/`: preserve the existing URL as a reading-only view of the same material rows and two-link header, without extra controls or introduction. Individual article URLs remain reachable directly from the home catalog.
- `/reading-list/externalization-llm-agents/`: orientation and the existing beginner/deep reading documents.
- `/reading-list/forward-deployed-engineer/`: complete Korean translation of the user-supplied article: 57 body paragraphs, subtitle, 8 section headings, captions and final author bio; the supplied date is 2026-09-13. Original images precede P01 and follow P12 and P28, with no added discussion questions or editorial notes.
- Existing legacy externalization entry/deep-document URLs redirect with query/fragment preservation; old figure URLs remain byte-identical compatibility copies.

## Design principles

Give people a clear next action. Explain content with human titles rather than repository paths. Keep the navigation consistent while letting original articles retain their content. Static content first; enhancement must not blank the page or depend on an API. Favor a small, durable shared stylesheet over a framework.

## Visual language

Paper `#fdfdfc`, ink `#292a27`, muted `#666963`, accent `#465a50`, borders `#e3e5df`, subtle interactive surface `#f2f3ef`. Retain existing `--green` / `--rust` token names for reader compatibility, with the secondary color neutral rather than orange. Tokens belong to `reading-list/assets/reading-list.css`; portal/workshop components belong to `assets/site.css`. Use the existing system font stack without external font loading. Catalog headings 14px / 550 weight, metadata 11px, summaries 12px, article body 18px. Catalog/header width 1080px including gutters, with enough width to read each row left to right. Each row contains category, format, title and one-sentence summary in that DOM order; the action sits at the right in the same compact desktop strip; small screens wrap the action below the text. At narrow widths metadata stays left-to-right, then title and summary wrap to full-width lines without truncation or horizontal scrolling. Detail pages use one content column with contents/preparation information in normal document flow, not sticky or independently scrolling side panels. Material rows are compact document sheets that file into a drawer: each later sheet sits in plain DOM order in front of the one above it, and every sheet shares one constant z-index, so hover or focus never changes stacking order and nothing pops between sheets. Every sheet tucks a 16px empty bottom margin (`--sheet-tuck`) behind the next sheet, at every width. Text never sits in that tucked margin: a 9px top/bottom padding (`--sheet-pad`) keeps at least 9px of clearance even when a row wraps to two lines. A one-line desktop sheet is about 56px tall with a 40px visible strip; at 761px and wider the 40px (fine pointer) / 44px (coarse pointer) action target spills into that padding instead of setting the row height. Below 761px, rows use block layout — labels, then wrapping title and summary, then the action below — with the same 16px tuck. A pseudo-element owns each sheet's translucent gradient frame and shadow; the outer `.learning-card` box and the real `.text-link` anchor never move, so hit areas stay fixed. Only the paper (`::before`), text (`.card-content`) and the non-interactive `.action-label` travel on hover; the raised label has no pointer events, so it cannot steal clicks. Two non-interactive paper-edge layers behind the list suggest a document stack without extra markup. Touch and coarse pointers keep the same stacked look with no motion; the desktop tuck does not override mobile readability. Preserve original article figures/photos, uncropped and unfiltered.

Motion is gated to `(hover:hover) and (pointer:fine)`, and only one input moves the drawer at a time: hovering a sheet, or giving its link `:focus-visible` while the pointer is outside the list, rises the sheet's paper, text and action label 8px over 280ms on a `cubic-bezier(.22,1,.36,1)` ease with a faint cast shadow; sheets in front of it lean 4px down a beat later on a slower 460ms `cubic-bezier(.4,0,.2,1)` ease. Leaving reverses both over that same 460ms ease, so rising fast and settling slow makes a sweep across the list read as one continuous wave. Motion uses the CSS `translate` property only; no scale, tilt, spring, keyframe animation, cursor tracking or JavaScript. Links and buttons keep their own 150ms color feedback, unaffected by this gate. The catalog focus ring is drawn around the travelling action label, not the stationary link box, so it stays whole while keyboard focus drives the drawer; hovering the next sheet may briefly cover its lower edge. Hover and focus rules stay in separate selector lists so browsers without `:has()` keep the hover lift. Reduced motion removes all translate and transitions (a static hover shadow may remain as non-motion feedback) while keeping focus outlines and usable links.

## Components

Shared two-link header, skip link, visually hidden catalog heading, uniform four-field document sheet and right-aligned action. Workshop action buttons, breadcrumbs and essential exercise links remain. Reader: static article title, byline/source attribution, body text and original inline figures. Do not render progress, font-size controls, completion state, breadcrumbs, outer or embedded contents navigation, or a “next reading” footer. Footer and catalogue-only controls are removed, not merely hidden. All actions are real links/buttons; no placeholder controls.

## Accessibility

Target WCAG AA: semantic landmarks, one primary heading, meaningful link names, explicit input labels, visible focus and keyboard-operable controls. Skip links move focus into main. Maintain at least 4.5:1 contrast for normal UI text despite the softer palette. Resource actions retain visible keyboard focus and meaningful accessible names. Catalog titles are plain headings rather than a second duplicate link; repeated action text includes the material title in its accessible name. No motion required to understand content; respect reduced motion. Mobile target controls at least 44px where practical. Do not lock scroll, force scroll positions, capture arrow keys or suppress normal keyboard/link navigation. Vertical flow describes layout, not an input restriction.

## Responsive behavior

Desktop: compact document strips tuck 16px behind each other at every width; fields read left-to-right with the action at the right. Hovering or focusing a sheet lifts only its paper, text and label — stacking order never changes and no neighboring row's hit area moves. Tablet/phone: allow natural field wrapping rather than sideways scrolling, with the same DOM order. The two header links stay on a single row; no hamburger or extra navigation. Detail pages remain a single vertical reading flow. Check at 1440, 768, 390 and 320 CSS pixels. Original wide tables and code wrap within the reader; avoid horizontal page or nested-panel scrolling. Images retain aspect ratio.

## Interaction states

All static rows and links work with JavaScript disabled. GitHub discovery may append unknown root-level collections/PPTX in the same row format but never replaces static resources. No search or filter controls, counts or read-state labels are rendered on catalogs. API errors/timeouts leave known content usable. Article pages have no reader settings, progress meter, completion state, contents navigation or browser-storage dependency.

## Content voice

Korean-first, direct, welcoming and specific. English for familiar technical names and understated visual labels. State real formats and grounded durations: GAS handout says 60 minutes; OMC has 20 slides. No invented completion promises. Distinguish original content from summaries. Do not add discussion questions or editorial filler to the FDE page. Follow better-writing for newly written Korean; do not rewrite preserved source articles.

## Implementation constraints

Static HTML/CSS/JavaScript; no new dependencies, font CDN, tracking, framework or hosting migration. Relative internal paths must work locally and under `/eduteam-ai-edu-day/`. Preserve user untracked files and original slide/article/image/PDF bytes. Existing regression tests lock source content. Before delivery run Node tests, JS syntax, internal-link/fragment checks, Korean copy checks and Chrome desktop/mobile/no-JS/offline/keyboard checks; inspect screenshots. Publish only to the existing main/root GitHub Pages configuration after user approval and passing verification; check previous deployment before a single push.

### Drawer-skim refinement

1. The 16px-lift version raised the hovered sheet to the top stacking order, so it visually covered the title of the sheet above it, then snapped back behind it the instant the pointer left — a hard pop the user asked to remove.
2. Replaced raised stacking with plain DOM order and one constant z-index per sheet, so hover never reorders sheets; only the sheet's paper, text and non-interactive label translate.
3. Hover now rises 8px over 280ms and settles back — with the following sheet's 4px lean — over 460ms, so a sweep across the list reads as one smooth wave instead of a jump-and-drop.
4. Verified: a real-pointer sweep sampled at 60fps shows 0 stacking-order changes, paper and text moving in sync on every frame, and a max of about 3px movement per frame; clearance stays at least 9px at 1440/1280/1024/768/761/760/390/320 with no horizontal overflow.
5. Release only after user approval: bump the stylesheet cache version in the entry shells, push once after the previous Pages build finishes, then verify the production files and browser behavior.

## Open questions

No blocking questions. This is a refinement of the already-authorized GitHub Pages implementation/deployment. The latest user request — one simple drawer-skim UI with a smoother hover — supersedes the earlier 16px lift and raised z-index. Original learning resources and minimal navigation remain unchanged.
