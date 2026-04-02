# Planner Locale

Planner Locale e un planner settimanale personale che gira solo in locale sul PC dell'utente.

- Nessun login
- Nessun account
- Nessun multiutente
- Tutti i dati salvati in `data.json`

## Requisiti

- `Node.js` 18 o superiore

## Installazione

1. Scarica o estrai la cartella del progetto.
2. Apri un terminale nella cartella.
3. Installa le dipendenze:

```powershell
npm install
```

## Avvio e arresto

### Windows senza terminale

1. Doppio click su `start-planner.bat`
2. Si apre il browser su `http://localhost:3000`
3. Per chiudere l'app usa `stop-planner.bat`

Puoi anche fermare l'app dal pulsante `Ferma applicazione` in alto a destra.

### Avvio manuale

```powershell
npm run dev
```

## Come usare l'app

### 1. Calendario

- Mostra la settimana corrente
- Puoi cambiare settimana con le frecce in alto
- Puoi cliccare un giorno per selezionarlo
- Il giorno selezionato pilota anche i MIT del giorno
- I giorni festivi o non lavorativi sono evidenziati in base alla configurazione

### 2. Catalogo attivita

La tab `Attivita` contiene la lista completa dei task.

Ogni task ha:

- titolo
- checkbox di completamento
- priorita
- categoria
- dominio
- durata stimata

La lista e compatta:

- vedi subito titolo, checkbox e azioni rapide
- puoi espandere una riga con il toggle per vedere e modificare i dettagli

Azioni rapide disponibili:

- aggiungi o rimuovi da Big Rocks della settimana
- aggiungi o rimuovi da MIT pool della settimana
- assegna o rimuovi dai MIT del giorno selezionato
- riordina
- elimina

### 3. Big Rocks settimanali

I Big Rocks non sono una lista separata globale.

Funzionano cosi:

- scegli un task dal catalogo attivita
- lo aggiungi ai Big Rocks della settimana visualizzata
- compare nella sidebar
- puoi marcarlo fatto con la checkbox
- puoi trascinarlo nel calendario

### 4. MIT settimanali e giornalieri

I MIT funzionano in due livelli:

1. `MIT pool settimanale`
2. `MIT del giorno`

Flusso consigliato:

1. prendi un task dal catalogo attivita
2. aggiungilo al MIT pool della settimana
3. assegnalo al giorno selezionato
4. trascinalo nel calendario se vuoi pianificarlo a orario

I MIT del giorno compaiono nella sidebar e si possono marcare come fatti.

### 5. Drag and drop

Puoi trascinare nel calendario:

- task dal catalogo attivita
- Big Rocks settimanali
- MIT del giorno

Puoi anche spostare i blocchi gia pianificati nel calendario.

Quando crei o sposti un blocco, l'app impedisce:

- sovrapposizioni
- orari fuori turno
- ferie o giorni non lavorativi
- slot protetti email o buffer

### 6. Modale pianificazione

Quando pianifichi un blocco puoi scegliere:

- titolo
- orario di inizio
- durata
- categoria
- dominio

Se il task arriva dal catalogo, il blocco resta collegato a quel task.

### 7. Stati colore

I task usano tre stati:

- grigio: non pianificato nella settimana
- blu: pianificato nella settimana
- verde: fatto

Il completamento e manuale: la checkbox decide se il task e fatto.

### 8. Saturazione

La sidebar mostra:

- percentuale di saturazione target
- capacita del turno
- carico pianificato per ogni giorno

Serve per capire se la settimana e troppo piena o se hai ancora margine.

### 9. Configurazione

La tab `Configurazione` permette di gestire:

- turni giornalieri
- blocchi protetti email o buffer
- durate predefinite
- categorie
- domini
- giorni lavorativi
- sabato e domenica visibili
- ferie e chiusure

### 10. Metriche

La tab `Metriche` mostra:

- distribuzione del tempo pianificato
- carico per dominio
- buffer residuo rispetto alla capacita settimanale

### 11. Emergenze

La tab `Emergenze` serve per annotare imprevisti giornalieri della settimana.

Puoi usarla per capire se:

- la saturazione era troppo alta
- hai subito troppe interruzioni
- conviene aumentare buffer o ridurre pianificazione

### 12. Guida integrata

La tab `Guida` apre `GUIDA.html` direttamente dentro l'app.

## Backup e dati

- Tutto e salvato in `data.json`
- Puoi esportare e importare backup dall'interfaccia
- Puoi anche copiare manualmente `data.json`
- L'intera cartella e portabile su un altro PC

## Struttura tecnica

- Frontend: React + Tailwind CSS
- Backend locale: Node.js + Express
- Storage: file JSON locale

## Note operative

- L'app e pensata per una sola persona
- Non richiede internet per l'uso normale locale
- Non richiede login
- Se lasci il server aperto, puoi chiuderlo con `stop-planner.bat` o col pulsante nell'interfaccia

---
Planner personale locale, single-user, senza login.
