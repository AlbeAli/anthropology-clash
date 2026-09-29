# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences with equal weight (confirmed by the author, 2026-09-27):

- **Curious newcomer on a phone**: a few free minutes, plays one scenario at the `neofita` level and leaves.
- **University student of anthropology**: uses the `studente` level to review concepts, theory and sources, also on desktop.
- **Teacher in class**: projects a scenario, the class discusses the choices together; text must read at a distance.

Graduates returning to a topic use the concept library to open any scenario directly, not only in sequence.

## Product Purpose

Teach anthropological concepts through branching scenarios drawn from real ethnographic cases. Each scenario opens on a situation from today's life (`hook`, labelled «Oggi»), moves to the ethnographic setup, asks the player to choose, then shows what each choice leads to in that cultural context, the unchosen ones included, with the source.

Success: the player understands a concept by living a dilemma, not by reading a definition; completes a first scenario and comes back.

## Positioning

Every scenario rests on a real, verified ethnographic source (author, year, page where checked on the text), and no choice is ever "wrong": feedback describes consequences in context, never a verdict. Neighbouring products either quiz for right answers (textbook quizzes), guess identities from appearance, or publish articles without play.

## Operating Context

- Italian UI, content in `src/content/it/`; English prepared but not translated.
- 21 scenarios, 5 concepts (reciprocità, parentela, rituale, relativismo, consumo), 4 per concept and 5 for consumo; two levels per scenario (`neofita` 2 choices, `studente` 3-4 choices plus `deepen` readings).
- Views: Home, Scenario (`/s/:id`), Concept library (`/concetti`), Method and sources with generated bibliography (`/metodo`).
- Progress, level, theme and streak live in `localStorage`; from M10 an optional account (Supabase, EU) syncs progress across devices.
- Live at https://anthropology-clash.vercel.app

## Capabilities and Constraints

- Stack fixed: TypeScript, Vite 6, React 19, Tailwind CSS 4, React Router 7, Zod, i18next. No state libraries. Backend limited to Supabase (Auth, Postgres with RLS, Edge Functions) from M10; no own servers.
- No visible strings in components: everything through `src/locales/it.json`.
- Account optional, never required to play. Minimal personal data: only the sign-in identifier (email for magic link and Google, Telegram id without phone) and progress; account deletion from the profile. No passwords, no tracking cookies; analytics only Umami.
- `localStorage` always in try/catch; the app works without persistence.
- Vocabulary ban in copy, UI and code: no `correct`, `wrong`, `score`, and no colour that implies a verdict on a choice.
- Feedback on all options after the choice; source always reachable.
- Undecided: product name (Anthropology Clash is provisional), domain, monetisation.

## Brand Commitments

- Author: Alberto Alioto (AlbeAli), named in the footer.
- Name is provisional. No visual element (palette, fonts, layout) is binding for the redesign: the author released the current look on 2026-09-27.
- Content rules above are binding.

## Evidence on Hand

- 20 validated scenarios in `src/content/it/scenarios/`, concept definitions in `src/content/it/concepts.json`, 71-entry bibliography generated from content.
- No imagery, photographs, illustrations or testimonials exist. Ethnographic photographs are not to be sourced without rights and context; nothing may be invented as factual.

## Product Principles

1. Consequence, not verdict: the interface never grades the player.
2. Source always within reach: every claim can be traced to author and year.
3. From today to the field: the contemporary hook opens, the ethnography carries the proof.
4. One scenario is a complete experience in a few minutes on a phone, and still reads when projected.
5. Nothing personal leaves the browser.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, visible focus, keyboard navigation, reduced motion respected, readable at 360px and when projected.
