---
name: Anthropology Clash
description: Scenari a bivio da casi etnografici reali, disegnati come una rete metropolitana.
colors:
  ground: "#ffffff"
  surface: "#f2f2f0"
  ink: "#1a1a1a"
  ink-soft: "#55554f"
  rule: "#d9d9d6"
  panel: "#1a1a1a"
  focus: "#0065b3"
  line-dono: "#e2231a"
  line-parentela: "#0065b3"
  line-rituale: "#008c44"
  line-relativismo: "#f7a600"
  line-consumo: "#7b3f98"
  lamp: "#ffd54a"
  ground-dark: "#121212"
  surface-dark: "#1e1e1d"
  ink-dark: "#f2f2ee"
  ink-soft-dark: "#b5b4ad"
  rule-dark: "#3a3a36"
  panel-dark: "#000000"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  gutter: "16px"
  gutter-wide: "24px"
  leg: "34px"
  section: "40px"
components:
  line-bullet:
    backgroundColor: "{colors.line-rituale}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
    size: "44px"
  line-bullet-relativismo:
    backgroundColor: "{colors.line-relativismo}"
    textColor: "{colors.ink}"
  station-sign:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ground}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  departure-board:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.sm}"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "48px"
  exit:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  exit-chosen:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
---

# Design System: Anthropology Clash

## Overview

**Creative North Star: "Le linee della metro"**

L'app è una rete metropolitana. Ogni concetto antropologico è una linea con il suo colore, ogni scenario una fermata, e ogni viaggio parte da una situazione di oggi («Oggi») per arrivare sul campo etnografico. La mappa dice dove sei e dove non sei ancora stato; il cartello nero dice in quale fermata ti trovi; il tabellone annuncia la prossima partenza. Niente punteggi: l'avanzamento si legge in fermate visitate.

Il registro è quello della segnaletica dei trasporti: fondo bianco, inchiostro quasi nero, colori pieni riservati alle linee, caratteri grandi e leggibili anche proiettati in aula. La densità è bassa nella lettura (una colonna, righe da 60-65 caratteri) e alta solo nella mappa.

Rifiutati in modo esplicito: la griglia di card con barre di avanzamento dell'app educativa standard, il verde e il rosso come giudizio sulle scelte, l'avorio e il serif editoriale dell'identità precedente.

**Key Characteristics:**

- Colore = identità della linea, cioè del concetto; mai un esito.
- Segnaletica (Archivo 800) per nomi, titoli ed etichette; Atkinson Hyperlegible per leggere.
- Pannelli neri per ciò che orienta: cartello di fermata, tabellone, biglietto.
- Movimento che racconta il viaggio (rotaie che si disegnano, treno che arriva, tabellone a palette), sempre spento con `prefers-reduced-motion`.

## Colors

Neutri netti più cinque colori di linea a piena saturazione.

- **Fondo** `#ffffff`, **superficie** `#f2f2f0` per pannelli chiari e uscite, **inchiostro** `#1a1a1a`, **inchiostro tenue** `#55554f` per testo secondario, **filetto** `#d9d9d6`.
- **Pannello** `#1a1a1a`: cartelli, tabellone, biglietto. Nel tema scuro diventa `#000000` con un bordo `#ffffff26` per staccarsi dal fondo `#121212`.
- **Linee**: Dono `#e2231a`, Parentela `#0065b3`, Rituale `#008c44`, Relativismo `#f7a600` (con testo scuro), Consumo `#7b3f98`. Riempiono simboli, rotaie, barre e il fondo leggero dell'uscita scelta; non colorano mai testo lungo.
- **Lampada** `#ffd54a`: solo i fari del treno e l'etichetta «Oggi» nell'anteprima.
- **Fuoco** `#0065b3` (scuro `#5aa9f0`): anello di 3 px su ogni elemento interattivo.

## Typography

- **Display** Archivo 800, fino a 3,75 rem, interlinea 1,02, tracking −0,025 em: titolo della Home, cartello di fermata, titoli di pagina.
- **Headline** Archivo 800, 1,5 rem: nomi delle linee, titoli di sezione.
- **Label** Archivo 700, 0,875 rem: etichette delle tappe, conteggi, pulsanti. Il tabellone usa Archivo 800 maiuscolo in celle scure.
- **Body** Atkinson Hyperlegible 400, 1,125 rem, interlinea 1,6: aggancio, setup, esiti, fonti. Scelta per la leggibilità a distanza e su telefono.
- Titoli con `text-wrap: balance`, paragrafi con `text-pretty` e misura massima 62-65 ch.

## Layout

- Contenitore largo fino a 1152 px per la Home, 768 px per lo scenario, 672 px per Concetti, Metodo e Viaggio. Gutter 16 px su telefono, 24 px da 640 px.
- Mappa: una colonna sotto 480 px, due fino a 768, tre fino a 1024, cinque oltre. Da 1024 px le linee condividono le righe della griglia (subgrid), così intestazioni e fermate restano allineate anche quando i testi vanno a capo.
- Scenario: percorso verticale a tappe con rotaia a sinistra (44 px di rientro su telefono, 58 px da 640 px); 34 px tra una tappa e l'altra.
- Barra: una riga su desktop; su telefono due righe (nome, serie e tema; poi navigazione).
- Nessuno scroll orizzontale a nessuna larghezza, verificato dai test end-to-end.

## Elevation & Depth

Piatto. La profondità viene dal contrasto tra pannelli neri e fondo bianco, non dalle ombre. Uniche ombre: l'anteprima «Oggi» e il treno sulla mappa, entrambe morbide e con offset verticale.

## Shapes

Raggi piccoli e regolari: 6 px per pulsanti, 8 px per i simboli di linea, 12 px per cartelli, uscite ed esiti, 16 px per il biglietto, pillola per chip e filtri. Fermate come cerchi con anello d'inchiostro di 4 px: vuoto da visitare, pieno visitato, colore della linea con impulso per «sei qui». Rotaie da 8 px con estremità arrotondate.

## Components

- **Simbolo di linea**: quadrato di 44 px (28 px piccolo) nel colore della linea con la lettera in Archivo 800.
- **Tabellone delle partenze**: pannello nero, titolo a palette che si assesta lettera per lettera, spia «In partenza» che lampeggia, pulsante bianco «Parti», barra del colore di linea in basso.
- **Mappa**: una colonna per linea con rotaia che si disegna dall'alto, fermate che entrano in sequenza, treno che scende sulla fermata «sei qui», anteprima «Oggi» al passaggio del mouse.
- **Striscia di linea**: le fermate della linea in orizzontale, treno che arriva dalla fermata precedente, nomi come link.
- **Cartello di fermata**: pannello nero con simbolo, «Linea · fermata · concetto», titolo in display e barra di colore che si allunga.
- **Uscita**: pulsante numerato su superficie grigia; al passaggio si sposta di 4 px e mostra la freccia; scelta, prende bordo d'inchiostro e un fondo leggero del colore di linea. Le altre restano leggibili e mostrano comunque il loro esito.
- **Esito**: riquadro con bordo d'inchiostro per l'uscita scelta, filetto grigio per le altre, sempre tutti visibili.
- **Timbro «Fermata visitata»**: bordo nel colore di linea, ruotato di −6°, entra con uno scatto di scala.
- **Biglietto**: pannello nero con conteggio e data, chip delle linee toccate, perforazione tratteggiata, fermate in ordine di visita.
- **Selettore di livello**: due pulsanti con indicatore nero che scorre.

## Do's and Don'ts

- **Do** usare il colore di una linea solo per ciò che appartiene a quel concetto.
- **Do** mostrare gli esiti di tutte le uscite e la fonte, con la stessa evidenza tipografica.
- **Do** tenere ogni controllo alto almeno 44 px e il fuoco sempre visibile.
- **Do** spegnere ogni animazione con `prefers-reduced-motion`, lasciando il contenuto visibile.
- **Don't** usare verde e rosso, spunte o croci per dire se una scelta è giusta.
- **Don't** trasformare l'avanzamento in percentuali, punteggi o classifiche.
- **Don't** introdurre ombre decorative, gradienti o vetro: la metro è segnaletica piatta.
- **Don't** inventare fermate o linee senza uno scenario con fonte verificata dietro.
