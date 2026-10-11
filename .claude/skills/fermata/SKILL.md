---
name: fermata
description: Scrive una nuova fermata (scenario) di anthropology-clash per un concetto dato, con fonte verificata sul testo, e si ferma alla bozza per l'approvazione dell'autore. Uso - /fermata <concetto> [fonte o idea].
---

Argomento: concetto (`reciprocita`, `parentela`, `relativismo`, `consumo`, `rituale`) ed eventuale fonte indicata. Regole di contenuto: `CLAUDE.md` del progetto (sezione Contenuti), memoria `scenario-workflow` e `no-unverified-claims`.

1. **Stato.** `git status`, branch `main` aggiornato; `ls src/content/it/scenarios | tail -1` per il numero NNN successivo. Crea la branch `scenario-NNN`.
2. **Fonte.** Se non indicata, lancia l'agente `scout-fonti` (model sonnet) e scegli il candidato con accesso verificato. Altrimenti passa direttamente al testo. Niente Chrome: `node scripts/ia-inside.mjs <id-item> --scarto N "<regex>"` scarica i paragrafi in `.ia-cache/<id>/testo.txt`; leggi con Grep/Read mirati. Lo scarto foglio-pagina si ricava da due testate correnti lontane. Opere PD: `_djvu.txt` con curl o Wayback. Chrome solo se lo script è bloccato e dopo averlo detto all'utente.
3. **Bozza.** Modello: l'ultimo scenario dello stesso concetto come template. `hook` in entrambi i livelli o in nessuno (seconda persona, nessuna affermazione fattuale), 2 scelte neofita, 3-4 studente, feedback su tutte le uscite e max 800 caratteri, `source` con autore, anno, editore e pagine, `deepen` 3-4 voci, `discuss` 2-3 domande chiuse da `?`. Nessuna uscita "giusta". Ogni cifra, nome e citazione è stata letta nel testo; dove l'OCR è guasto, parafrasare solo ciò che si legge.
4. **Verifica indipendente.** Lancia `verificatore-citazioni` (model sonnet) su `scenario_NNN.json` con l'id dell'item; correggi ogni riga non `OK`.
5. **Gate.** `pnpm gate` (lint, validate, test, e2e con codici di uscita). Mai in pipe con `tail`.
6. **Manuale.** Aggiungi la voce in `docs/manuale-funzionale.md` §16 (elenco numerato dopo l'ultima fermata): fonte, pagine, scarto, limiti, conteggio scenari, fermate che restano.
7. **Commit e push.** `content: aggiunge scenario_NNN (titolo)`, nessun trailer `Co-Authored-By`. Push della branch. **Stop**: riassumi in poche righe e chiedi l'approvazione dell'autore. Non fare merge.
8. Chiusura messaggio: effort e modello consigliati per il passo successivo.

Risposte in modalità caveman ultra; i testi dello scenario, del manuale e dei commit restano in prosa normale.
