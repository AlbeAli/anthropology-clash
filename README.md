# Anthropology Clash

Web app che insegna concetti antropologici tramite scenari a bivio ispirati a casi etnografici reali. Nome provvisorio.

Online: https://anthropology-clash.vercel.app

Ogni scenario esiste in due livelli, `neofita` e `studente`, sullo stesso caso. Nessuna risposta è "sbagliata": il feedback descrive la conseguenza di una scelta nel suo contesto culturale, con la fonte.

- Documento funzionale e piano operativo: [docs/manuale-funzionale.md](docs/manuale-funzionale.md)
- Regole per chi contribuisce (umani e agenti): [CLAUDE.md](CLAUDE.md)

## Avvio

Requisiti: Node 22 o 24 (vedi `.nvmrc`), pnpm.

```bash
pnpm install
pnpm dev
```

## Comandi

| Comando         | Cosa fa                                                   |
| --------------- | --------------------------------------------------------- |
| `pnpm dev`      | dev server Vite                                           |
| `pnpm build`    | valida i contenuti, poi build statica in `dist/`          |
| `pnpm validate` | valida tutti i JSON in `src/content` contro lo schema Zod |
| `pnpm test`     | Vitest su engine, schema e script di validazione          |
| `pnpm lint`     | ESLint + Prettier check                                   |

La CI (GitHub Actions) esegue `lint → validate → test → build` su ogni push e pull request.

## Contenuti

Uno scenario per file in `src/content/it/scenarios/scenario_NNN.json`, nome file uguale all'`id`. Lo schema è in `src/schema/scenario.schema.ts`; i vincoli aggiuntivi (fonte con autore e anno, `deepen` obbligatorio nel livello studente, 2 scelte per neofita e 3-4 per studente) sono in `scripts/validate-content.ts`.

Ogni scenario ha una fonte etnografica reale e verificabile. Le fonti e i criteri sono documentati nella pagina "Metodo e fonti" dell'app e nel documento funzionale.
