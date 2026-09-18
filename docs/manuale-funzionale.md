# Anthropology Clash — Manuale funzionale e piano operativo

Versione 0.10 — 2026-09-18 — Stato: in sviluppo (M1, M2 e M3 chiuse; prossimo passo: M4, §16.5)

Questo file è la versione viva del documento funzionale. Nasce dalla v0.6 (artifact claude.ai, 2026-09-16) e da qui in poi si aggiorna nel repository, con un commit `docs:` a ogni cambiamento di scope, decisione o chiusura di milestone. Le regole vincolanti per chi scrive codice e contenuti sono riassunte in [CLAUDE.md](../CLAUDE.md), che deriva da questo documento e non lo sostituisce.

Repository: https://github.com/AlbeAli/anthropology-clash

---

## 1. Obiettivo

Web app gratuita che insegna concetti antropologici tramite **scenari a bivio** ispirati a casi etnografici reali. L'utente affronta un dilemma sul campo, sceglie un'azione, riceve un riscontro con la spiegazione teorica collegata e la fonte.

Obiettivo di prodotto: essere il primo strumento che unisce rigore accademico, formato ludico narrativo e doppio livello di profondità sullo stesso contenuto.

## 2. Posizionamento

I competitor analizzati (Anthropology Quiz Practice, The Anthropology Quiz, Quizizz, Sporcle, Travel Trivia, Nascent Worlds) offrono quiz nozionistici isolati o attività d'aula. Nessuno offre narrativa a scelte, progressione concettuale e doppio livello self-service.

Differenziazione:

- scenario narrativo invece di domanda secca;
- concetto teorico esplicitato dopo ogni scelta, con fonte;
- stesso scenario in due profondità: `neofita` / `studente`.

## 3. Target e livelli

| Profilo  | Descrizione                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Neofita  | Nessuna base accademica. Linguaggio comune, 2 scelte, spiegazione breve, nessun riferimento bibliografico in vista (fonte collassata).                                               |
| Studente | Ha basi. Contesto etnografico più ricco, 3-4 scelte, spiegazione con autore/opera/dibattito, fonte aperta.                                                                           |
| Laureato | Riprende o approfondisce un tema. Usa il livello studente più il blocco `deepen` (3-4 riferimenti con motivo e stato di accesso). Entra dalla libreria concetti, non dalla sequenza. |
| Futuro   | Livello avanzato separato, percorsi per corso, modalità docente. Fuori scope MVP.                                                                                                    |

Selezione livello: toggle globale nella barra, modificabile in ogni momento. Due porte d'ingresso: **sequenza** (neofita, un concetto alla volta) e **per tema** (studente e laureato, dalla libreria concetti verso qualsiasi scenario).

## 4. Concept di gioco

Loop: setup → scelta tra 2-4 opzioni → feedback immediato (cosa succede, concetto, fonte) → scenario completato, si sblocca il successivo.

Progressione: streak giornaliera (1 scenario al giorno consigliato, accesso libero a tutti quelli sbloccati). Copertura concettuale tracciata per evitare ripetizioni ravvicinate dello stesso concetto.

### Principi di design vincolanti

1. **Nessuna risposta "sbagliata".** Il feedback descrive la conseguenza di una scelta nel contesto culturale, mai un verdetto. Vale per copy, UI e codice: gli identificatori `correct`, `wrong`, `score` sono bloccati da ESLint (`id-denylist`).
2. **Feedback su tutte le opzioni.** Dopo la scelta si mostrano anche gli esiti delle alternative.
3. **Ogni scenario è tracciabile a una fonte reale.** Nessuno scenario inventato, nemmeno come placeholder.
4. **Pratiche sempre contestualizzate**: dove, quando, secondo quale fonte. Mai "in Africa si usa..." senza popolazione, periodo e fonte.
5. **Ogni esempio attribuito a un autore deve trovarsi davvero nell'opera citata.** Nessuna affermazione quantitativa senza fonte.

## 5. Modello dati

Contenuto statico, JSON versionato in `src/content/<lang>/`, nessun backend nell'MVP. Un file per scenario, `scenario_NNN.json`, nome file uguale all'`id`. Tassonomia concetti in `concepts.json` (`reciprocita`, `parentela`, `rituale`, `relativismo`).

Schema di riferimento: `src/schema/scenario.schema.ts` (Zod). Struttura:

```
Scenario { id, lang, title, concept, concept_label, levels: { neofita, studente } }
LevelContent { setup, choices[2-4]{id a-d, text}, feedback{<choiceId>: string}, source, deepen?[1-5]{ref, why, access, url?} }
Concept { id, lang, label, definition }
```

Vincoli oltre lo schema, verificati da `scripts/validate-content.ts`:

- id univoci per lingua; nome file uguale all'`id`; `lang` coerente con la cartella;
- ogni `concept` usato esiste in `concepts.json` della stessa lingua;
- `source` del livello studente contiene almeno autore e anno;
- `deepen` obbligatorio nel livello studente (opzionale nello schema per non bloccare il neofita);
- ogni chiave di `feedback` corrisponde a una scelta e viceversa; id scelta non duplicati;
- neofita: esattamente 2 scelte; studente: 3-4 scelte.

Aggiungere un concetto richiede modifica a `ConceptId` nello schema e voce in `concepts.json`.

## 6. Funzionalità MVP

| Funzione                     | Descrizione                                                 | Priorità | Milestone                     |
| ---------------------------- | ----------------------------------------------------------- | -------- | ----------------------------- |
| Motore scenari               | Rendering scenario → scelta → feedback da JSON statico      | Alta     | M1-M2                         |
| Validazione contenuti        | Schema Zod in CI e pre-build su tutti i JSON                | Alta     | M1                            |
| Feedback su tutte le opzioni | Dopo la scelta, esito anche delle alternative non scelte    | Alta     | M2                            |
| Selettore livello            | Toggle neofita/studente, persistito in `localStorage`       | Alta     | M1 (stato) / M3 (persistenza) |
| Tracciamento progressi       | Scenari completati, streak, concetti coperti                | Alta     | M3                            |
| Libreria concetti            | Indice dei concetti con definizione e stato degli scenari   | Media    | M3                            |
| Pagina "Metodo e fonti"      | Provenienza dei contenuti, criteri, limiti, bibliografia    | Alta     | M4                            |
| Analytics privacy-first      | Plausible o Umami, senza cookie                             | Alta     | M4                            |
| Accessibilità base           | Tastiera, focus visibile, contrasto AA                      | Media    | M2-M4                         |
| Schema predisposto i18n      | `lang` nel JSON, `it`/`en` nei locales; UI solo in italiano | Media    | M1                            |
| Condivisione risultato       | Riepilogo testuale copiabile a fine sessione                | Bassa    | post-M5                       |

## 7. Roadmap post-MVP

Backend con account e sync multi-dispositivo (Supabase, magic link, RLS); livelli aggiuntivi e percorsi per corso; UGC curato con stato editoriale `draft → in_review → published | rejected`; sfida giornaliera condivisibile; app nativa se la web app è validata.

## 8. Architettura tecnica

### 8.1 Stack (scelte effettive, M1)

| Livello               | Scelta                                          | Note                                                                                    |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Linguaggio            | TypeScript 5.9                                  | `strict`, `verbatimModuleSyntax`, project references (`tsconfig.app` / `tsconfig.node`) |
| Build                 | Vite 6.4                                        | Pinnato a 6.x come da documento; `@vitejs/plugin-react` 5                               |
| UI                    | React 19.3                                      |                                                                                         |
| Stile                 | Tailwind CSS 4.3 via `@tailwindcss/vite`        | Nessun `tailwind.config`: un solo `@import "tailwindcss"` in `src/index.css`            |
| Routing               | React Router 7 (`react-router`)                 | Modalità dichiarativa (`BrowserRouter` + `Routes`)                                      |
| Validazione contenuti | Zod 4.6                                         | La sintassi di §15.1 (`z.record(k, v)`, `code: "custom"`) è quella nativa di Zod 4      |
| i18n                  | i18next 26 + react-i18next 17                   | `it` attivo e fallback; `en.json` vuoto, non tradotto                                   |
| Test                  | Vitest 3                                        | Solo engine, schema e script di validazione                                             |
| Qualità               | ESLint 9 flat + typescript-eslint 8, Prettier 3 | `id-denylist` per `correct`/`wrong`/`score`                                             |
| Runtime               | Node 24 (`.nvmrc`), pnpm 12                     | pnpm 12 richiede `pnpm-workspace.yaml` con `allowBuilds: esbuild`                       |

Alternative scartate: Astro (app interattiva con stato), Next.js (SSR inutile, vincola l'hosting), JS puro (stato manuale insostenibile a 20 scenari), Redux e simili (React state + context bastano).

### 8.2 Struttura del progetto

```
/src
  /components   ScenarioCard, ChoiceButton, LevelToggle  (M2: FeedbackPanel)
  /engine       content.ts (caricamento e parsing JSON)  (M3: progress, streak, coverage)
  /content      it/scenarios/*.json, it/concepts.json    (en/ quando servirà)
  /locales      it.json (fonte di verità), en.json (vuoto)
  /schema       scenario.schema.ts
  /pages        Home, Scenario                            (M3: ConceptLibrary; M4: Method)
  i18n.ts, App.tsx, main.tsx, index.css
/scripts        validate-content.ts (+ test)
/docs           questo documento
/.github        workflows/ci.yml
vercel.json     rewrite SPA verso index.html
```

Caricamento contenuti: `import.meta.glob` su `src/content/*/scenarios/*.json`, parsing Zod al bootstrap. Un JSON non valido fa fallire la build (`prebuild` esegue `pnpm validate`) e, in dev, il caricamento dell'app.

### 8.3 Dove risiedono i dati

| Dato               | MVP                                            | Fase 2                                           |
| ------------------ | ---------------------------------------------- | ------------------------------------------------ |
| Scenari e concetti | JSON nel repo, asset statici                   | Invariato                                        |
| Progressi utente   | `localStorage`, chiave `anthropology-clash.v1` | Postgres (`progress`), `localStorage` come cache |
| Dati personali     | **Nessuno**                                    | Supabase Auth, magic link                        |
| UGC                | Non previsto                                   | Tabella `submissions`                            |

Limite accettato e dichiarato nella UI: i progressi non si sincronizzano tra dispositivi e si perdono cancellando i dati del browser.

### 8.4 Hosting e rilascio

- Repository GitHub `AlbeAli/anthropology-clash`, pubblico, `main` sempre rilasciabile.
- CI GitHub Actions su push e pull request: `pnpm lint → validate → test → build` (Node da `.nvmrc`, `pnpm install --frozen-lockfile`).
- Deploy: Vercel, build statica, anteprima per ogni branch. `vercel.json` già presente per il rewrite SPA. Collegamento del progetto Vercel: M4.
- Dominio: da decidere.

### 8.5 Analytics e privacy

Plausible o Umami: metriche aggregate, senza cookie, nessun banner. Google Analytics escluso. Eventi minimi: apertura app, livello scelto, scenario iniziato, scenario completato, ritorno.

### 8.6 Lingue

Italiano attivo. Inglese predisposto: chiave `lang` nei JSON, cartella `src/content/en/` (creata solo quando ci saranno contenuti), `src/locales/en.json` vuoto con fallback a `it`. Nessuna stringa visibile nei componenti: tutto passa da `locales/`. L'app mostra solo gli scenari nella lingua attiva. Selettore lingua in UI con la sola voce italiano: M3, insieme alla barra persistente.

## 9. Pipeline contenuti

1. Selezione del caso etnografico con fonte verificabile.
2. Versione `neofita` (linguaggio semplice, 2 scelte).
3. Versione `studente` (3-4 scelte, riferimenti teorici, `source` con autore e anno, `deepen`).
4. Tag concetto; verifica che esista in `concepts.json`.
5. Revisione per accuratezza e assenza di stereotipi non contestualizzati; validazione congiunta dove le fonti divergono (elenco fonti consultate, punto di divergenza, decisione e motivo, riportati nel campo `source` e nella pagina Metodo).
6. `pnpm validate` verde; commit `content: aggiunge scenario_NNN (titolo)` su branch dedicata.

## 10. Metriche di successo

| Metrica                         | Target                    |
| ------------------------------- | ------------------------- |
| Completamento primo scenario    | > 70% di chi apre l'app   |
| Ritorno entro 7 giorni          | > 20%                     |
| Scenari completati per sessione | 3+                        |
| Uso studente vs neofita         | Monitorato, nessun target |

## 11. Punti aperti

| Punto                                                | Stato                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Nome prodotto                                        | Provvisorio: Anthropology Clash (candidati in §12)            |
| Numero scenari MVP                                   | Deciso: 15 (§13)                                              |
| 4 scenari con fonte primaria non OA (09, 11, 12, 15) | Da validare insieme su fonti secondarie aperte                |
| Dominio, licenza contenuti, monetizzazione           | Da decidere, non bloccanti                                    |
| Licenza del codice                                   | Da decidere prima di promuovere il repo pubblico              |
| Pre-commit hook (lint + validate)                    | Da valutare: aggiunge una dipendenza; la CI copre già il caso |
| Identità visiva (font, palette, tono)                | Applicata (§16.2); copy del kicker in Home ancora provvisorio |

## 12. Nome

"Culture Clash" scartato (prodotti omonimi attivi). Candidati verificati via RDAP il 2026-09-16: Malinteso (.app libero, .com preso), Straniamento, Spaesamento, Sconfinare, Ethnoclash (.com preso). Il registro .it va verificato manualmente su nic.it. Nome di lavoro: **Anthropology Clash** (anthropologyclash.app/.com e anthroclash.app/.com liberi alla data). La ricerca resta aperta; la disponibilità di un dominio non equivale a disponibilità del marchio.

## 13. Backlog scenari MVP

| #   | Titolo di lavoro                 | Concetto            | Fonte primaria                                             | Accesso   | Stato        |
| --- | -------------------------------- | ------------------- | ---------------------------------------------------------- | --------- | ------------ |
| 01  | La collana che non si può tenere | Reciprocità         | Malinowski, Argonauts, 1922                                | PD        | **validato** |
| 02  | La carne è troppo magra          | Reciprocità         | Lee, Eating Christmas in the Kalahari, 1969                | OA        | **validato** |
| 03  | I riti del corpo dei Nacirema    | Relativismo         | Miner, American Anthropologist, 1956                       | OA        | **validato** |
| 04  | Bruciare la ricchezza            | Reciprocità         | Boas, 1897; Mauss, 1925                                    | PD        | da scrivere  |
| 05  | Lo spirito della cosa donata     | Reciprocità         | Mauss, Essai sur le don, 1925                              | PD (fr)   | da scrivere  |
| 06  | Cugino o fratello?               | Parentela           | Morgan, Systems of Consanguinity, 1871                     | PD        | da scrivere  |
| 07  | L'eredità va al nipote           | Parentela           | Malinowski, 1922 e 1929                                    | PD (1922) | da scrivere  |
| 08  | Amleto tra i Tiv                 | Parentela           | Bohannan, Shakespeare in the Bush, 1966                    | OA        | da scrivere  |
| 09  | Sposare un fantasma              | Parentela           | Evans-Pritchard, Kinship and Marriage among the Nuer, 1951 | NON-OA    | da validare  |
| 10  | La soglia                        | Rituale             | van Gennep, Les rites de passage, 1909                     | PD (fr)   | da scrivere  |
| 11  | Il combattimento di galli        | Rituale             | Geertz, Deep Play, 1972                                    | NON-OA    | da validare  |
| 12  | L'animale abominevole            | Rituale             | Douglas, Purity and Danger, 1966                           | NON-OA    | da validare  |
| 13  | Ordinare il museo                | Relativismo         | Boas, Science, 1887                                        | PD        | da scrivere  |
| 14  | Non pubblicarlo                  | Relativismo / etica | AAA, Principles of Professional Responsibility, 2012       | OA        | da scrivere  |
| 15  | Il tempo delle mucche            | Relativismo         | Evans-Pritchard, The Nuer, 1940                            | NON-OA    | da validare  |

Legenda: PD pubblico dominio; OA open access; NON-OA sotto diritti, si lavora su fonti secondarie aperte e si valida insieme il punto specifico. Copertura: reciprocità 4, parentela 4, rituale 3, relativismo/etica 4.

## 14. Fonti e accesso

Repertori: DOAJ (riviste OA: Cultural Anthropology, Social Anthropology, JASO, Kinship), Open Anthropological Research (archivio OA), JSTOR (gratis American Anthropologist 1888-1930 e pre-1930), AnthroSource (solo articoli marcati OA; Miner 1956 e Codice etico AAA liberi), Open Encyclopedia of Anthropology (Cambridge, voci "Gifts", "Kinship", "Ritual").

Fonti primarie aperte individuate: Malinowski 1922 (Gutenberg #55822), Miner 1956 (DOI 10.1525/aa.1956.58.3.02a00080), Bohannan 1966 e Lee 1969 (Natural History), Mauss 1925 (Classiques UQAC), Morgan 1871 (Internet Archive), van Gennep 1909, Boas 1887, AAA 2012.

Bibliografia della pagina "Metodo e fonti": un'opera entra solo se un feedback, una definizione o un `deepen` la cita. Alla data, per gli scenari 01-03 e i concetti: Malinowski 1922; Mauss 1925; Bohannan 1955 e 1966; Weiner 1992; Leach & Leach 1983; Lee 1969 e 1979; Woodburn 1982; Wilmsen 1989; Lee & Guenther 1991; Miner 1956 e 1952; Leathem 2023 (accesso da verificare); Sahlins 1972; Morgan 1871; van Gennep 1909; Turner 1969; Douglas 1966; Boas 1887. In M4 la pagina Metodo va generata o allineata a questo elenco.

## 15. Specifica di sviluppo

### 15.1 Schema contenuti

Implementato in `src/schema/scenario.schema.ts`. Differenze rispetto alla v0.6: export di tipo `Lang`, `Level`, `ConceptId`; campo `url` opzionale in `Deepen` (2026-09-18), ammesso solo per URL ufficiali e verificati (editore, DOI, Project Gutenberg, archivio istituzionale come Classiques UQAC), mai copie su siti terzi. Non modificare lo schema per aggirare un vincolo di contenuto: correggere il contenuto.

### 15.2 Viste

| Vista             | Percorso    | Contenuto                                                                                                                                                                                  | Stato                 |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| Home / onboarding | `/`         | Nome, frase di presentazione, selettore livello con una riga di spiegazione, streak, pulsanti "Continua la sequenza" e "Scegli un tema"                                                    | **M3**: completa      |
| Scenario          | `/s/:id`    | Etichetta concetto, setup, 2-4 scelte. Dopo la scelta: feedback della scelta in evidenza, alternative sotto, fonte (collassata per neofita, aperta per studente), `deepen` (solo studente) | **M2**: loop completo |
| Libreria concetti | `/concetti` | Griglia dei 4 concetti con definizione; per ciascuno gli scenari con stato e livello di completamento                                                                                      | **M3**: fatta         |
| Metodo e fonti    | `/metodo`   | Provenienza, criteri, limiti, nota etica, bibliografia                                                                                                                                     | M4                    |

Barra persistente: nome app, toggle livello, streak, link a concetti e metodo, selettore lingua (solo `it`). Nessun modale nell'MVP.

### 15.3 Stato locale

```
// localStorage "anthropology-clash.v1"
{
  "version": 1,
  "lang": "it",
  "level": "neofita" | "studente" | null,
  "completed": { "scenario_001": { "level": "neofita", "choice": "a", "at": "2026-09-16" } },
  "streak": { "count": 3, "lastDay": "2026-09-16" },
  "seenConcepts": ["reciprocita"]
}
```

Regole: `version` cambia solo per modifiche non retrocompatibili, e allora il codice migra o azzera dichiarandolo. Ogni lettura e scrittura in `try/catch`; senza `localStorage` l'app funziona senza persistenza. Streak: +1 se `lastDay` è ieri, invariata se è oggi, azzerata altrimenti. Lo stato vive in un context React; nessuna libreria di stato.

### 15.4 Convenzioni repository

- Conventional Commits: `feat:`, `fix:`, `content:`, `docs:`, `chore:`. Nuovi scenari: `content: aggiunge scenario_NNN (titolo)`.
- `main` sempre rilasciabile; una branch per milestone o per scenario. Le milestone M2-M4 si chiudono con merge su `main` e anteprima pubblicata.
- Nessuna dipendenza aggiunta senza motivazione nel messaggio di commit. Nessun commento nel codice salvo vincolo non ovvio.
- Prettier ignora `src/content` e `CLAUDE.md`: i JSON dei contenuti si formattano a mano, non con `--write`.
- Identità git configurata a livello di repository (`user.name`, `user.email`); la CI usa `--frozen-lockfile`, quindi ogni modifica alle dipendenze va committata con `pnpm-lock.yaml`.

### 15.5 Milestone

| M   | Contenuto                                                                             | Fatto quando                                                    | Stato                                   |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| M1  | Scaffold, schema Zod, script di validazione, i18next, scenari 01-03                   | `pnpm validate` passa; `pnpm dev` renderizza scenario_001       | **chiusa** 2026-09-16, commit `e88eddf` |
| M2  | Loop completo: setup → scelta → feedback su tutte le opzioni → prossimo               | I 3 scenari giocabili da cima a fondo in entrambi i livelli     | **chiusa** 2026-09-18, merge `62fedef`  |
| M3  | Toggle livello persistito, stato locale, streak, libreria concetti, barra persistente | Chiudo e riapro il browser: livello, progressi e streak restano | **chiusa** 2026-09-18, merge `44213eb`  |
| M4  | Pagina Metodo, analytics, deploy Vercel                                               | URL pubblico; eventi in dashboard; CI verde (già attiva da M1)  |                                         |
| M5  | Scenari 04-15 scritti e validati                                                      | `pnpm validate` passa su 15 file                                | in parallelo a M2-M4                    |

## 16. Stato di avanzamento e piano operativo

### 16.1 Cosa esiste al 2026-09-18

Fatto in M1, oltre a quanto previsto dalla v0.6:

- Repository GitHub pubblico creato e collegato; `gh` installato sulla macchina di sviluppo.
- CI GitHub Actions attiva (anticipata da M4 a M1: costa poco e protegge `main` da subito).
- `vercel.json` per il rewrite SPA, così il collegamento a Vercel in M4 è solo configurazione.
- Vincoli di contenuto aggiuntivi nello script di validazione (feedback orfani, id duplicati, numero scelte per livello), con test.
- ESLint `id-denylist` a tutela del principio "nessuna risposta sbagliata" anche nel codice.
- Test sul caricatore contenuti (`src/engine/content.test.ts`).
- README e questo documento.

Fatto dopo M1 (2026-09-18):

- Identità visiva secondo §16.2 (commit `89d36a5`, `7c65a18`): token in `@theme`, Source Serif 4 / IBM Plex Sans / IBM Plex Mono da Google Fonts, tema chiaro e scuro.
- Toggle manuale del tema (`a77be13`): parte dal sistema, la scelta è salvata in `anthropology-clash.v1` tramite `src/engine/storage.ts` (lettura e scrittura in try/catch, base per la persistenza di M3) e applicata prima del primo render da uno script inline in `index.html`.
- M2, loop di gioco (`9285cd6`, merge `62fedef`): `FeedbackPanel`, `engine/sequence.ts` con test, navigazione tra scenari.
- Link ufficiali nei `deepen` e campo `url` nello schema (`965b16b`, `1e840bf`).
- M3, persistenza e libreria (`ab3eee1`, merge `44213eb`): stato locale completo, streak, `/concetti`, Home completa, barra con link, badge streak e selettore lingua.

Non fatto, e volutamente: pagina Method e analytics (M4), pre-commit hook (aperto), licenza (aperta).

### 16.2 Identità visiva (applicata)

Vincoli rispettati nell'implementazione e validi per ogni intervento grafico futuro:

- Tailwind 4: i token (colori, font) si dichiarano in `@theme` dentro `src/index.css`, non in un file di configurazione. Palette del documento v0.6 come punto di partenza: fondo `#F1EFE4`, inchiostro `#26241F`, accento `#1F5C56`, argilla `#9A5A34`, con varianti scure.
- Font caricati da Google Fonts o self-hosted; nessun font che richieda licenza a pagamento.
- Contrasto AA su testo e pulsanti; focus visibile su ogni elemento interattivo; navigazione da tastiera nei bottoni di scelta.
- Mobile-first: la vista Scenario deve leggersi bene a 360px senza scroll orizzontale.
- Nessuna stringa nei componenti: ogni nuova etichetta passa da `src/locales/it.json`.
- Il colore non deve mai suggerire un giudizio sulle scelte (niente verde/rosso per gli esiti).

Scelte effettive:

- Palette: fondo `#F1EFE4`, inchiostro `#26241F`, accento `#1F5C56` (con `accent-strong` `#174842` per gli hover), argilla `#A3532A` (più calda della v0.6, limite oltre il quale il testo piccolo perde l'AA sull'avorio). Varianti scure: fondo `#1B1A16`, accento `#5FBBAE`, argilla `#E69A5C`.
- Ruoli: argilla = orientamento (riga sotto la barra, etichetta concetto, titoli di sezione, kicker); accento = azione (scelte, livello, bottoni). Nessun colore lega un esito a un giudizio.
- Font: Source Serif 4 per titoli e testo narrativo (setup, feedback), IBM Plex Sans per la UI, IBM Plex Mono per etichette e livelli.
- Contrasti minimi verificati: 4.61:1 (argilla su avorio), tutto il resto sopra 6:1. Nessuno scroll orizzontale a 375px. Focus visibile con outline accento.

### 16.3 M2 — loop di gioco (chiusa)

Implementato come da piano; note sull'esito:

1. `FeedbackPanel`: feedback della scelta in evidenza, alternative sotto, fonte collassabile (chiusa per neofita, aperta per studente), blocco `deepen` con `ref`, `why`, `access` (solo studente).
2. Stato di pagina: scelta corrente, `onSelect` in `ScenarioPage`; le scelte si disattivano dopo la selezione.
3. Navigazione: "Prossimo scenario" (ordine per `id`); dopo l'ultimo scenario "Torna all'inizio". Il link ai concetti arriva con la libreria in M3.
4. Engine: `nextScenarioId(lang, currentId)` in `src/engine/sequence.ts` con test.
5. Locales: tutte le nuove etichette in `it.json`.
6. Chiusura: i 3 scenari giocabili in entrambi i livelli, verificato nel browser il 2026-09-18; merge `62fedef`. Dopo la scelta il focus va al titolo "Cosa succede" (accessibilità); cambiare livello o scenario azzera la scelta. Le etichette di accesso (`PD`, `OA`, ...) sono tradotte in `it.json` sotto `access`.

### 16.4 M3 — persistenza e libreria (chiusa)

Implementato come da piano; note sull'esito:

1. `src/engine/storage.ts`: lettura e scrittura di `anthropology-clash.v1` in `try/catch`, con sanificazione campo per campo e azzeramento se `version` è diversa. `src/engine/progress.ts`: `dayKey`, `bumpStreak`, `currentStreak`, `markCompleted`, `nextInSequence`, funzioni pure testate con date iniettate (anche a cavallo di mese e anno).
2. `src/state/AppState.tsx`: un solo context React per livello, tema, progressi e streak; nessuna libreria di stato. `level` resta `null` finché l'utente non sceglie (la UI usa `neofita` come predefinito).
3. Ogni scelta in uno scenario registra `{ level, choice, at }`, aggiorna la streak e aggiunge il concetto a `seenConcepts`. Rigiocare uno scenario sovrascrive la voce.
4. Pagina `/concetti`: quattro concetti con definizione e scenari collegati, stato "Da fare" o "Completato · livello"; concetti senza scenari mostrano un avviso (parentela e rituale fino a M5).
5. Home: selettore livello con una riga di spiegazione, contatore "Completati: n di N", streak, "Continua la sequenza" (primo scenario non completato; "Rigioca dall'inizio" se tutti fatti) e "Scegli un tema".
6. Barra: nome, link Concetti, badge streak (solo numero, testo completo in `title` e `aria-label`), toggle livello, selettore lingua con la sola voce italiano, toggle tema. Una riga a 672px, due righe a 375px.
7. Streak in lettura: vale `count` se `lastDay` è oggi o ieri, altrimenti 0; in scrittura +1 se ieri, invariata se oggi, riparte da 1 altrimenti.
8. Chiusura verificata nel browser il 2026-09-18: dopo il ricaricamento restano livello, progressi e streak; merge `44213eb`.

### 16.5 Piano M4 — pubblicazione

1. Pagina `/metodo`: provenienza, criteri, limiti, nota etica, bibliografia da §14; valutare se generarla dai campi `source` e `deepen` per non mantenerla a mano.
2. Progetto Vercel collegato al repo, anteprime per branch, dominio da decidere.
3. Plausible o Umami: script senza cookie, eventi di §8.5; nessun banner.
4. Chiusura: URL pubblico, eventi in dashboard, CI verde.

### 16.6 Piano M5 — contenuti

In parallelo a M2-M4 perché tocca solo `src/content/`. Ordine: 04-08 e 10, 13, 14 (fonti PD/OA) prima; 09, 11, 12, 15 dopo la validazione congiunta sulle fonti NON-OA. Una branch per scenario, commit `content:`, `pnpm validate` verde prima del merge.

### 16.7 Decisioni prese durante M1

| Data       | Decisione                                                                                                | Motivo                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-16 | Zod 4 invece di 3                                                                                        | La sintassi di §15.1 è nativa in v4; nessun beneficio a restare su v3                                                                                                                         |
| 2026-09-16 | Vite pinnato a 6.x, Vitest 3, plugin-react 5                                                             | Coerenza con il documento; Vitest 5 richiede Vite 7+                                                                                                                                          |
| 2026-09-16 | pnpm 12 con `pnpm-workspace.yaml` → `allowBuilds: esbuild`                                               | pnpm 12 blocca gli script postinstall; senza, Vite non parte in CI                                                                                                                            |
| 2026-09-16 | Prettier esclude `src/content` e `CLAUDE.md`                                                             | Il primo `--write` aveva riformattato scenario_001.json; i contenuti non si toccano                                                                                                           |
| 2026-09-16 | CI e `vercel.json` anticipati a M1                                                                       | Costo minimo, protezione di `main` immediata                                                                                                                                                  |
| 2026-09-16 | Regole "2 scelte neofita / 3-4 studente" nello script, non nello schema                                  | Lo schema resta identico a §15.1; il vincolo è editoriale                                                                                                                                     |
| 2026-09-16 | Repository pubblico                                                                                      | Coerente con app gratuita; Vercel e Plausible/Umami senza limiti                                                                                                                              |
| 2026-09-18 | Stato applicativo in `src/state/` (context React), fuori da `engine/`                                    | `engine/` resta logica pura e testabile senza React; il context è l'unico punto che tocca lo storage                                                                                          |
| 2026-09-18 | `url` opzionale nei `deepen`; etichette di accesso uniformi, `NON-OA` reso come "Sotto diritti d'autore" | Richiesta esplicita. Link inseriti solo dopo verifica (Crossref per i DOI: due DOI ricordati a memoria erano sbagliati). Lee 1969 resta senza link: nessun URL ufficiale dell'editore trovato |
| 2026-09-18 | Tema chiaro/scuro con toggle manuale, persistito da subito                                               | Richiesta esplicita; senza persistenza il toggle si azzererebbe a ogni apertura. `storage.ts` nasce ora e M3 lo estende                                                                       |
| 2026-09-18 | Argilla `#A3532A` invece di un terracotta più acceso                                                     | Sotto 4.5:1 sull'avorio per il testo piccolo; il colore resta caldo ma leggibile                                                                                                              |
| 2026-09-16 | Repository GitHub ricreato e riallineato alla storia locale (`659dfab`)                                  | Il primo repo era stato ripopolato via upload web (CRLF, senza `.github/workflows/ci.yml`); la storia locale è quella di riferimento, gli hash precedenti alla ricreazione non valgono più    |

### 16.8 Regola di sincronizzazione dei documenti

- `docs/manuale-funzionale.md` è l'unica versione viva. Si aggiorna con commit `docs:` a ogni decisione, cambio di scope o chiusura di milestone.
- L'artifact claude.ai (https://claude.ai/artifact/3dS9h1xLJ5ao77aNN2jBAC) è una copia leggibile del manuale, rigenerata a ogni bump di versione; non si modifica direttamente.
- `CLAUDE.md` riassume le regole vincolanti per chi scrive codice e contenuti; deriva dal manuale e non lo sostituisce.
