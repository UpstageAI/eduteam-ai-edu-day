# Design

## Source of truth

Status: Active. Updated: 2026-09-15. Surfaces: the existing AI Edu Day GitHub Pages home, workshop entry pages, Reading List and reading shells. Evidence reviewed: live root page, root HTML/README, GAS README and 60-minute handout, 36-slide GAS presentation, 20-slide **Oh-my-claude-code 사용기** presentation and PDF, existing reader HTML/CSS, original image manifests and passing regression tests. No separate brand manual or user-provided visual reference is available.

## Brand

An approachable, confident education team's working library. Editorial rather than corporate-dashboard styling: warm paper, deep forest green, expressive type and a restrained orange accent. Trust comes from real materials, original source images and clear source/type labels. Avoid invented testimonials, activity counts, exaggerated outcome claims, generic gradient hero blobs and fake UI affordances.

## Product goals

Make the existing public website beautiful and usable, not a separate microsite. Visitors should understand the available material and choose a workshop or reading resource immediately. Keep the canonical Reading List under `reading-list/` and preserve all existing content URLs. Success: visible static catalog, working filters/search and primary actions, cohesive navigation and responsive reading, preserved source bytes and successful regression/browser checks. Non-goals: accounts, a CMS, paid services, replacing original slide decks or creating a new hosting stack.

## Personas and jobs

Education team members and learners on laptops or phones. They need to start a guided exercise, revisit slides, download an existing PDF, or read a paper/article in Korean. Beginners need context before being dropped into a slide deck; returning learners need direct links to materials.

## Information architecture

- `/`: brand/navigation, editorial learning hero, searchable catalog with four curated resources, a Reading List collection callout, a concise learning-process section and footer.
- `/gas-tutorial/`: workshop orientation, start-slide action, four exercise stages and actual available prompt/code/handout links.
- `/omc-intro/`: original OMC presentation context, start-slide action, the four content themes and original PDF link. Use the actual source title (Claude Code), not Codex.
- `/reading-list/`: collection and reading filters; consistent brand header and color tokens.
- `/reading-list/externalization-llm-agents/`: orientation and the existing beginner/deep reading documents.
- `/reading-list/forward-deployed-engineer/`: attributed Korean summary (not a full translation), original images and editorial questions.
- Existing legacy externalization entry/deep-document URLs redirect with query/fragment preservation; old figure URLs remain byte-identical compatibility copies.

## Design principles

Give people a clear next action. Explain content with human titles rather than repository paths. Keep the navigation consistent while letting original articles retain their content. Static content first; enhancement must not blank the page or depend on an API. Favor a small, durable shared stylesheet over a framework.

## Visual language

Paper `#f7f6f2`, ink `#232b28`, forest `#245c46`, muted `#606b65`, orange `#a54d2e`. Existing reader variables remain authoritative; the new `assets/site.css` consumes them and owns portal/workshop components. System font stack includes Apple SD Gothic Neo/Malgun Gothic. Large tightly tracked hero headings, comfortable 18px reading text, small uppercase English editorial labels. Max width 1200px, 20–36px mobile/desktop gutters, 8px spacing increments, thin borders, mostly 12–18px corner radii. Subtle hover elevation; no required scroll animations or autoplay. Decorative workbook/terminal illustrations are code-native. Source figures/photos are always original local files, uncropped, with attribution in the reading pages.

## Components

Shared brand header and navigation, skip link, primary/secondary/text buttons, learning hero, catalog toolbar, learning card (workshop/reading/discovered download variants), collection callout, process steps, breadcrumbs, workshop overview, lesson/resource rows and footer. Existing reader: sidebar contents, reading progress, font-size controls, completion toggle, original image figure and expandable gallery. All actions are real links/buttons; no placeholder controls.

## Accessibility

Target WCAG AA: semantic landmarks, one primary heading, meaningful link names, explicit input labels, visible focus and keyboard-operable controls. Skip links move focus into main. Use adequate contrast and descriptive source-image alt text. No motion required to understand content; respect reduced motion. Mobile target controls at least 44px where practical. Announce filter counts politely without making the full card grid a live region.

## Responsive behavior

Desktop: split hero, generous negative space, two-column catalog, structured workshop sidebars. Tablet: tighter gutters and reflowed hero. Phone: one-column catalog, wrapping navigation without a hidden hamburger, stacked calls to action and collapsed optional contents. Check at 1440, 768, 390 and 320 CSS pixels. Original wide tables scroll within their reader, never overflow the viewport. Images retain aspect ratio.

## Interaction states

Static catalog and links work with JavaScript disabled. Search/category/reset have visible counts and an empty state. GitHub discovery adds only unknown root-level collections/PPTX, never replaces designed static cards. API errors/timeouts leave known content usable; optional feedback is non-blocking. Reading settings degrade safely when storage is blocked. Completion is reversible and scoped to this browser, not a cloud account.

## Content voice

Korean-first, direct, welcoming and specific. English for familiar technical names and understated visual labels. State real formats and grounded durations: GAS handout says 60 minutes; OMC has 20 slides. No invented completion promises. Distinguish original content, summaries and editorial questions. Follow better-writing for newly written Korean; do not rewrite preserved source articles.

## Implementation constraints

Static HTML/CSS/JavaScript; no new dependencies, font CDN, tracking, framework or hosting migration. Relative internal paths must work locally and under `/eduteam-ai-edu-day/`. Preserve user untracked files and original slide/article/image/PDF bytes. Existing regression tests lock source content. Before delivery run Node tests, JS syntax, internal-link/fragment checks, Korean copy checks and Chrome desktop/mobile/no-JS/storage/offline/keyboard checks; inspect screenshots. Publish only to the existing main/root GitHub Pages configuration after user approval and passing verification; check previous deployment before a single push.

## Open questions

No blocking questions. User approved publishing the verified redesign to the existing GitHub Pages site on 2026-09-15.
