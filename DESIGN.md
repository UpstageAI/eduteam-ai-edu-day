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

Paper `#fdfdfc`, ink `#292a27`, muted `#666963`, accent `#465a50`, borders `#e3e5df`, subtle interactive surface `#f2f3ef`. Retain existing `--green` / `--rust` token names for reader compatibility, with the secondary color neutral rather than orange. Tokens belong to `reading-list/assets/reading-list.css`; portal/workshop components belong to `assets/site.css`. Use the existing system font stack without external font loading. Catalog headings 14px / 550 weight, metadata 11px, summaries 12px, article body 18px. Catalog/header width 1080px including gutters, with enough width to read each row left to right. Each row contains category, format, title and one-sentence summary in that DOM order; the action sits at the right in the same compact desktop strip; small screens wrap the action below the text. At narrow widths metadata stays left-to-right, then title and summary wrap to full-width lines without truncation or horizontal scrolling. Detail pages use one content column with contents/preparation information in normal document flow, not sticky or independently scrolling side panels. Material rows are compact document sheets: about 52px at 1440px (previously about 94px), with 12px overlap between neighboring folder edges on wide screens (4px on narrower desktop layouts). Metadata, title, summary and a 44px action remain readable; text wraps rather than truncates when needed. A pseudo-element owns each sheet’s 1px #5b5fe9 translucent gradient frame and shadow; the outer `.learning-card` stays stationary as a stable hit area. Two non-interactive paper-edge layers behind the list suggest a document stack without extra markup. On fine-pointer hover or keyboard focus, the sheet surface and its contents lift 16px over 200ms and receive a higher stacking order; the raised state persists while hovered/focused and returns smoothly on exit. No scale, tilt, spring, perpetual animation or cursor tracking. Touch/narrow screens keep all content and actions visible with natural wrapping and no overlap that obscures targets; the desktop half-height goal does not override mobile readability. Preserve original article figures/photos, uncropped and unfiltered.

Motion follows the latest explicit user request: retain 150ms color feedback on links/buttons and allow 200ms transform/shadow transitions only for material-sheet lift on fine pointers. No entrance reveal, scroll-driven effect, autoplay or loop. Reduced motion removes sheet movement, transitions and elevated shadows while keeping focus outlines and usable links.

## Components

Shared two-link header, skip link, visually hidden catalog heading, uniform four-field document sheet and right-aligned action. Workshop action buttons, breadcrumbs and essential exercise links remain. Reader: collapsed-by-default, in-flow contents, reading progress, font-size controls, completion toggle and original inline image figures. Footer and catalogue-only controls are removed, not merely hidden. All actions are real links/buttons; no placeholder controls.

## Accessibility

Target WCAG AA: semantic landmarks, one primary heading, meaningful link names, explicit input labels, visible focus and keyboard-operable controls. Skip links move focus into main. Maintain at least 4.5:1 contrast for normal UI text despite the softer palette. Resource actions retain visible keyboard focus and meaningful accessible names. Catalog titles are plain headings rather than a second duplicate link; repeated action text includes the material title in its accessible name. No motion required to understand content; respect reduced motion. Mobile target controls at least 44px where practical. Do not lock scroll, force scroll positions, capture arrow keys or suppress normal keyboard/link navigation. Vertical flow describes layout, not an input restriction.

## Responsive behavior

Desktop: compact document strips stack with 12px folder-edge overlap; fields read left-to-right with the action at the right. Only the hovered/focused sheet lifts, without moving neighboring row hit areas. Tablet/phone: allow natural field wrapping rather than sideways scrolling, with the same DOM order. The two header links stay on a single row; no hamburger or extra navigation. Detail pages remain a single vertical reading flow. Check at 1440, 768, 390 and 320 CSS pixels. Original wide tables and code wrap within the reader; avoid horizontal page or nested-panel scrolling. Images retain aspect ratio.

## Interaction states

All static rows and links work with JavaScript disabled. GitHub discovery may append unknown root-level collections/PPTX in the same row format but never replaces static resources. No search or filter controls, counts or read-state labels are rendered on catalogs. API errors/timeouts leave known content usable. Reading settings degrade safely when storage is blocked. Completion is reversible and scoped to this browser, not a cloud account.

## Content voice

Korean-first, direct, welcoming and specific. English for familiar technical names and understated visual labels. State real formats and grounded durations: GAS handout says 60 minutes; OMC has 20 slides. No invented completion promises. Distinguish original content from summaries. Do not add discussion questions or editorial filler to the FDE page. Follow better-writing for newly written Korean; do not rewrite preserved source articles.

## Implementation constraints

Static HTML/CSS/JavaScript; no new dependencies, font CDN, tracking, framework or hosting migration. Relative internal paths must work locally and under `/eduteam-ai-edu-day/`. Preserve user untracked files and original slide/article/image/PDF bytes. Existing regression tests lock source content. Before delivery run Node tests, JS syntax, internal-link/fragment checks, Korean copy checks and Chrome desktop/mobile/no-JS/storage/offline/keyboard checks; inspect screenshots. Publish only to the existing main/root GitHub Pages configuration after user approval and passing verification; check previous deployment before a single push.

### Drawer-depth refinement plan

Keep the 52px stationary hit areas and all content. Increase wide-screen overlap from 4px to 12px and hover/focus lift from 6px to 16px, with a slightly deeper shadow and rear paper edges. Verify a real pointer can scan every row in both directions, including the action column, without being trapped by the raised sheet; retain touch and reduced-motion fallbacks.

### Document-stack refinement and release plan

1. Preserve the existing behavior/source baseline and record the roughly 94px desktop row height.
2. Use shared CSS to make resting desktop sheets about half-height, show a subtle stack of paper edges and lift only the hovered/focused sheet’s visual surface. Preserve stable hit boxes, exact content, links and dynamic discovery; no new JavaScript or dependencies.
3. Replace only obsolete no-movement/CTA-below assertions. Verify hover pass/linger/exit, raised stacking order, stable neighbors, keyboard focus, coarse-pointer/reduced-motion fallbacks, 320–1440px layouts and source checksums. Inspect screenshots before release.
4. Update only the stylesheet version in entry shells, push once after the previous Pages build finishes, wait for the expected commit, and verify actual production files and browser behavior.

## Open questions

No blocking questions. This is a refinement of the already-authorized GitHub Pages implementation/deployment. The latest user request explicitly permits hover lift and document stacking; it supersedes the earlier blanket no-transform rule. Original learning resources and minimal navigation remain unchanged.
