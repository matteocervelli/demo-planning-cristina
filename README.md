# ZenTime Architect - Guida all'Installazione Locale

Questa applicazione è un planner strategico settimanale basato sui principi di Time Blocking, Big Rocks e MIT (Most Important Tasks). I dati vengono salvati localmente in un file JSON per la massima privacy e portabilità.

## 🚀 Requisiti Preliminari

Prima di iniziare, assicurati di avere installato sul tuo PC:
*   **Node.js** (Versione 18 o superiore): Scaricalo da [nodejs.org](https://nodejs.org/). Scegli la versione **LTS**.

## 📂 Installazione su Windows

1.  **Scarica il codice**: Scarica lo ZIP del progetto da AI Studio o clona il repository.
2.  **Prepara la cartella**: Estrai i file nella cartella desiderata (es. `Documenti/Planner`).
3.  **Apri il Terminale**:
    *   Vai nella cartella del progetto.
    *   Fai Shift + Click destro in uno spazio vuoto della cartella e seleziona "Apri finestra PowerShell qui" o "Apri nel terminale".
4.  **Installa le dipendenze**:
    ```powershell
    npm install
    ```

## 🏃‍♂️ Avvio dell'Applicazione

Per avviare il planner, esegui il seguente comando nel terminale:
```powershell
npm run dev
```

L'applicazione sarà accessibile nel tuo browser all'indirizzo:
**[http://localhost:3000](http://localhost:3000)**

> **Nota sulla Porta**: Se desideri usare la porta **3400** (o qualsiasi altra), apri il file `server.ts` con un editor di testo (come Blocco Note o VS Code) e cambia la riga `const PORT = 3000;` con `const PORT = 3400;`.

## 💾 Gestione dei Dati

*   **Database Locale**: Tutti i tuoi dati (task, blocchi, impostazioni) sono salvati nel file `data.json` nella cartella principale dell'app.
*   **Backup**: Puoi copiare il file `data.json` per farne un backup o sovrascriverlo con un backup precedente.
*   **Portabilità**: Per spostare l'app su un altro computer, ti basta copiare l'intera cartella. I tuoi dati viaggeranno con l'app.

## 🛠️ Struttura Tecnica
*   **Frontend**: React + Tailwind CSS + Lucide Icons.
*   **Backend**: Node.js + Express (per la gestione del file JSON).
*   **Build Tool**: Vite.

---
*Sviluppato con ZenTime Architect - Pianificazione Strategica Professionale.*
