# Anthropology Clash

Web app che insegna concetti antropologici tramite scenari a bivio ispirati a casi etnografici reali. Nome provvisorio. Documento funzionale e piano operativo di riferimento: `docs/manuale-funzionale.md` (versione viva, aggiornare con commit `docs:` a ogni decisione o milestone). Repository: https://github.com/AlbeAli/anthropology-clash

## Stack

- TypeScript 5, Vite 6, React 19, Tailwind CSS 4, React Router 7
- Zod per lo schema dei contenuti, Vitest per i test, i18next + react-i18next per la UI
- Node LTS (22 o 24), pnpm. Nessun altro gestore pacchetti.
- Nessun backend nell'MVP. Contenuti in JSON nel repo, stato utente in `localStorage`.

## Comandi

```
pnpm dev        # dev server
pnpm build      # build statica
pnpm validate   # valida tutti i JSON in src/content contro lo schema Zod
pnpm test       # Vitest, solo engine e schema
pnpm lint       # ESLint + Prettier check
```

`pnpm validate` deve passare prima di ogni commit che tocca `src/content/`.

## Struttura

```
src/components   ScenarioCard, ChoiceButton, FeedbackPanel, LevelToggle
src/engine       selezione scenario, stato progressi, copertura concetti
src/content      it/scenarios/*.json, it/concepts.json, en/...
src/locales      it.json (fonte di verità), en.json
src/schema       scenario.schema.ts
src/pages        Home, Scenario, ConceptLibrary, Method
src/state        AppState.tsx (context React: livello, tema, progressi, streak)
scripts          validate-content.ts
```

## Regole vincolanti

- **Nessuna risposta "sbagliata".** Il feedback descrive la conseguenza di una scelta nel contesto culturale, mai un verdetto giusto/sbagliato. Vale per copy, UI e nomi di variabili: niente `correct`, `wrong`, `score`.
- **Feedback su tutte le opzioni.** Dopo la scelta si mostrano anche gli esiti delle alternative non scelte.
- **Ogni scenario ha una fonte reale.** Il campo `source` è obbligatorio. Nessuno scenario inventato senza riferimento etnografico. Per il livello `studente` la fonte include almeno autore e anno.
- **Pratiche sempre contestualizzate**: dove, quando, secondo quale fonte. Mai "in Africa si usa..." senza popolazione, periodo e fonte.
- **Nessuna stringa visibile nei componenti.** Tutto passa da `src/locales/`. Lingua attiva: `it`. `en` predisposto, non tradotto: non inventare traduzioni inglesi.
- **Nessun dato personale.** Niente account, cookie di tracciamento, form con email. Analytics solo Plausible o Umami.
- **`localStorage` sempre in try/catch.** L'app funziona anche senza persistenza. Chiave: `anthropology-clash.v1`. Il campo `version` cambia solo per modifiche non retrocompatibili.

## Contenuti

- Un file per scenario: `src/content/it/scenarios/scenario_NNN.json`, nome file uguale all'`id`.
- Stesso scenario in due livelli: `neofita` (linguaggio comune, 2 scelte, spiegazione breve) e `studente` (contesto etnografico, 3-4 scelte, riferimento teorico esplicito, blocco `deepen` con 3-4 riferimenti per approfondire: `ref`, `why`, `access`, `url` opzionale solo se verificato e ufficiale: editore, DOI, Gutenberg, archivio istituzionale; mai copie su siti terzi).
- Il livello `studente` serve anche a laureati che riprendono un tema: la libreria concetti dà accesso libero a qualsiasi scenario, non solo in sequenza.
- Ogni esempio attribuito a un autore deve trovarsi davvero nell'opera citata. Nessuna affermazione quantitativa ("il più usato", "la maggioranza") senza fonte: attenuare o citare.
- Concetti ammessi: `reciprocita`, `parentela`, `rituale`, `relativismo`, `consumo`. Aggiungerne uno richiede modifica a `ConceptId` nello schema e voce in `concepts.json`.
- Campo `hook` opzionale in ogni livello (max 400 caratteri): l'aggancio a una situazione contemporanea che apre lo scenario prima del `setup` etnografico. O in entrambi i livelli o in nessuno, verificato da `pnpm validate`.
- **Un `hook` non è un caso di studio.** È un'illustrazione in seconda persona e non contiene affermazioni fattuali su gruppi, quantità o singole persone. Se la situazione contemporanea è a sua volta etnografata, la si cita in `source` e vale come qualunque altra fonte: verificata sul testo.
- Commit per nuovi scenari: `content: aggiunge scenario_NNN (titolo)`.

## Convenzioni

- Conventional Commits: `feat:`, `fix:`, `content:`, `docs:`, `chore:`.
- **Autore del progetto: Alberto Alioto (AlbeAli).** Ogni documento (README, manuale, `package.json`, `index.html`, footer dell'app) lo indica come autore.
- **Licenze:** codice MIT (`LICENSE`), testi di `src/content/` CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`). Le citazioni dalle fonti restano dei titolari: citare solo quanto serve alla discussione.
- **Unico contributor su GitHub: AlbeAli.** Nessun trailer `Co-Authored-By` (né Claude né altri) nei messaggi di commit e nelle PR, in nessun caso.
- `main` sempre rilasciabile. Una branch per milestone o per scenario.
- Nessun commento nel codice salvo vincolo non ovvio.
- Nessuna dipendenza aggiunta senza motivazione nel messaggio di commit.

## Milestone

| M | Fatto quando |
|---|---|
| M1 | `pnpm validate` passa; `pnpm dev` renderizza scenario_001 da JSON |
| M2 | Scenari 01-03 giocabili da cima a fondo in entrambi i livelli |
| M3 | Livello, progressi e streak sopravvivono alla chiusura del browser |
| M4 | URL pubblico su Vercel; eventi visibili in Plausible/Umami; CI verde |
| M5 | 15 scenari validati |
| M6 | Concetto `consumo` e campo `hook` in produzione; 3 scenari sul consumo che partono da un caso contemporaneo |
| M7 | `hook` contemporaneo in tutti i 18 scenari, in entrambi i livelli, validato con l'autore |
| M8 | 20 scenari, 4 per concetto: uno in più per `rituale` e uno per `consumo` |

## Cosa non fare

- Non aggiungere backend, auth o database: sono fase 2.
- Non usare Next.js, Astro, Redux o altre librerie di stato: React state + context bastano.
- Non generare scenari senza fonte, anche come placeholder: usare i 3 di M1.
- Non tradurre in inglese per iniziativa propria.
