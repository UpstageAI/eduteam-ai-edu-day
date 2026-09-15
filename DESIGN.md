# Design

## Source of truth

Status: Active. Updated: 2026-09-15. Surfaces: the existing AI Edu Day GitHub Pages home, workshop entry pages, Reading List and reading shells. Evidence reviewed: live root page, root HTML/README, GAS README and 60-minute handout, 36-slide GAS presentation, 20-slide **Oh-my-claude-code 사용기** presentation and PDF, existing reader HTML/CSS, original image manifests and passing regression tests. User references reviewed in Chrome: https://shedsgns.me/taste and https://emilkowal.ski/ui/developing-taste. Emil supplies the narrow, text-first reading model; Shed supplies spacing restraint, not its repeating decorative animation. No separate brand manual is available.

## Brand

An approachable, composed education team's working library. Quiet editorial styling: warm off-white paper, charcoal text, restrained sage links and unboxed material lists. The page should feel like a useful reading room rather than a promotional landing page. Trust comes from real materials, original source images and clear source/type labels. Avoid saturated orange/forest-green blocks, oversized heavy headings, tilted decorations, invented testimonials, exaggerated outcome claims and fake UI affordances.

## Product goals

Make the existing public website beautiful and usable, not a separate microsite. Visitors should understand the available material and choose a workshop or reading resource immediately. Keep the canonical Reading List under `reading-list/` and preserve all existing content URLs. Success: visible static catalog, working filters/search and primary actions, cohesive navigation and responsive reading, preserved source bytes and successful regression/browser checks. Non-goals: accounts, a CMS, paid services, replacing original slide decks or creating a new hosting stack.

## Personas and jobs

Education team members and learners on laptops or phones. They need to start a guided exercise, revisit slides, download an existing PDF, or read a paper/article in Korean. Beginners need context before being dropped into a slide deck; returning learners need direct links to materials.

## Information architecture

- `/`: small brand/navigation, short text-only introduction, searchable single-column list with four curated resources and a simple footer. No hero artwork, thumbnails, promotional banners or learning-process filler.
- `/gas-tutorial/`: workshop orientation, start-slide action, four exercise stages and actual available prompt/code/handout links.
- `/omc-intro/`: original OMC presentation context, start-slide action, the four content themes and original PDF link. Use the actual source title (Claude Code), not Codex.
- `/reading-list/`: collection and reading filters; consistent brand header and color tokens.
- `/reading-list/externalization-llm-agents/`: orientation and the existing beginner/deep reading documents.
- `/reading-list/forward-deployed-engineer/`: complete Korean translation of the user-supplied article: 57 body paragraphs, subtitle, 8 section headings, captions and final author bio; the supplied date is 2026-09-13. Original images precede P01 and follow P12 and P28, with no added discussion questions or editorial notes.
- Existing legacy externalization entry/deep-document URLs redirect with query/fragment preservation; old figure URLs remain byte-identical compatibility copies.

## Design principles

Give people a clear next action. Explain content with human titles rather than repository paths. Keep the navigation consistent while letting original articles retain their content. Static content first; enhancement must not blank the page or depend on an API. Favor a small, durable shared stylesheet over a framework.

## Visual language

Paper `#fdfdfc`, ink `#292a27`, muted `#666963`, accent `#465a50`, borders `#e3e5df`, subtle interactive surface `#f2f3ef`. Retain existing `--green` / `--rust` token names for reader compatibility, with the secondary color neutral rather than orange. Tokens belong to `reading-list/assets/reading-list.css`; portal/workshop components belong to `assets/site.css`. Use the existing system font stack without external font loading. Home heading 32px / 550 weight, list headings 19px / 550 weight, UI descriptions 15–16px, article body 18px with comfortable line height. Home/collection outer width 840px including gutters; reader/workshop layouts may reach 1080px for a useful contents/sidebar column. Generous vertical space and fine rules separate sections; avoid nested boxes, shadows and decorative illustrations. Preserve original article figures/photos, uncropped and unfiltered.

Motion is feedback, not decoration: 150ms ease-out color/background/border/underline transitions only on interactive controls and links. No entry reveals, perpetual animation, transforms, scroll-driven effects or forced smooth scrolling. Filter results appear immediately. Reduced-motion preferences remove transitions.

## Components

Shared brand header and navigation, skip link, primary/secondary/text buttons, text introduction, catalog toolbar, unboxed resource row (workshop/reading/discovered download variants), breadcrumbs, workshop overview, lesson/resource rows and footer. Existing reader: sidebar contents, reading progress, font-size controls, completion toggle, inline original image figures. All actions are real links/buttons; no placeholder controls.

## Accessibility

Target WCAG AA: semantic landmarks, one primary heading, meaningful link names, explicit input labels, visible focus and keyboard-operable controls. Skip links move focus into main. Maintain at least 4.5:1 contrast for normal UI text despite the softer palette. Selected filters use weight and an underline as well as a tinted background; focus rings stay distinct. No motion required to understand content; respect reduced motion. Mobile target controls at least 44px where practical. Announce filter counts politely without making the full card grid a live region.

## Responsive behavior

Desktop: a narrow, single-column catalog with generous negative space; structured sidebars remain useful on workshop and long article pages. Tablet: tighter gutters and reflowing sidebars. Phone: the same single-column reading order, wrapping navigation without a hidden hamburger, stacked controls and collapsed optional contents. Check at 1440, 768, 390 and 320 CSS pixels. Original wide tables scroll within their reader, never overflow the viewport. Images retain aspect ratio.

## Interaction states

Static catalog and links work with JavaScript disabled. Search/category/reset have visible counts and an empty state. GitHub discovery adds only unknown root-level collections/PPTX, never replaces designed static cards. API errors/timeouts leave known content usable; optional feedback is non-blocking. Reading settings degrade safely when storage is blocked. Completion is reversible and scoped to this browser, not a cloud account.

## Content voice

Korean-first, direct, welcoming and specific. English for familiar technical names and understated visual labels. State real formats and grounded durations: GAS handout says 60 minutes; OMC has 20 slides. No invented completion promises. Distinguish original content from summaries. Do not add discussion questions or editorial filler to the FDE page. Follow better-writing for newly written Korean; do not rewrite preserved source articles.

## Implementation constraints

Static HTML/CSS/JavaScript; no new dependencies, font CDN, tracking, framework or hosting migration. Relative internal paths must work locally and under `/eduteam-ai-edu-day/`. Preserve user untracked files and original slide/article/image/PDF bytes. Existing regression tests lock source content. Before delivery run Node tests, JS syntax, internal-link/fragment checks, Korean copy checks and Chrome desktop/mobile/no-JS/storage/offline/keyboard checks; inspect screenshots. Publish only to the existing main/root GitHub Pages configuration after user approval and passing verification; check previous deployment before a single push.

### Editorial implementation and release plan (2026-09-15)

1. Preserve behavior with the existing 36 passing Node tests and original source checksum fixtures. Keep the earlier local-change patch and screenshot baselines under `.omx/artifacts/`.
2. Remove home decorative sections and catalog artwork; reduce both catalogs to a single typographic list. Replace obsolete portal decoration CSS instead of adding an override theme. Unify shared color, type and interaction tokens; keep routes, source material and JavaScript behavior.
3. Update only obsolete visual test contracts, retaining search/filter/reset, keyboard, offline/no-JS, source-image, reading-settings and redirect assertions. Verify contrast, motion limits, single-column layout and 1440/768/390/320px screenshots. Review the diff independently before release.
4. Commit explicit intended paths only, push once to existing `main` / root GitHub Pages configuration after checking the previous build, wait for the deployment commit to be built, and verify actual production HTML/CSS and navigation in Chrome.

## Open questions

No blocking questions. The user approved this reference-led implementation and GitHub Pages publication in the current conversation on 2026-09-15.
