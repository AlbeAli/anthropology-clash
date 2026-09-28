---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/pages/Scenario.tsx", "src/pages/ConceptLibrary.tsx", "src/pages/Method.tsx"]
---

## Scope

Whole app redesign (Home, Scenario, Concept library, Method, new "Il tuo viaggio" summary). Visitor mode: Experience for Home and Scenario, Read for Method. Audience, product truth and constraints live in PRODUCT.md.

## Direction contract

THESIS: The app is a transit network: each concept is a line, each scenario a stop, the trip goes from "Oggi" to the field. Refuses the category default of a card grid with progress bars and scores.

OWN-WORLD: White ground, near-black ink #1A1A1A, five solid line colours (Dono #E2231A, Parentela #0065B3, Rituale #008C44, Relativismo #F7A600 with dark ink, Consumo #7B3F98), letter bullets in rounded squares, stop dots with thick ink ring (filled = visited, line colour + ping = you are here), black station signs with a line-colour bar, split-flap departure board. Archivo 800 for signage, Atkinson Hyperlegible for reading.

STORY: The visitor sees where they are on the map, reads the contemporary hook, rides into the ethnographic setup, picks an exit, sees where every exit leads with its source, then gets the next stop. Progress is stops visited, never a score.

FIRST VIEWPORT: Home: headline "Cinque linee, venti fermate.", then a split-flap departure board (next stop, line bullet, "Parti") beside a progress panel (stops visited, per-line segment bars that isolate a line); the five-line map below. Scenario: line strip with moving train, black station sign with title, level switch, vertical route rail that lights leg by leg.

FORM: grounded candidate "Le linee della metro", safer register round (re-roll 1), seed key 3e658e65. Signature interaction: choosing an exit lights the route to all outcomes, stamps "Fermata visitata" and flips the board to the next stop. Motion grammar: exponential ease-out, rails draw top-down, colour-band wipe between views, all disabled under prefers-reduced-motion. Approved reference prototype: https://claude.ai/artifact/8rb8hnA1TaXM4MB5G3qa4J (metro.html).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Dark theme for the metro world (current app has one); where the Method page and bibliography sit in the network metaphor; English strings stay untranslated.
