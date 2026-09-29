# Anthropology Clash

Web app che insegna concetti antropologici tramite scenari a bivio ispirati a casi etnografici reali. Nome provvisorio. Documento funzionale e piano operativo di riferimento: `docs/manuale-funzionale.md` (versione viva, aggiornare con commit `docs:` a ogni decisione o milestone). Repository: https://github.com/AlbeAli/anthropology-clash

## Stack

- TypeScript 5, Vite 6, React 19, Tailwind CSS 4, React Router 7
- Zod per lo schema dei contenuti, Vitest per i test, i18next + react-i18next per la UI
- Node LTS (22 o 24), pnpm. Nessun altro gestore pacchetti.
- Contenuti in JSON nel repo. Stato utente in `localStorage`; da M10, con account facoltativo, anche su Supabase (Auth + Postgres con RLS, regione UE Irlanda `eu-west-1`, progetto `anthropology-clash`) tramite `@supabase/supabase-js`. Nessun server proprio: il sito resta statico su Vercel.

## Comandi

```
pnpm dev        # dev server
pnpm build      # build statica
pnpm validate   # valida tutti i JSON in src/content contro lo schema Zod
pnpm test       # Vitest, solo engine e schema
pnpm lint       # ESLint + Prettier check
pnpm e2e        # Playwright, build + preview su 4173
```

`pnpm validate` deve passare prima di ogni commit che tocca `src/content/`.

## Struttura

```
src/components   ScenarioCard, ChoiceButton, FeedbackPanel, LevelToggle
src/engine       selezione scenario, stato progressi, copertura concetti; itineraries.ts (percorsi curati e su misura); aula.ts (passi della modalità aula); sync.ts, remote.ts, account.ts (Supabase)
src/content      it/scenarios/*.json, it/itineraries/*.json, it/concepts.json, en/...
src/locales      it.json (fonte di verità), en.json
src/schema       scenario.schema.ts
src/pages        Home, Scenario, ConceptLibrary, Method, Journey, Itineraries (/percorsi), Itinerary (/percorso/:id, /percorso?f=), Aula (/aula/:id), SignIn (/accedi), Profile (/profilo), Privacy
src/state        AppState.tsx (livello, tema, progressi, streak), Account.tsx (sessione e sincronizzazione)
scripts          validate-content.ts
supabase         migrations/*.sql (schema remoto, RLS; una migrazione per modifica), functions/delete-account
```

## Regole vincolanti

- **Nessuna risposta "sbagliata".** Il feedback descrive la conseguenza di una scelta nel contesto culturale, mai un verdetto giusto/sbagliato. Vale per copy, UI e nomi di variabili: niente `correct`, `wrong`, `score`.
- **Feedback su tutte le opzioni.** Dopo la scelta si mostrano anche gli esiti delle alternative non scelte.
- **Ogni scenario ha una fonte reale.** Il campo `source` è obbligatorio. Nessuno scenario inventato senza riferimento etnografico. Per il livello `studente` la fonte include almeno autore e anno.
- **Pratiche sempre contestualizzate**: dove, quando, secondo quale fonte. Mai "in Africa si usa..." senza popolazione, periodo e fonte.
- **Nessuna stringa visibile nei componenti.** Tutto passa da `src/locales/`. Lingua attiva: `it`. `en` predisposto, non tradotto: non inventare traduzioni inglesi.
- **Account facoltativo, dati minimi.** L'app resta completa senza account. Con account si conservano solo l'identificativo dell'accesso (email per link e Google, id Telegram senza telefono) e i progressi: nessun nome, foto o telefono richiesti ai provider oltre il necessario, nessuna profilazione. Accesso con link via email (SMTP esterno sul dominio, non l'email integrata di Supabase), Google e Telegram (OpenID Connect, provider `custom:telegram`); niente password. Cancellazione dell'account dal profilo, con i progressi; informativa in `/privacy`. Niente cookie di tracciamento; analytics solo Plausible o Umami.
- **Segreti mai nel repo né nel bundle.** Nel client solo URL del progetto e chiave pubblicabile `sb_publishable_…` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, in `.env.production`); service role, Client Secret di Google e Telegram e credenziali SMTP stanno nel dashboard Supabase o nelle Edge Function. Ogni tabella ha RLS attiva: ogni utente legge e scrive solo le proprie righe.
- **`localStorage` sempre in try/catch.** L'app funziona anche senza persistenza e senza rete. Chiave: `anthropology-clash.v1`. Il campo `version` cambia solo per modifiche non retrocompatibili. Con account, `localStorage` resta la copia locale: al primo accesso i progressi locali si uniscono a quelli remoti (unione delle fermate, data più vecchia, serie più lunga), mai sovrascritti.

## Contenuti

- Un file per scenario: `src/content/it/scenarios/scenario_NNN.json`, nome file uguale all'`id`.
- Stesso scenario in due livelli: `neofita` (linguaggio comune, 2 scelte, spiegazione breve) e `studente` (contesto etnografico, 3-4 scelte, riferimento teorico esplicito, blocco `deepen` con 3-4 riferimenti per approfondire: `ref`, `why`, `access`, `url` opzionale solo se verificato e ufficiale: editore, DOI, Gutenberg, archivio istituzionale; mai copie su siti terzi).
- Il livello `studente` serve anche a laureati che riprendono un tema: la libreria concetti dà accesso libero a qualsiasi scenario, non solo in sequenza.
- Ogni esempio attribuito a un autore deve trovarsi davvero nell'opera citata. Nessuna affermazione quantitativa ("il più usato", "la maggioranza") senza fonte: attenuare o citare.
- Concetti ammessi: `reciprocita`, `parentela`, `rituale`, `relativismo`, `consumo`. Aggiungerne uno richiede modifica a `ConceptId` nello schema e voce in `concepts.json`.
- Campo `hook` opzionale in ogni livello (max 400 caratteri): l'aggancio a una situazione contemporanea che apre lo scenario prima del `setup` etnografico. O in entrambi i livelli o in nessuno, verificato da `pnpm validate`.
- **Un `hook` non è un caso di studio.** È un'illustrazione in seconda persona e non contiene affermazioni fattuali su gruppi, quantità o singole persone. Se la situazione contemporanea è a sua volta etnografata, la si cita in `source` e vale come qualunque altra fonte: verificata sul testo.
- Campo `discuss` a livello di scenario (vale per entrambi i livelli): 2-3 domande per la discussione in classe, ciascuna chiusa da `?`. Nessuna affermazione fattuale oltre quanto già dicono scenario e fonte; nessuna domanda che indichi un'uscita preferibile o citi una scelta come migliore. Le scrive l'assistente, le valida l'autore. Facoltativo nello schema finché tutti gli scenari non lo hanno.
- Itinerari curati: `src/content/it/itineraries/<id>.json` (`id` in kebab-case uguale al nome file, `lang`, `title`, `description`, `stops` con 2-12 id di scenari esistenti, senza ripetizioni), verificati da `pnpm validate`. Un itinerario è una sequenza, non un giudizio: la descrizione dice cosa lega le fermate, non cosa si deve concludere.
- Commit per nuovi scenari: `content: aggiunge scenario_NNN (titolo)`.

## Convenzioni

- Conventional Commits: `feat:`, `fix:`, `content:`, `docs:`, `chore:`.
- **Autore del progetto: Alberto Alioto (AlbeAli).** Ogni documento (README, manuale, `package.json`, `index.html`, footer dell'app) lo indica come autore.
- **Licenze:** codice MIT (`LICENSE`), testi di `src/content/` CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`). Le citazioni dalle fonti restano dei titolari: citare solo quanto serve alla discussione.
- **Unico contributor su GitHub: AlbeAli.** Nessun trailer `Co-Authored-By` (né Claude né altri) nei messaggi di commit e nelle PR, in nessun caso.
- `main` sempre rilasciabile. Una branch per milestone o per scenario.
- **Locale, GitHub e cloud sempre allineati.** Hook di progetto in `.claude/settings.json` (`.claude/hooks/git-sync.mjs`): all'avvio della sessione `git fetch` e pull solo fast-forward, se l'albero è pulito e la branch non diverge; a fine turno avviso se restano modifiche non committate o commit non pushati. Ogni lavoro finisce con commit e push.
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
| M9 | Redesign «Le linee della metro» in produzione; riepilogo di fine sessione copiabile; test end-to-end in CI; scenario da Kroeber 1919 validato |
| M10 | Account facoltativo su Supabase UE con link via email, Google e Telegram; progressi sincronizzati e uniti a `localStorage`; profilo con cancellazione; informativa `/privacy`; e2e verdi con Supabase simulato; dominio `anthropologyclash.app` |
| M11 | Stabilizzazione: `m10` su `main` con l'account spento in produzione (fino alla fase di rilascio, manuale §16.14); error boundary; pulizie; audit di accessibilità e prestazioni con correzioni; dipendenze aggiornate; CI verde |
| M12 | Aula e percorsi: modalità aula `/aula/:id`; itinerari curati (JSON validato) e personalizzati come link; `discuss` in tutti gli scenari, validato con l'autore e obbligatorio in `pnpm validate`; scheda stampabile; JS iniziale misurato prima e dopo; e2e e CI verdi |

## Cosa non fare

- Nessun backend oltre Supabase (Auth, Postgres, Edge Function): niente server propri, API routes di Vercel o altri servizi dati. Nuove tabelle solo con migrazione nel repo e RLS.
- Non usare Next.js, Astro, Redux o altre librerie di stato: React state + context bastano.
- Non generare scenari senza fonte, anche come placeholder: usare i 3 di M1.
- Non tradurre in inglese per iniziativa propria.
