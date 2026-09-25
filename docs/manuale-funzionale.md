# Anthropology Clash — Manuale funzionale e piano operativo

Autore: Alberto Alioto (AlbeAli)

Versione 0.34 — 2026-09-25 — Stato: pubblicato (M1-M6 chiuse, M7 aperta, §16.10)

Questo file è la versione viva del documento funzionale. Le versioni fino alla 0.6 (2026-09-16) sono state redatte fuori dal repository; da qui in poi si aggiorna nel repository, con un commit `docs:` a ogni cambiamento di scope, decisione o chiusura di milestone. Le regole vincolanti per chi scrive codice e contenuti sono riassunte in [CLAUDE.md](../CLAUDE.md), che deriva da questo documento e non lo sostituisce.

Repository: https://github.com/AlbeAli/anthropology-clash · App: https://anthropology-clash.vercel.app

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

Contenuto statico, JSON versionato in `src/content/<lang>/`, nessun backend nell'MVP. Un file per scenario, `scenario_NNN.json`, nome file uguale all'`id`. Tassonomia concetti in `concepts.json` (`reciprocita`, `parentela`, `rituale`, `relativismo`, `consumo`).

Schema di riferimento: `src/schema/scenario.schema.ts` (Zod). Struttura:

```
Scenario { id, lang, title, concept, concept_label, levels: { neofita, studente } }
LevelContent { hook?, setup, choices[2-4]{id a-d, text}, feedback{<choiceId>: string}, source, deepen?[1-5]{ref, why, access, url?} }
Concept { id, lang, label, definition }
```

Vincoli oltre lo schema, verificati da `scripts/validate-content.ts`:

- id univoci per lingua; nome file uguale all'`id`; `lang` coerente con la cartella;
- ogni `concept` usato esiste in `concepts.json` della stessa lingua;
- `source` del livello studente contiene almeno autore e anno;
- `deepen` obbligatorio nel livello studente (opzionale nello schema per non bloccare il neofita);
- ogni chiave di `feedback` corrisponde a una scelta e viceversa; id scelta non duplicati;
- neofita: esattamente 2 scelte; studente: 3-4 scelte;
- `hook` presente in entrambi i livelli o in nessuno.

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
| Analytics privacy-first      | Umami (deciso 2026-09-18), senza cookie                     | Alta     | M4                            |
| Accessibilità base           | Tastiera, focus visibile, contrasto AA                      | Media    | M2-M4                         |
| Schema predisposto i18n      | `lang` nel JSON, `it`/`en` nei locales; UI solo in italiano | Media    | M1                            |
| Condivisione risultato       | Riepilogo testuale copiabile a fine sessione                | Bassa    | post-M5                       |

## 7. Roadmap post-MVP

Backend con account e sync multi-dispositivo (Supabase, magic link, RLS); livelli aggiuntivi e percorsi per corso; UGC curato con stato editoriale `draft → in_review → published | rejected`; sfida giornaliera condivisibile; app nativa se la web app è validata.

Rinviati a dopo M5 per decisione del 2026-09-21 (proposte esterne valutate, §16.7): interfaccia in inglese con selettore lingua attivo, da rilasciare solo insieme ai 15 scenari in inglese verificati sui testi originali (le citazioni da fonti inglesi vanno riprese verbatim, non ritradotte); pulsante di condivisione per scenario (§6 prevede il riepilogo di fine sessione); astrazione dello storage (`StorageAdapter`, fusione di stati) che ha senso solo con un backend reale.

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
- App pubblica: https://anthropology-clash.vercel.app (Vercel, deploy automatico a ogni push su `main`, anteprima per ogni branch).
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

Aggancio contemporaneo (`hook`, dal 2026-09-22): uno scenario può aprirsi su una situazione di oggi e risalire da lì al caso etnografico e alla teoria. Il `hook` sta in entrambi i livelli o in nessuno, dura al massimo 400 caratteri e si rivolge a chi legge in seconda persona. Regola: **non è un caso di studio**. Non contiene affermazioni fattuali su gruppi, quantità o persone reali; se la situazione contemporanea è a sua volta etnografata, si cita l'opera in `source` e la si verifica sul testo come ogni altra fonte. Il carico della dimostrazione resta sul `setup` e sui feedback.

## 10. Metriche di successo

| Metrica                         | Target                    |
| ------------------------------- | ------------------------- |
| Completamento primo scenario    | > 70% di chi apre l'app   |
| Ritorno entro 7 giorni          | > 20%                     |
| Scenari completati per sessione | 3+                        |
| Uso studente vs neofita         | Monitorato, nessun target |

## 11. Punti aperti

| Punto                                 | Stato                                                                                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nome prodotto                         | Provvisorio: Anthropology Clash (candidati in §12)                                                                                                                     |
| Numero scenari MVP                    | Deciso: 15 (§13)                                                                                                                                                       |
| Fonti primarie non ad accesso aperto  | Risolto: lette direttamente con la ricerca interna di Internet Archive (§16.7); Geertz 1972 e Douglas 1972 sono OA su JSTOR, Kroeber 1909 e Leathem 2023 sono aperti   |
| Dominio, monetizzazione               | Da decidere, non bloccanti                                                                                                                                             |
| Licenza                               | Decisa il 2026-09-25: codice MIT (`LICENSE`), testi di `src/content` CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`); le citazioni dalle fonti restano dei titolari dei diritti |
| Pre-commit hook (lint + validate)     | Da valutare: aggiunge una dipendenza; la CI copre già il caso                                                                                                          |
| Identità visiva (font, palette, tono) | Applicata (§16.2); kicker in Home deciso il 2026-09-25: «Dilemmi dal campo, domande di oggi», modificabile in `home.kicker`                                            |

## 12. Nome

"Culture Clash" scartato (prodotti omonimi attivi). Candidati verificati via RDAP il 2026-09-16: Malinteso (.app libero, .com preso), Straniamento, Spaesamento, Sconfinare, Ethnoclash (.com preso). Il registro .it va verificato manualmente su nic.it. Nome di lavoro: **Anthropology Clash** (anthropologyclash.app/.com e anthroclash.app/.com liberi alla data). La ricerca resta aperta; la disponibilità di un dominio non equivale a disponibilità del marchio.

## 13. Backlog scenari MVP

| #   | Titolo di lavoro                 | Concetto            | Fonte primaria                                    | Accesso | Stato        |
| --- | -------------------------------- | ------------------- | ------------------------------------------------- | ------- | ------------ |
| 01  | La collana che non si può tenere | Reciprocità         | Malinowski, Argonauts, 1922                       | PD      | **validato** |
| 02  | La carne è troppo magra          | Reciprocità         | Lee, Eating Christmas in the Kalahari, 1969       | OA      | **validato** |
| 03  | I riti del corpo dei Nacirema    | Relativismo         | Miner, American Anthropologist, 1956              | OA      | **validato** |
| 04  | Bruciare la ricchezza            | Reciprocità         | Boas, 1897; Mauss, 1925                           | PD      | **validato** |
| 05  | Lo spirito della cosa donata     | Reciprocità         | Mauss, Essai sur le don, 1925                     | PD (fr) | **validato** |
| 06  | Cugino o fratello?               | Parentela           | Morgan, Systems of Consanguinity, 1871            | PD      | **validato** |
| 07  | L'eredità va al nipote           | Parentela           | Malinowski, 1922, 1926 e 1929                     | PD      | **validato** |
| 08  | Amleto tra i Tiv                 | Parentela           | Bohannan, Shakespeare in the Bush, 1966           | OA      | **validato** |
| 09  | Sposare un fantasma              | Parentela           | Evans-Pritchard, 1951, cap. III                   | NON-OA  | **validato** |
| 10  | La soglia                        | Rituale             | van Gennep, 1909; Thomson, 1885                   | PD (fr) | **validato** |
| 11  | Il combattimento di galli        | Rituale             | Geertz, Daedalus, 1972 (OA su JSTOR); Geertz 1973 | OA      | **validato** |
| 12  | L'animale abominevole            | Rituale             | Douglas, 1966, cap. 2-3; Douglas 1972 (OA), 1993  | NON-OA  | **validato** |
| 13  | Ordinare il museo                | Relativismo         | Boas, Mason, Dall, Powell, Science, 1887          | PD      | **validato** |
| 14  | Non pubblicarlo                  | Relativismo / etica | AAA 2012; Cassell 1987 (caso 22); AAA 1971        | OA      | **validato** |
| 15  | Il tempo delle mucche            | Relativismo         | Evans-Pritchard, 1940, cap. I e III; E-P 1939     | NON-OA  | **validato** |

Legenda: PD pubblico dominio; OA open access; NON-OA sotto diritti, si lavora su fonti secondarie aperte e si valida insieme il punto specifico. Copertura: reciprocità 4, parentela 4, rituale 3, relativismo/etica 4.

Revisione batch A (01, 04, 05), 2026-09-22. Riletti sul testo, non solo riletti: ogni citazione e ogni affermazione attribuita a un autore è stata ricontrollata alla fonte. Verificato: Boas 1897 sul testo integrale (Internet Archive) — «interest-bearing investment of property», «rivals fight with property only», «not at liberty to refuse», p'a'sa «flattening», tassi 5→6 in pochi mesi, 5→7 a sei mesi, 5→10 a dodici, «break a copper of equal or higher value», i frammenti rivettati che aumentano il valore, «in by far the greater number of cases the copper is preserved», le feste del grasso che sfociano in «open enmity»; Mauss 1925 (Sociologie et anthropologie, pp. 212-216) — il testo di Ranaipiri, «la chose reçue n'est pas inerte», «il poursuit... tout individu auquel le taonga est simplement transmis», «présenter quelque chose à quelqu'un c'est présenter quelque chose de soi», «refuser de donner... équivaut à déclarer la guerre»; Lévi-Strauss 1950 (pp. 40-41) — «l'ethnologue se laisse mystifier par l'indigène», «une théorie néo-zélandaise... qui n'est pas autre chose qu'une théorie»; Firth 1929 (pp. 411-413) — la sanzione triplice e «nowhere in the native text can support be found»; Sahlins 1972 (p. 180 e p. 184) — «the hau of a good is its yield», «one man's gift should not be another man's capital», «a direct return on the initial gift is excluded»; Codere 1950 — «fighting with property» invece di «fighting with weapons», 2.264 kwakiutl nel 1882, almeno 658 posizioni di potlatch; Cole & Chaikin 1990 — divieto del 1885 cancellato solo nel 1951, oltre cinquanta condanne dopo il potlatch di Village Island di Dan Cranmer.

Corretto di conseguenza: tolta l'attribuzione a Drucker & Heizer 1967 (opera non reperibile per la verifica: sostituita con l'annotazione di Boas sui rami conservati) e a Weiner 1992 in 05 (non su Internet Archive: al suo posto Sahlins, p. 184); riscritte le frasi su Codere (i dettagli su epidemie, nomi vacanti e coperte a buon mercato non trovavano riscontro) e su Cole & Chaikin (l'U'mista Cultural Centre e la data 1921 non sono confermati dal testo, che parla dei processi del 1922); Firth non è più presentato come esperto della lingua ma con la sua tesi verificata; in 05 neofita «spiegò nel 1909» diventa «pubblicato nel 1909», perché la data della raccolta non è documentata. Anche in 01, già validato, la voce Weiner è stata ridotta al titolo con editore, senza tesi attribuite. Tono: in 04 «misurare con il metro sbagliato» è diventato «con un metro che qui non vale».

Revisione batch B (06, 07, 08, 09), 2026-09-22. Verificato sul testo: Morgan 1871 (copia integrale, Internet Archive) — «my father's brother is my father… Ha-nih'», il dialogo del questionario («What do I call my father's brother's son if he is older than myself?» → «Ha'-je, my elder brother»), «Ha'-ga my younger brother», «admitted to all intents and purposes into the same relationships as my own brothers and sisters», il cugino Ah-gare'-seh «restricted to the children of a brother and sister», la nota che il termine fu sviluppato più tardi «to remove an irregularity which amounted to a blemish», le otto tribù seneca (Wolf, Bear, Beaver, Turtle, Deer, Snipe, Heron, Hawk), «none of the members of the Wolf or other tribes were allowed to intermarry in their own tribe», «the mother confers both her nationality and her tribal name upon her children», «he is, practically, rather more the head of his sister's family than his sister's husband», il metodo del questionario «settling the orthography, pronunciation, and accent… by means of frequent repetitions»; Kroeber 1909 nel volume 39 del JRAI (copia aperta su Internet Archive) — «the causes which determine the formation, choice, and similarities of terms of relationship are primarily linguistic», con le prime quattro delle otto categorie: generazione, linea diretta o collaterale, età nella generazione, sesso del parente; Murdock 1949 — «Iroquois type» nella tipologia dei termini per i cugini (pp. 149 e 249); Bohannan & Bohannan 1953 — «an elder must have tsav, that is, talent, ability, and a certain witchcraft potential» (p. 36) e «83% of the adult males living in a compound are agnates» (p. 19); Lévi-Strauss 1945 su Word 1(1): l'articolo risulta ad accesso libero sul sito dell'editore.

Corretto: tolta l'attribuzione a Lounsbury 1964 (analisi non verificabile, opera non reperibile); Kroeber passa da «accesso da verificare» a PD con il link alla copia del JRAI, e la sua tesi è riportata con le sue parole al posto di un elenco di categorie inesatto; Lévi-Strauss 1945 passa a OA; gli «otto clan» diventano «otto gruppi che Morgan chiama tribù», perché le virgolette citavano un lessico che Morgan non usa; il termine per cugino non è più definito «aggiunta tarda» ma riportato come lo scrive Morgan; «sistema primitivo» diventa «forma originaria del sistema» e «dalla parte sbagliata della mappa» diventa «in un'altra casella della mappa». Nelle fonti del livello neofita di 07 e 09 i titoli italiani non verificati («Argonauti del Pacifico occidentale», «Parentela e matrimonio tra i Nuer») sono sostituiti dai titoli originali. 08 e 09 non hanno richiesto correzioni di contenuto.

Revisione batch C (10, 11, 12), 2026-09-22. Verificato sul testo: van Gennep 1909 (edizione UQAC recuperata da uno snapshot Wayback, il sito resta irraggiungibile) — «le mécanisme est toujours le même: arrêt, attente, passage, entrée, agrégation», «accepter un cadeau de quelqu'un, c'est se lier à lui», «elle ne dure que le temps de la digestion» con il capitano Lyon e gli Esquimaux ospiti per ventiquattro ore, «l'ancien rite d'agrégation est remplacé par des tributs… c'est le stade purement économique qui commence», «pénétrer, étant étranger, dans cet espace réservé, c'est commettre un sacrilège… comme pénétrer, étant profane, dans un bois sacré», «le fastidieux palabre africain», la sequenza stade préliminaire → marge → agrégation, la «maison commune» che aggrega «non pas à la société générale, mais à la société spéciale», «il flotte entre deux mondes», «ces rites spéciaux constituent rarement à eux seuls la cérémonie entière», «forts comme étant dans le monde sacré… les unes tuant, dévalisant, maltraitant l'étranger sans plus de procès», e il caso Thomson come esempio del «mécanisme direct et simple du rite d'agrégation de l'étranger»; Thomson 1885 (copia integrale, Internet Archive) — la cerimonia di Shira parola per parola (capra presa per un orecchio, dichiarazione di non praticare uchawi, promesse dell'ambasciatore, striscia di pelle infilata cinque volte sul dito, «the sultan of Shira and I were sworn brothers»), «only 150 men, when Fischer, with some 300… had had to fight», lo scontro «with the result of bloodshed on both sides», «I yet must make the attempt to pass the threshold»; Geertz 1973, cap. 15 (ricerca interna) — «malarial and diffident… about five hundred people» (p. 426), «a superorganism in the literal sense… cries of pulisi! pulisi!» (p. 428), «On the established anthropological principle, "When in Rome"» e il capo che si tuffa nel fiume (p. 429), «In Bali, to be teased is to be accepted… we were quite literally "in"» (p. 430), «it is only apparently cocks that are fighting there. Actually, it is men» (p. 431), il combattimento come «blood sacrifice offered… to the demons» (p. 434), «the migration of the Balinese status hierarchy into the body of the cockfight» e «to take another phrase from Erving Goffman, "a status bloodbath"» (p. 450), «Every people, the proverb has it, loves its own form of violence» (p. 463); Douglas 1966 (ricerca interna) — «Comparative religion has always been bedevilled by medical materialism» (p. 41), il termine coniato da William James e «most primitive peoples are medical materialists in an extended sense» (p. 44), Maimonide «confessed himself baffled by the prohibition on pork» (p. 43), «Where there is dirt there is system» (p. 47), «holiness is exemplified by completeness» (p. 65), «nothing whatever is said about its dirty scavenging habits» (p. 67), i Nuer del Sud Sudan e «to be driven to eating wild meat is the sign of a poor herdsman» (p. 66); Douglas 2002, prefazione all'edizione Routledge Classics — «this is the place to confess to a major mistake» (p. 15) e «I now question that they are abominable at all, and suggest rather that it is abominable to harm them» (p. 17).

Corretto: «senza tante formalità» diventa «senza tanti complimenti», che rende «sans plus de procès»; la frase sulla violenza in 11 è attribuita al proverbio che Geertz cita, non a Geertz; «quasi tutti i popoli» in 12 diventa «la maggior parte dei popoli», perché Douglas scrive «most primitive peoples». Per stare nel limite dei feedback sono cadute due citazioni secondarie in 11 (la formula sulle feste di tempio). Nessun altro intervento: le citazioni dei tre scenari hanno retto il confronto con i testi.

Revisione batch D (13, 14, 15), 2026-09-23. Verificato sul testo: il dibattito di Science 1887 sulle copie JSTOR Early Journal Content in Internet Archive — Boas del 20 maggio, «a people can be understood only by studying its productions as a whole», «the marked character of the North-west American tribes is almost lost, because the objects are scattered in different parts of the building», il sonaglio che «is not merely the outcome of the idea of making noise… it is, besides this, the outcome of religious conceptions», «the development of similar ethnological phenomena from unlike causes is far more probable»; Mason del 3 giugno, i suoi tre principi con «in human culture, as in nature elsewhere, like causes produce like effects», la disposizione «according to objects, not according to the tribes to whom they belong», la replica «will hardly meet with acceptance, in the face of the axiom that "like effects spring from like causes"» e l'invenzione «taught or loaned to peoples far removed in time and place»; Boas del 17 giugno, «classification is not explanation», i coltelli a mezzaluna eschimesi che «has given us great pleasure», «the tribal arrangement… is the only satisfactory one, as it represents the physical and ethnical surroundings», «civilization is not something absolute, but… relative, and… our ideas and conceptions are true only so far as our civilization goes», il rifiuto delle vetrine a scacchiera «in ethnology all is individuality», e l'indicazione di esporre «a full set of a representative of an ethnical group» con «slight peculiarities in small special sets», «without over-burdening the collection with duplicates»; Dall, «in ninety-nine museums out of a hundred, this would be impracticable»; Powell, «prairie-dogs, owls, and rattlesnakes… are not thereby classed as one group in systematic zoology», il museo tribale «an impossibility by reason of its magnitude» e le «art provinces of North America… of great interest». Evans-Pritchard 1940 (ricerca interna): «the daily timepiece is the cattle clock, the round of pastoral tasks», «the Nuer have no expression equivalent to "time" in our language… I do not think that they ever experience the same feeling of fighting against time», «structural time is a reflection of structural distance». Leathem 2023 risulta Open Access su AnthroSource.

Corretto: in 13 la frase «effetti simili non hanno cause simili» non è di Boas ed è sostituita dalla sua («fenomeni simili da cause diverse»); l'attribuzione a Mason di «le invenzioni nascono da invenzioni come la vita dalla vita» cade e lascia il posto al suo principio verificato; e soprattutto la frase sui doppioni come «unico mezzo per stabilire ciò che è caratteristico di una tribù» non solo non è nel testo ma capovolge ciò che Boas scrive, cioè che non serve sovraccaricare le vetrine di doppioni: è stata riscritta sul testo, e l'obiezione di Powell è riportata come lui la formula, sulla mole. In 14 le due voci con «accesso da verificare» diventano NON-OA, con l'indicazione che si leggono sulla copia archiviata del sito AAA. In 15 il riferimento perde i numeri di pagina, che valevano per una tiratura diversa da quella consultata. In 03, già validato, Leathem 2023 passa da «accesso da verificare» a OA e la sua descrizione è riscritta su ciò che l'articolo è davvero. Con questo nessuno scenario porta più l'etichetta «accesso da verificare».

Backlog M6 (consumo, con aggancio contemporaneo): tre scenari, uno per sessione. Scritto il primo il 2026-09-23, scenario_016 «Il gusto classifica chi classifica», sulla pista del gusto come distinzione: Bourdieu 1979, indagine per questionario condotta in Francia nel 1963 e nel 1967-68 su 1.217 persone, domanda 26 sui soggetti fotografabili; citazioni e numeri di pagina verificati con la ricerca interna di Internet Archive sulla traduzione di Richard Nice (Harvard University Press, 1984). Scritto il secondo il 2026-09-25, scenario_017 «Cinquecento bacinelle», sulla pista dei beni come sistema di classificazione: il quartiere hausa di Sabo a Ibadan nell'etnografia di Abner Cohen (1969, cap. 2, pp. 67-68, verificato sul suo testo con la ricerca interna) e la lettura che ne danno Douglas e Isherwood (1979, ristampa 1982, pp. 12, 57, 59 e 141-145, verificate ora che l'item è tornato raggiungibile). Nella stessa occasione è stato corretto scenario_016: il rinvio a Douglas e Isherwood era a p. 73, che è il numero del foglio della scansione, non della pagina; la pagina è 59, confermata dall'indice analitico («construction of categories of culture and, 59-62»).

Scritto il terzo lo stesso 2026-09-25, scenario_018 «Zucchero nel tè», sulla pista del gusto come prodotto storico: lo zucchero in Inghilterra tra il 1650 e il 1900 in Mintz 1985, da medicina e scultura da banchetto a quasi un quinto delle calorie della dieta inglese. Con questo il backlog M6 è chiuso: tre scenari, tre piste distinte (gusto come distinzione, beni come marcatori, merce e potere), nessuna sovrapposizione con 04, 05 e 12.

Altre piste, non usate: di Appadurai e Kopytoff 1986 non esiste copia in prestito digitale, solo un caricamento non autorizzato, e la pista «biografia sociale degli oggetti» non è verificabile con il metodo di §16.7; Miller 1987 (`materialculturem0000mill`) è verificato e citato nei `deepen` di 016 e 018, ma non ha dato un caso etnografico proprio. Veblen 1899 (`theoryofleisurec01vebl`, testo integrale) resta la voce di sfondo dei tre scenari.

## 14. Fonti e accesso

Repertori: DOAJ (riviste OA: Cultural Anthropology, Social Anthropology, JASO, Kinship), Open Anthropological Research (archivio OA), JSTOR (gratis American Anthropologist 1888-1930 e pre-1930), AnthroSource (solo articoli marcati OA; Miner 1956 e Codice etico AAA liberi), Open Encyclopedia of Anthropology (Cambridge, voci "Gifts", "Kinship", "Ritual").

Fonti primarie aperte individuate: Malinowski 1922 (Gutenberg #55822; Internet Archive), Malinowski 1926 e 1929 (Internet Archive; pubblico dominio in UE dal 2013, autore morto nel 1942, e negli USA dal 2022 e 2025), Miner 1956 (DOI 10.1525/aa.1956.58.3.02a00080), Bohannan 1966 e Lee 1969 (Natural History), Mauss 1925 (Classiques UQAC), Morgan 1871 (Internet Archive), van Gennep 1909, Boas 1887, AAA 2012.

Bibliografia della pagina "Metodo e fonti": un'opera entra solo se un feedback, una definizione o un `deepen` la cita. È generata dai contenuti (`src/engine/bibliography.ts`), non mantenuta a mano: con i diciotto scenari validati sono 68 voci, senza doppioni, ciascuna con lo stato di accesso e gli scenari che la citano. Nessuna voce resta con l'etichetta «accesso da verificare».

## 15. Specifica di sviluppo

### 15.1 Schema contenuti

Implementato in `src/schema/scenario.schema.ts`. Differenze rispetto alla v0.6: export di tipo `Lang`, `Level`, `ConceptId`; campo `url` opzionale in `Deepen` (2026-09-18), ammesso solo per URL ufficiali e verificati (editore, DOI, Project Gutenberg, archivio istituzionale come Classiques UQAC), mai copie su siti terzi. Campo `hook` opzionale in `LevelContent` (2026-09-22), massimo 400 caratteri, reso sopra il `setup` con l'etichetta «Oggi». Non modificare lo schema per aggirare un vincolo di contenuto: correggere il contenuto.

### 15.2 Viste

| Vista             | Percorso    | Contenuto                                                                                                                                                                                                                    | Stato                 |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Home / onboarding | `/`         | Nome, frase di presentazione, selettore livello con una riga di spiegazione, streak, pulsanti "Continua la sequenza" e "Scegli un tema"                                                                                      | **M3**: completa      |
| Scenario          | `/s/:id`    | Etichetta concetto, `hook` contemporaneo se presente, setup, 2-4 scelte. Dopo la scelta: feedback della scelta in evidenza, alternative sotto, fonte (collassata per neofita, aperta per studente), `deepen` (solo studente) | **M2**: loop completo |
| Libreria concetti | `/concetti` | Griglia dei 5 concetti con definizione; per ciascuno gli scenari con stato e livello di completamento                                                                                                                        | **M3**: fatta         |
| Metodo e fonti    | `/metodo`   | Provenienza, criteri, limiti, nota etica, dati e privacy, bibliografia generata dai contenuti                                                                                                                                | **M4**: fatta         |

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

| M   | Contenuto                                                                              | Fatto quando                                                                   | Stato                                                              |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| M1  | Scaffold, schema Zod, script di validazione, i18next, scenari 01-03                    | `pnpm validate` passa; `pnpm dev` renderizza scenario_001                      | **chiusa** 2026-09-16, commit `e88eddf`                            |
| M2  | Loop completo: setup → scelta → feedback su tutte le opzioni → prossimo                | I 3 scenari giocabili da cima a fondo in entrambi i livelli                    | **chiusa** 2026-09-18, merge `62fedef`                             |
| M3  | Toggle livello persistito, stato locale, streak, libreria concetti, barra persistente  | Chiudo e riapro il browser: livello, progressi e streak restano                | **chiusa** 2026-09-18, merge `44213eb`                             |
| M4  | Pagina Metodo, analytics, deploy Vercel                                                | URL pubblico; eventi in dashboard; CI verde (già attiva da M1)                 | **chiusa** 2026-09-18: https://anthropology-clash.vercel.app       |
| M5  | Scenari 04-15 scritti e validati                                                       | `pnpm validate` passa su 15 file                                               | **chiusa** 2026-09-23: 15 scenari validati sul testo (§16.6)       |
| M6  | Concetto `consumo`, campo `hook`, 3 scenari sul consumo che partono da un caso di oggi | I tre scenari giocabili in entrambi i livelli, fonti verificate                | **chiusa** 2026-09-25: 18 scenari, 68 voci in bibliografia (§16.9) |
| M7  | Aggancio contemporaneo (`hook`) negli scenari 01-15                                    | 18 scenari su 18 con `hook` in entrambi i livelli, validati insieme all'autore | **aperta** 2026-09-25 (§16.10)                                     |

## 16. Stato di avanzamento e piano operativo

### 16.1 Cosa esiste (aggiornato al 2026-09-25)

Fatto in M1, oltre a quanto previsto dalla v0.6:

- Repository GitHub pubblico creato e collegato; `gh` installato sulla macchina di sviluppo.
- CI GitHub Actions attiva (anticipata da M4 a M1: costa poco e protegge `main` da subito).
- `vercel.json` per il rewrite SPA, così il collegamento a Vercel in M4 è solo configurazione.
- Vincoli di contenuto aggiuntivi nello script di validazione (feedback orfani, id duplicati, numero scelte per livello), con test.
- ESLint `id-denylist` a tutela del principio "nessuna risposta sbagliata" anche nel codice.
- Test sul caricatore contenuti (`src/engine/content.test.ts`).
- README e questo documento.

Stato al 2026-09-25, dopo la chiusura di M6:

- 18 scenari in `src/content/it/scenarios/`, tutti validati sul testo delle fonti; 5 concetti in `concepts.json` (`consumo` aggiunto il 2026-09-22), ciascuno con almeno uno scenario giocabile.
- Schema con campo `hook` opzionale per l'aggancio contemporaneo; `pnpm validate` verifica anche che stia in entrambi i livelli o in nessuno.
- 33 test (engine, schema, script di validazione), lint e build verdi; CI verde su `main`.
- App in produzione su Vercel, pagina Metodo con 68 voci di bibliografia generate dai contenuti.
- Scroll in cima a ogni rotta, titolo del documento per pagina, focus visibile sull'intestazione del riscontro (2026-09-21); bordo del riscontro a 1px su tutti i lati dopo il rilievo del detector (2026-09-22).
- Autore dichiarato in README, manuale, `CLAUDE.md`, `package.json`, `index.html` e footer dell'app.

Fatto dopo M1 (2026-09-18):

- Identità visiva secondo §16.2 (commit `89d36a5`, `7c65a18`): token in `@theme`, Source Serif 4 / IBM Plex Sans / IBM Plex Mono da Google Fonts, tema chiaro e scuro.
- Toggle manuale del tema (`a77be13`): parte dal sistema, la scelta è salvata in `anthropology-clash.v1` tramite `src/engine/storage.ts` (lettura e scrittura in try/catch, base per la persistenza di M3) e applicata prima del primo render da uno script inline in `index.html`.
- M2, loop di gioco (`9285cd6`, merge `62fedef`): `FeedbackPanel`, `engine/sequence.ts` con test, navigazione tra scenari.
- Link ufficiali nei `deepen` e campo `url` nello schema (`965b16b`, `1e840bf`).
- M3, persistenza e libreria (`ab3eee1`, merge `44213eb`): stato locale completo, streak, `/concetti`, Home completa, barra con link, badge streak e selettore lingua.
- M4, codice (`13e2e70`, merge `419342c`): pagina `/metodo` con bibliografia generata, analytics Umami condizionale, `vercel.json` completo.

Non fatto, e volutamente: pre-commit hook (aperto). Licenza decisa il 2026-09-25 (§11).

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

### 16.5 M4 — pubblicazione (chiusa)

Fatto:

1. Pagina `/metodo`: provenienza, criteri di selezione, limiti dichiarati, nota etica, dati e privacy (testi in `it.json` sotto `method`). La bibliografia è generata da `src/engine/bibliography.ts`: unisce le voci di `source` (separate da "; ") e i `deepen` del livello studente, deduplica per autore + anno + prime tre parole del titolo, tiene la forma più completa, eredita accesso e link dai `deepen`, e collega ogni opera agli scenari che la citano. Con i contenuti attuali: 12 opere, 7 con link. Le opere citate solo nelle definizioni dei concetti (Sahlins 1972, Morgan 1871, van Gennep 1909, Turner 1969, Douglas 1966, Boas 1887) non compaiono finché uno scenario non le cita: la regola di §14 è applicata alla lettera.
2. Analytics: **Umami** (deciso il 2026-09-18, gratuito in cloud). `src/engine/analytics.ts` carica lo script solo se `VITE_UMAMI_SRC` e `VITE_UMAMI_WEBSITE_ID` sono definite in build. I valori vivono in `.env.production` nel repo (il Website ID è pubblico per natura: compare nell'HTML servito); Vite legge quel file solo in `pnpm build`, quindi in locale e in CI non parte nulla. Eventi: `level_chosen` (livello), `scenario_started` (scenario, livello), `scenario_completed` (scenario, livello, scelta); apertura e ritorno sono le pageview standard. `track` è in try/catch: l'analytics non può rompere l'app.
3. `vercel.json`: framework `vite`, `pnpm install --frozen-lockfile`, `pnpm build` (che esegue `pnpm validate` in `prebuild`), output `dist`, rewrite SPA. La versione di pnpm arriva dal campo `packageManager`.

Collegamento fatto il 2026-09-18: progetto Vercel importato dal repo, sito creato su Umami Cloud, id in `.env.production` (`e27e4db`). Verifica sull'URL pubblico: deep link `/s/scenario_002` ricaricato correttamente (rewrite SPA), scenario giocato in livello studente, progressi salvati, sette richieste a `gateway.umami.is/api/send` accettate (pageview, `level_chosen`, `scenario_started`, `scenario_completed`). Nessun errore in console.

Nota su Umami Cloud: piano gratuito con limite mensile di eventi; oltre, i dati del mese non vengono più raccolti. Sufficiente per l'MVP; da rivalutare se il traffico cresce.

### 16.6 M5 — contenuti (chiusa 2026-09-23)

Ordine: 04-08 e 10, 13, 14 (fonti PD/OA) prima; 09, 11, 12, 15 dopo la validazione congiunta sulle fonti NON-OA. Una branch per scenario, commit `content: aggiunge scenario_NNN (titolo)`, merge su `main`, `pnpm validate` verde. Stato "scritto" nella tabella di §13 significa: pubblicato, con le affermazioni tratte da fonti PD/OA verificate sul testo; le affermazioni tratte da fonti NON-OA (citate a memoria) restano da confermare insieme prima di considerare lo scenario definitivo. "Validato" arriva dopo quella conferma.

Procedura seguita per ogni scenario, da mantenere:

1. Scaricare o consultare il testo della fonte primaria (Internet Archive, Classiques UQAC, Papers Past, DOI) e verificare ogni citazione e ogni affermazione attribuita all'autore. Se una fonte non è raggiungibile, non attribuirle frasi testuali.
2. Neofita: 2 scelte, setup 300-600 caratteri, feedback fino a 800, fonte breve. Studente: 4 scelte, setup fino a 1200, feedback fino a 800 con autori e anni, `source` con tutte le opere citate nei feedback (così entrano in bibliografia), `deepen` con 4 letture, `url` solo ufficiale e verificato.
3. Non usare la stessa data due volte nello stesso riferimento (per esempio "Report for 1895, 1897"): la bibliografia deduplica sull'ultimo anno citato.
4. Verificare nel browser: entrambi i livelli, pagina Concetti, pagina Metodo (nessuna voce doppia in bibliografia).
5. Nel riepilogo al termine, elencare separatamente ciò che è verificato sul testo e ciò che è citato a memoria da fonti NON-OA.

Scritti al 2026-09-18: 04 potlatch (Boas 1897 e Mauss 1925 verificati; Codere 1950, Drucker & Heizer 1967, Cole & Chaikin 1990 da confermare), 05 hau (Mauss 1925 verificato; Sahlins 1972, Lévi-Strauss 1950, Firth 1929 da confermare; manca l'URL di Best 1909 su Papers Past), 06 terminologia seneca (Morgan 1871 verificato; Kroeber 1909, Murdock 1949, Lounsbury 1964, Trautmann 1987 da confermare), 07 eredità trobriandese (Malinowski 1922, 1926 e 1929 verificati sul testo: caso di Namwana Guya'u, pokala, matrimonio tra cugini incrociati; Lévi-Strauss 1945 e Weiner 1988 da confermare; Gutenberg non raggiungibile dalla sessione, testi letti su Internet Archive; DOI di Lévi-Strauss 1945 verificato su Crossref, accesso da verificare). 08 Amleto tra i Tiv (Bohannan 1966 verificato sul testo integrale del sito di Natural History, URL ufficiale in bibliografia; Bohannan 1952 e Sahlins 1961 con DOI verificati su Crossref ma contenuto citato a memoria; Bohannan & Bohannan 1953, Bohannan 1958, Radcliffe-Brown 1950 da confermare). 10 La soglia (van Gennep 1909, cap. II-III, verificato sul testo UQAC recuperato da uno snapshot Wayback perché il sito era irraggiungibile dalla sessione; Thomson 1885, pp. 157-159, verificato su Internet Archive; Turner 1967 e 1969 citati a memoria). 13 Ordinare il museo (l'intero dibattito di Science 1887, Boas 20 maggio, Mason 3 giugno, Dall e Boas 17 giugno, Powell e Boas 24 giugno, verificato sulle copie JSTOR Early Journal Content in Internet Archive, link JSTOR gratuiti; Boas 1896 con DOI verificato su Crossref, contenuto citato a memoria; Jacknis 1985 da confermare). 14 Non pubblicarlo (AAA 2012 verificato sul PDF ufficiale, link in bibliografia; il caso è il n. 22 "Forbidden Knowledge" del Handbook on Ethical Issues in Anthropology, Cassell & Jacobs 1987, con i commenti di Lurie e Basso, letto sulla copia Wayback delle pagine che l'AAA pubblicava online fino al 2010, oggi il manuale è in vendita: accesso da verificare; AAA 1971 letto sulla stessa via; Fluehr-Lobban 2003 da confermare). Con 14 si chiude il blocco PD/OA.

Scritti al 2026-09-19 (fonti NON-OA): 09 Sposare un fantasma (Evans-Pritchard 1951, cap. III, pp. 108-124 e 148-154), 11 Il combattimento di galli (Geertz 1972, che si è rivelato ad accesso aperto su JSTOR nel fascicolo di Daedalus 101(1): link ufficiale in bibliografia; testo verificato sull'edizione 1973), 12 L'animale abominevole (Douglas 1966, cap. 2-3, pp. 29-57; Douglas 1972 "Deciphering a Meal" anch'esso OA su JSTOR), 15 Il tempo delle mucche (Evans-Pritchard 1940, cap. I e III). Metodo di verifica per i libri sotto diritti: la funzione "cerca all'interno" di Internet Archive sulle copie in prestito digitale restituisce i paragrafi che contengono la frase cercata, con il numero di pagina; ogni citazione tra virgolette è stata confrontata così, senza scaricare i testi. Il 2026-09-19 sono state verificate con lo stesso metodo anche le letture secondarie citate negli scenari 07-15 (Lévi-Strauss 1945 sull'edizione 1958, Weiner 1988, Bohannan 1958 e 1953, Sahlins 1961, Radcliffe-Brown 1950, Turner 1967 e 1969, Boas 1896 su JSTOR Early Journal Content, Jacknis 1985, Fluehr-Lobban 2003, Gough 1971, Hutchinson 1996, Roseberry 1982, Crapanzano 1986, Leach 1964, Thompson 1967); le affermazioni non confermabili sul testo sono state tolte o ridotte al titolo (Bohannan 1952, Douglas 1972) e Munn 1992 è stata eliminata. Douglas 1993 è sostituita dalla prefazione del 2002 all'edizione Routledge Classics, dove la correzione è verificata. Regola da qui in poi: nessuna affermazione senza riscontro sul testo; ciò che non si conferma non si scrive. M5 si chiude con la conferma di queste letture e la revisione dei quindici scenari sul testo.

Chiusura, 2026-09-23. I quindici scenari sono passati uno per uno dalla rilettura in quattro lotti (01/04/05, 06-09, 10-12, 13-15): ogni citazione e ogni affermazione attribuita a un autore è stata ricontrollata alla fonte, non riletta. Il metodo è quello di §16.7: testo integrale dove è pubblico dominio o ad accesso aperto, ricerca interna di Internet Archive dove il libro è sotto diritti. Ciò che non ha retto il confronto è stato tolto o riscritto sul testo: undici interventi in tutto, elencati nelle note dei quattro lotti qui sopra. Nessuno scenario porta più l'etichetta «accesso da verificare»; la pagina Metodo genera 62 voci di bibliografia senza doppioni. Restano fuori dal perimetro di M5 i punti aperti di §11: licenza del codice e dei contenuti (decisa poi il 2026-09-25), nome, dominio, copy del kicker.

### 16.7 Decisioni prese durante M1

| Data       | Decisione                                                                                                                                                                                                                   | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-16 | Zod 4 invece di 3                                                                                                                                                                                                           | La sintassi di §15.1 è nativa in v4; nessun beneficio a restare su v3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-09-16 | Vite pinnato a 6.x, Vitest 3, plugin-react 5                                                                                                                                                                                | Coerenza con il documento; Vitest 5 richiede Vite 7+                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-09-16 | pnpm 12 con `pnpm-workspace.yaml` → `allowBuilds: esbuild`                                                                                                                                                                  | pnpm 12 blocca gli script postinstall; senza, Vite non parte in CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-09-16 | Prettier esclude `src/content` e `CLAUDE.md`                                                                                                                                                                                | Il primo `--write` aveva riformattato scenario_001.json; i contenuti non si toccano                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-09-16 | CI e `vercel.json` anticipati a M1                                                                                                                                                                                          | Costo minimo, protezione di `main` immediata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-09-16 | Regole "2 scelte neofita / 3-4 studente" nello script, non nello schema                                                                                                                                                     | Lo schema resta identico a §15.1; il vincolo è editoriale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-09-16 | Repository pubblico                                                                                                                                                                                                         | Coerente con app gratuita; Vercel e Plausible/Umami senza limiti                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-09-18 | Umami invece di Plausible                                                                                                                                                                                                   | Gratuito in cloud per l'MVP, senza cookie come richiesto; Plausible resta possibile cambiando due variabili d'ambiente                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-09-18 | Bibliografia generata dai contenuti, non mantenuta a mano                                                                                                                                                                   | Un'opera compare solo se uno scenario la cita (§14); nessun rischio di elenco disallineato con i JSON                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-09-18 | Barra su due righe (nome e controlli; navigazione e streak)                                                                                                                                                                 | Con Concetti, Metodo, streak, livello, lingua e tema una riga sola non entra in 640px                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-09-18 | Stato applicativo in `src/state/` (context React), fuori da `engine/`                                                                                                                                                       | `engine/` resta logica pura e testabile senza React; il context è l'unico punto che tocca lo storage                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-09-18 | `url` opzionale nei `deepen`; etichette di accesso uniformi, `NON-OA` reso come "Sotto diritti d'autore"                                                                                                                    | Richiesta esplicita. Link inseriti solo dopo verifica (Crossref per i DOI: due DOI ricordati a memoria erano sbagliati). Lee 1969 resta senza link: nessun URL ufficiale dell'editore trovato                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-09-18 | Tema chiaro/scuro con toggle manuale, persistito da subito                                                                                                                                                                  | Richiesta esplicita; senza persistenza il toggle si azzererebbe a ogni apertura. `storage.ts` nasce ora e M3 lo estende                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-09-18 | Argilla `#A3532A` invece di un terracotta più acceso                                                                                                                                                                        | Sotto 4.5:1 sull'avorio per il testo piccolo; il colore resta caldo ma leggibile                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-09-16 | Repository GitHub ricreato e riallineato alla storia locale (`659dfab`)                                                                                                                                                     | Il primo repo era stato ripopolato via upload web (CRLF, senza `.github/workflows/ci.yml`); la storia locale è quella di riferimento, gli hash precedenti alla ricreazione non valgono più                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-09-18 | Van Gennep 1909 etichettato PD (fr) con link a Classiques UQAC                                                                                                                                                              | Van Gennep è morto nel 1957: in UE il testo entra in pubblico dominio nel 2028, in Canada (UQAC) e negli USA lo è già. Stessa scelta fatta per Mauss; nei feedback solo citazioni brevi tradotte                                                                                                                                                                                                                                                                                                                                                               |
| 2026-09-19 | Fonti NON-OA verificate con la ricerca interna di Internet Archive                                                                                                                                                          | Le copie in prestito digitale non si scaricano, ma la ricerca restituisce i paragrafi con la frase cercata e la pagina: basta per confermare ogni citazione senza riprodurre il testo. Nessun link a quelle copie, solo a DOI ed edizioni ufficiali                                                                                                                                                                                                                                                                                                            |
| 2026-09-19 | Autore dichiarato in ogni documento: Alberto Alioto (AlbeAli)                                                                                                                                                               | README, manuale, `CLAUDE.md`, `package.json`, `index.html` (meta author) e footer dell'app indicano l'autore; il backup locale `refs/original` di filter-branch, ultimo residuo dei trailer `Co-Authored-By`, è stato eliminato; su GitHub l'unico contributor è AlbeAli                                                                                                                                                                                                                                                                                       |
| 2026-09-21 | Scroll in cima a ogni cambio di rotta, titolo del documento per pagina, ring di focus sull'intestazione del riscontro                                                                                                       | Proposte esterne (analisi del 2026-09-21) accettate: in una SPA il passaggio allo scenario successivo lasciava la pagina in fondo; la scheda del browser mostrava sempre solo il nome dell'app; l'`<h2>` del riscontro riceve focus programmatico e `outline-none` lo rendeva invisibile da tastiera. Tutto in `App.tsx` (una `useEffect` per rotta, titolo da `t("app.name")`) e `FeedbackPanel.tsx`; nessun hook o cartella nuova                                                                                                                            |
| 2026-09-21 | Respinte: `previousDay` a mezzogiorno, `refKey` senza virgola, `role="radiogroup"` sul toggle di livello, `en.json` tradotto, selettore lingua attivo, scenario_001 in inglese, condivisione per scenario, `StorageAdapter` | Nessun bug reale nei primi due (`dayKey` usa la data locale; ogni riferimento ha la virgola e `validate-content` lo impone); un radiogroup senza navigazione a frecce è una regressione ARIA; le traduzioni violano "non tradurre in inglese per iniziativa propria" e con 1 scenario su 15 l'esperienza sarebbe mista; gli ultimi due sono fuori scope MVP (§6, §7)                                                                                                                                                                                           |
| 2026-09-22 | Quinto concetto: `consumo` (label «Consumo e cultura materiale»)                                                                                                                                                            | Richiesta dell'autore. Costo tecnico minimo perché engine, libreria e validazione iterano sulla tassonomia: enum, voce in `concepts.json`, un test. Nessuna migrazione di `localStorage`: `sanitize` non valida `seenConcepts` contro l'enum, `STORAGE_VERSION` resta 1. Definizione ancorata a due fonti verificate sul testo: Veblen 1899 (cap. II e IV, copia integrale `theoryofleisurec01vebl` su Internet Archive) e Douglas & Isherwood 1979 (p. 73 della ristampa 1982, ricerca interna)                                                               |
| 2026-09-22 | Campo `hook` opzionale invece di un tipo di scenario separato                                                                                                                                                               | Per far partire uno scenario da una situazione di oggi bastano 400 caratteri sopra il `setup`: retrocompatibile (i 15 scenari restano validi senza modifiche), ~40 righe tra schema, `ScenarioCard`, locale, validazione e test. Un `era`/tipo separato avrebbe richiesto filtri in libreria e home, ordinamento della sequenza e circa 150 righe, senza un beneficio dimostrato prima di avere i contenuti                                                                                                                                                    |
| 2026-09-25 | L'offset foglio-pagina non si assume costante: si verifica su più punti del libro                                                                                                                                           | In Mintz 1985 cambia tre volte (36, 42, 48) per le dodici pagine di tavole fuori testo non numerate: un unico controllo avrebbe dato pagine sbagliate per metà del libro. Dove le intestazioni correnti non coprono il passo (le «subtleties»), la citazione resta al capitolo senza numero di pagina                                                                                                                                                                                                                                                          |
| 2026-09-25 | Nelle citazioni da copie in prestito di Internet Archive il numero di pagina si ricava e si controlla, non si prende dal lettore                                                                                            | Il campo `page` che la ricerca interna restituisce è il foglio della scansione, non la pagina del libro: in `scenario_016` era finito «p. 73» al posto di «p. 59». Da qui in poi l'offset foglio-pagina si calcola su una voce dell'indice o del sommario e si controlla su una seconda (per Cohen 1969 l'indice dà «Bowls, Ornamental, 67-8»)                                                                                                                                                                                                                 |
| 2026-09-23 | `scenario_016` su Bourdieu 1979, con i numeri di pagina della traduzione di Richard Nice (Harvard University Press, 1984)                                                                                                   | È una indagine per questionario, non un'etnografia sul campo: scelta accettata dall'autore perché le due piste etnografiche previste non erano verificabili quel giorno (item `worldofgoods00doug` in errore, nessuna copia in prestito di Appadurai 1986) e perché il gusto come distinzione è terreno diverso da 04, 05 e 12. Le citazioni esistono solo in traduzione nella copia consultata; la corrispondenza foglio-pagina è controllata su due voci dell'indice (cap. 1 a p. 11, cap. 3 a p. 169), quindi i numeri di pagina valgono per quell'edizione |
| 2026-09-22 | Il `hook` non è un caso di studio                                                                                                                                                                                           | La regola "ogni scenario ha una fonte reale" resterebbe aggirabile da un aggancio inventato. Il `hook` è un'illustrazione in seconda persona senza affermazioni fattuali su gruppi, quantità o persone; se la situazione contemporanea è etnografata si cita l'opera in `source` e la si verifica sul testo. Il carico della dimostrazione resta su `setup` e feedback                                                                                                                                                                                         |

### 16.8 Regola di sincronizzazione dei documenti

- `docs/manuale-funzionale.md` è l'unica versione viva. Si aggiorna con commit `docs:` a ogni decisione, cambio di scope o chiusura di milestone.
- `CLAUDE.md` riassume le regole vincolanti per chi scrive codice e contenuti; deriva dal manuale e non lo sostituisce.

### 16.9 M6 — antropologia del consumo e aggancio contemporaneo (aperta 2026-09-22, chiusa 2026-09-25)

Obiettivo: un quinto concetto giocabile e un modo dichiarato di entrare negli scenari partendo da una situazione di oggi per risalire alle origini del concetto.

Fatto:

1. Concetto `consumo` nella tassonomia (`ConceptId`, `concepts.json`, test), label «Consumo e cultura materiale». Definizione da fonti verificate sul testo: Veblen 1899 e Douglas & Isherwood 1979.
2. Campo `hook` opzionale in `LevelContent`, massimo 400 caratteri, reso sopra il `setup` con l'etichetta «Oggi» (`scenario.hook` nei locales). `pnpm validate` impone la presenza in entrambi i livelli o in nessuno; due test nello schema e due nello script di validazione.
3. Primo dei tre scenari, `scenario_016` «Il gusto classifica chi classifica» (2026-09-23): Bourdieu 1979, con `hook` in entrambi i livelli, quattro scelte nel livello studente che riprendono le due letture che Bourdieu stesso scarta (la necessità economica e il gusto di libertà) e quattro `deepen` verificati. `pnpm validate` verde su 16 file, bibliografia a 66 voci senza doppioni. Corretta nello stesso passaggio la copia della libreria e dei limiti, rimasta a «quattro concetti» dopo l'aggiunta di `consumo`.
4. Secondo scenario, `scenario_017` «Cinquecento bacinelle» (2026-09-25): il caso etnografico è il quartiere hausa di Sabo a Ibadan in Cohen 1969, verificato sul suo testo, e la cornice è quella di Douglas e Isherwood 1979; quattro scelte nel livello studente, di cui tre sono letture che i due testi discutono e ridimensionano (accumulo irrazionale, consumo vistoso, riserva di valore). `pnpm validate` verde su 17 file, bibliografia a 67 voci senza doppioni. Corretto nello stesso passaggio il rinvio di `scenario_016` a Douglas e Isherwood: p. 59, non p. 73.
5. Terzo scenario, `scenario_018` «Zucchero nel tè» (2026-09-25): Mintz 1985 sullo zucchero in Inghilterra tra il 1650 e il 1900, verificato sul testo; quattro scelte nel livello studente che ripercorrono le spiegazioni che Mintz discute e ridimensiona (predisposizione biologica, prezzo, emulazione) prima della sua. I numeri di pagina sono stati ricavati dalle intestazioni correnti perché in quella copia l'offset foglio-pagina cambia tre volte (36, 42, 48) per le tavole fuori testo non numerate.

Da fare, nell'ordine:

3. Chiudere M5 (rilettura degli scenari 04-15, §16.6): fatto il 2026-09-23.
4. Tre scenari sul consumo, uno per sessione, con la procedura di §16.6 invariata: fonte primaria letta, ogni citazione confrontata sul testo, `deepen` con sole letture verificate. Ciascuno si apre con un `hook` contemporaneo e risale al caso di studio. Scritti `scenario_016` il 2026-09-23 e `scenario_017` il 2026-09-25; ne resta uno, e la scelta della pista dipende da quali fonti risultano raggiungibili (§13).
5. Verifica nel browser di entrambi i livelli, della libreria (il concetto non deve più risultare vuoto) e della pagina Metodo (bibliografia senza doppioni).

Criterio di chiusura: i tre scenari giocabili in entrambi i livelli, `pnpm validate` verde su 18 file, nessuna affermazione priva di riscontro sul testo.

Chiusura, 2026-09-25. I tre scenari sul consumo sono in `main` e giocabili in entrambi i livelli: 016 il gusto come distinzione (Bourdieu 1979), 017 i beni come marcatori (Cohen 1969 con Douglas e Isherwood 1979), 018 la merce e il potere (Mintz 1985). `pnpm validate` passa su 18 file, i 33 test e il lint sono verdi, la pagina Metodo genera 68 voci senza doppioni e il concetto `consumo` non risulta più vuoto nella libreria. Ogni citazione è stata confrontata sul testo delle fonti con il metodo di §16.7; due errori sono stati corretti in corso d'opera, il rinvio a p. 73 in 016 e la copia «quattro concetti» rimasta nella libreria.

Limite dichiarato di `scenario_016`: la fonte è un'indagine per questionario, non un'etnografia sul campo. La scelta è stata presa con l'autore il 2026-09-23, dopo aver constatato che le due piste etnografiche previste non erano verificabili in quella sessione (§13); le due restanti tornano su fonti etnografiche.

Rischio noto: il consumo tocca terreno già coperto da 04 (distruzione ostentata), 05 (hau) e 12 (cibo e classificazione). I nuovi scenari vanno su terreno diverso, per esempio i beni come sistema di classificazione, la biografia sociale degli oggetti, il gusto come distinzione; la scelta si fa quando la fonte è stata letta, non prima.

### 16.10 M7 — ogni scenario parte dalla vita di oggi (aperta 2026-09-25)

Direzione di prodotto decisa con l'autore il 2026-09-25: le scelte etnografiche restano sempre collegate alla vita reale di chi gioca. Il kicker della Home diventa «Dilemmi dal campo, domande di oggi» e M7 mantiene la promessa su tutti gli scenari: i quindici scenari di M1-M5 ricevono il `hook` che finora avevano solo 016-018.

Regole, invariate rispetto a M6 e a `CLAUDE.md`: seconda persona; nessuna affermazione fattuale su gruppi, quantità o persone; massimo 400 caratteri; in entrambi i livelli o in nessuno; l'aggancio non anticipa la lettura che lo scenario fa scoprire (vale soprattutto per 03, dove l'aggancio non deve rivelare chi sono i Nacirema).

Procedura: lotti di tre scenari, bozze proposte all'autore e riviste insieme prima del commit, un commit `content:` per lotto. Lotti: 01-03, 04-06, 07-09, 10-12, 13-15.

Criterio di chiusura: 18 scenari su 18 con `hook` in entrambi i livelli, `pnpm validate` verde, verifica nel browser della resa di «Oggi» su un lotto per livello.
