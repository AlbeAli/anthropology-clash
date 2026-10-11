---
name: fermata-merge
description: Dopo l'approvazione dell'autore, fa il merge della branch corrente di anthropology-clash su main, push e controllo CI. Uso - /fermata-merge.
---

Solo dopo l'ok esplicito dell'autore nella conversazione.

1. `git branch --show-current` (branch da mergiare, non `main`), albero pulito, tutto pushato. `pnpm gate` con codice 0.
2. `git checkout main && git pull --ff-only && git merge --no-ff <branch> -m "Merge branch '<branch>': <descrizione>"`. Controlla che il messaggio non contenga `Co-Authored-By` (`git log -1 --format=%B | grep -ci co-authored` deve dare 0).
3. `git push origin main`, poi `gh run list --limit 1` e `gh run watch <id> --exit-status`; riferisci il codice di uscita.
4. Aggiorna la memoria `stato-30-fermate` (scenari su main, fermate che restano, ultimo merge) e il manuale se serve.
5. Chiusura: fermate restanti, effort e modello consigliati.

Risposte in modalità caveman ultra.
