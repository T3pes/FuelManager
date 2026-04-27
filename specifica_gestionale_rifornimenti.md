# Specifica progetto — Web App gestionale rifornimento cisterne e velivoli

## 1. Obiettivo

Realizzare una web app gestionale deployabile su **Vercel**, con backend/API in **Node.js** e frontend in **React**, usando **Supabase** come database, autenticazione e controllo accessi.

La piattaforma deve gestire e tracciare i rifornimenti tra **cisterne** e **velivoli**, con relazione **N-N**: una cisterna può rifornire più velivoli e un velivolo può ricevere rifornimenti da più cisterne in momenti diversi.

Ogni rifornimento deve registrare almeno:

- operatore che ha effettuato il rifornimento;
- cisterna utilizzata;
- velivolo rifornito;
- quantità erogata;
- data e ora;
- eventuali note;
- stato del record;
- utente che ha creato/modificato il record.

A fine giornata il sistema deve inviare una mail riepilogativa con tutti i rifornimenti effettuati. Deve inoltre permettere l'esportazione di report settimanali e mensili.

---

## 2. Stack tecnico richiesto

### Frontend

- React
- Vite oppure Next.js
- TypeScript consigliato
- Tailwind CSS consigliato
- React Hook Form per i form
- Zod per validazione dati
- TanStack Table per tabelle/report
- Recharts opzionale per dashboard

### Backend

Opzione consigliata:

- Next.js su Vercel con API Routes / Server Actions

Alternativa:

- React + Vite frontend
- API serverless Node.js su Vercel dentro `/api`

### Database e Auth

- Supabase PostgreSQL
- Supabase Auth
- Row Level Security attiva
- Storage opzionale per esportazioni/report salvati

### Email

Usare uno dei seguenti provider:

- Resend, consigliato per Vercel
- SendGrid
- Brevo
- SMTP aziendale

### Scheduling email giornaliera

Usare:

- Vercel Cron Jobs
- endpoint serverless protetto, esempio `/api/cron/send-daily-report`

---

## 3. Ruoli e controllo accessi

Implementare almeno questi ruoli:

### `admin`

Può:

- gestire utenti;
- gestire cisterne;
- gestire velivoli;
- vedere tutti i rifornimenti;
- modificare o annullare record;
- esportare report;
- configurare destinatari email;
- accedere alla dashboard completa.

### `supervisor`

Può:

- vedere tutti i rifornimenti;
- creare rifornimenti;
- validare o correggere dati;
- esportare report;
- consultare dashboard.

### `operator`

Può:

- creare rifornimenti;
- vedere solo i propri rifornimenti oppure quelli della giornata, in base alla policy scelta;
- modificare i propri record solo entro una finestra temporale configurabile, ad esempio 30 minuti.

### `viewer`

Può:

- visualizzare report;
- esportare dati;
- non può creare o modificare rifornimenti.

---

## 4. Modello dati Supabase

### Tabella `profiles`

Estende `auth.users`.

Campi:

```sql
id uuid primary key references auth.users(id) on delete cascade,
full_name text not null,
role text not null check (role in ('admin', 'supervisor', 'operator', 'viewer')),
is_active boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

---

### Tabella `operators`

Serve se gli operatori devono essere gestiti anche come anagrafica separata dagli utenti login.

```sql
id uuid primary key default gen_random_uuid(),
profile_id uuid references profiles(id),
operator_code text unique,
full_name text not null,
is_active boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

---

### Tabella `tankers`

Cisterne disponibili.

```sql
id uuid primary key default gen_random_uuid(),
code text not null unique,
name text,
plate_number text,
capacity_liters numeric(12,2),
current_estimated_liters numeric(12,2),
fuel_type text not null,
is_active boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Esempi `fuel_type`:

- JET_A1
- AVGAS
- DIESEL
- OTHER

---

### Tabella `aircrafts`

Velivoli rifornibili.

```sql
id uuid primary key default gen_random_uuid(),
registration_code text not null unique,
model text,
owner_company text,
fuel_type text not null,
is_active boolean not null default true,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

---

### Tabella `refuelings`

Tabella centrale N-N tra cisterne e velivoli.

```sql
id uuid primary key default gen_random_uuid(),
operator_id uuid not null references operators(id),
operator_profile_id uuid references profiles(id),
tanker_id uuid not null references tankers(id),
aircraft_id uuid not null references aircrafts(id),
fuel_type text not null,
quantity_liters numeric(12,2) not null check (quantity_liters > 0),
refueled_at timestamptz not null default now(),
notes text,
status text not null default 'confirmed' check (status in ('draft', 'confirmed', 'cancelled')),
created_by uuid references profiles(id),
updated_by uuid references profiles(id),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Regole consigliate:

- `fuel_type` del rifornimento deve essere coerente con cisterna e velivolo.
- Non consentire quantità <= 0.
- Non eliminare fisicamente i rifornimenti: usare `status = 'cancelled'`.
- Salvare sempre chi ha creato/modificato.

---

### Tabella `daily_report_recipients`

Destinatari email riepilogo giornaliero.

```sql
id uuid primary key default gen_random_uuid(),
email text not null,
name text,
is_active boolean not null default true,
created_at timestamptz not null default now()
```

---

### Tabella `audit_logs`

Tracciamento modifiche importanti.

```sql
id uuid primary key default gen_random_uuid(),
actor_profile_id uuid references profiles(id),
action text not null,
entity_type text not null,
entity_id uuid,
payload jsonb,
created_at timestamptz not null default now()
```

Esempi `action`:

- CREATE_REFUELING
- UPDATE_REFUELING
- CANCEL_REFUELING
- CREATE_TANKER
- UPDATE_TANKER
- CREATE_AIRCRAFT
- UPDATE_AIRCRAFT
- EXPORT_REPORT
- SEND_DAILY_EMAIL

---

## 5. Relazioni principali

- `profiles.id` → `auth.users.id`
- `operators.profile_id` → `profiles.id`
- `refuelings.operator_id` → `operators.id`
- `refuelings.operator_profile_id` → `profiles.id`
- `refuelings.tanker_id` → `tankers.id`
- `refuelings.aircraft_id` → `aircrafts.id`

Relazione N-N effettiva:

- `tankers` N-N `aircrafts` tramite `refuelings`.

---

## 6. Funzionalità obbligatorie

### 6.1 Login e gestione accessi

Implementare:

- login email/password con Supabase Auth;
- pagina `/login`;
- protezione rotte frontend;
- redirect utenti non autenticati;
- blocco utenti inattivi;
- ruolo letto da `profiles.role`;
- menu diverso in base al ruolo.

---

### 6.2 Dashboard

Pagina `/dashboard`.

Mostrare:

- rifornimenti di oggi;
- litri totali erogati oggi;
- numero velivoli riforniti oggi;
- numero cisterne usate oggi;
- ultimi rifornimenti;
- eventuali record cancellati o anomali;
- filtro per data, cisterna, velivolo, operatore.

---

### 6.3 Gestione cisterne

Pagina `/tankers`.

Funzioni:

- lista cisterne;
- crea cisterna;
- modifica cisterna;
- disattiva cisterna;
- filtro per codice, tipo carburante, stato.

Campi form:

- codice cisterna;
- nome;
- targa;
- capacità;
- quantità stimata presente;
- tipo carburante;
- attiva/non attiva.

---

### 6.4 Gestione velivoli

Pagina `/aircrafts`.

Funzioni:

- lista velivoli;
- crea velivolo;
- modifica velivolo;
- disattiva velivolo;
- filtro per matricola, modello, compagnia, tipo carburante.

Campi form:

- codice/matricola velivolo;
- modello;
- società/proprietario;
- tipo carburante;
- attivo/non attivo.

---

### 6.5 Gestione operatori

Pagina `/operators`.

Funzioni:

- lista operatori;
- crea operatore;
- collega operatore a profilo utente;
- modifica;
- disattiva.

---

### 6.6 Registrazione rifornimento

Pagina `/refuelings/new`.

Form obbligatorio:

- operatore;
- cisterna;
- velivolo;
- quantità litri;
- data/ora rifornimento;
- note opzionali.

Controlli obbligatori:

- cisterna attiva;
- velivolo attivo;
- operatore attivo;
- quantità maggiore di zero;
- tipo carburante compatibile;
- impossibilità di registrare rifornimenti futuri oltre una tolleranza configurabile;
- conferma prima del salvataggio.

Dopo il salvataggio:

- creare record in `refuelings`;
- creare record in `audit_logs`;
- aggiornare eventualmente `tankers.current_estimated_liters` sottraendo la quantità;
- mostrare ricevuta/riepilogo.

---

### 6.7 Lista rifornimenti

Pagina `/refuelings`.

Funzioni:

- tabella con tutti i rifornimenti visibili all'utente;
- filtri per:
  - data da/a;
  - cisterna;
  - velivolo;
  - operatore;
  - tipo carburante;
  - stato;
- dettaglio singolo rifornimento;
- modifica se autorizzato;
- annullamento logico con motivo obbligatorio.

Colonne tabella:

- data/ora;
- operatore;
- cisterna;
- velivolo;
- tipo carburante;
- litri;
- stato;
- note;
- creato da.

---

### 6.8 Report settimanali e mensili

Pagina `/reports`.

Funzioni:

- selezione periodo:
  - questa settimana;
  - settimana personalizzata;
  - mese corrente;
  - mese personalizzato;
  - intervallo libero;
- aggregazione per:
  - giorno;
  - cisterna;
  - velivolo;
  - operatore;
  - tipo carburante;
- export in CSV;
- export in XLSX;
- export PDF opzionale.

Campi report minimi:

- periodo;
- totale litri;
- numero rifornimenti;
- numero velivoli riforniti;
- numero cisterne usate;
- dettaglio righe rifornimento;
- riepilogo per cisterna;
- riepilogo per velivolo;
- riepilogo per operatore.

---

### 6.9 Email giornaliera automatica

Endpoint:

```text
POST /api/cron/send-daily-report
```

Deve essere chiamato da Vercel Cron ogni giorno, ad esempio alle 23:59 oppure alle 00:05 del giorno successivo.

Protezione endpoint:

- usare header `Authorization: Bearer <CRON_SECRET>`;
- rifiutare richieste senza secret valido.

Contenuto email:

Oggetto:

```text
Report rifornimenti giornaliero - YYYY-MM-DD
```

Corpo email:

- data report;
- totale rifornimenti;
- totale litri erogati;
- elenco rifornimenti con:
  - ora;
  - operatore;
  - cisterna;
  - velivolo;
  - litri;
  - carburante;
  - note;
- riepilogo per cisterna;
- riepilogo per velivolo;
- riepilogo per operatore;
- eventuali record cancellati;
- allegato CSV opzionale.

Destinatari:

- tabella `daily_report_recipients`;
- solo destinatari `is_active = true`.

---

## 7. API da implementare

### Auth / profilo

- `GET /api/me`
- `GET /api/users`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/status`

### Cisterne

- `GET /api/tankers`
- `POST /api/tankers`
- `GET /api/tankers/:id`
- `PATCH /api/tankers/:id`
- `PATCH /api/tankers/:id/deactivate`

### Velivoli

- `GET /api/aircrafts`
- `POST /api/aircrafts`
- `GET /api/aircrafts/:id`
- `PATCH /api/aircrafts/:id`
- `PATCH /api/aircrafts/:id/deactivate`

### Operatori

- `GET /api/operators`
- `POST /api/operators`
- `GET /api/operators/:id`
- `PATCH /api/operators/:id`
- `PATCH /api/operators/:id/deactivate`

### Rifornimenti

- `GET /api/refuelings`
- `POST /api/refuelings`
- `GET /api/refuelings/:id`
- `PATCH /api/refuelings/:id`
- `PATCH /api/refuelings/:id/cancel`

### Report

- `GET /api/reports/refuelings?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/reports/refuelings/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/reports/refuelings/export.xlsx?from=YYYY-MM-DD&to=YYYY-MM-DD`

### Cron

- `POST /api/cron/send-daily-report`

---

## 8. Regole di sicurezza Supabase RLS

Attivare Row Level Security su tutte le tabelle applicative.

Policy indicative:

### `profiles`

- ogni utente può leggere il proprio profilo;
- admin può leggere tutti;
- solo admin può modificare ruoli e stato.

### `tankers`, `aircrafts`, `operators`

- admin e supervisor leggono tutto;
- operator legge solo record attivi;
- solo admin/supervisor possono creare/modificare;
- nessuna cancellazione fisica lato client.

### `refuelings`

- admin/supervisor/viewer leggono tutto;
- operator può leggere i propri record o quelli del giorno, secondo configurazione;
- operator può creare record;
- operator può modificare solo record propri entro finestra temporale configurabile;
- solo admin/supervisor possono annullare record senza limite temporale;
- cancellazione fisica vietata.

### `audit_logs`

- solo admin/supervisor leggono;
- scrittura solo lato server con service role.

---

## 9. Variabili ambiente

Creare `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
EMAIL_PROVIDER=resend
RESEND_API_KEY=
DAILY_REPORT_FROM_EMAIL=
APP_BASE_URL=
```

Mai esporre `SUPABASE_SERVICE_ROLE_KEY` nel frontend.

---

## 10. Struttura progetto consigliata

```text
/app
  /login
  /dashboard
  /tankers
  /aircrafts
  /operators
  /refuelings
    /new
    /[id]
  /reports
  /settings
/api
  /cron/send-daily-report
/components
  /forms
  /tables
  /layout
/lib
  supabase-client.ts
  supabase-server.ts
  auth.ts
  permissions.ts
  validators.ts
  reports.ts
  email.ts
  csv.ts
  xlsx.ts
/types
  database.ts
  domain.ts
/supabase
  /migrations
  seed.sql
```

---

## 11. Pagine frontend richieste

### `/login`

- login email/password;
- recupero password opzionale;
- messaggi errore chiari.

### `/dashboard`

- KPI giornalieri;
- ultimi rifornimenti;
- filtri rapidi;
- link a nuovo rifornimento.

### `/refuelings/new`

- form veloce per inserimento rifornimento;
- select ricercabili per cisterna/velivolo/operatore;
- validazione immediata;
- conferma salvataggio.

### `/refuelings`

- elenco rifornimenti;
- filtri avanzati;
- export filtrato;
- dettaglio/modifica/annulla.

### `/tankers`

- CRUD cisterne.

### `/aircrafts`

- CRUD velivoli.

### `/operators`

- CRUD operatori.

### `/reports`

- generazione report settimanali/mensili;
- esportazione CSV/XLSX/PDF.

### `/settings`

Solo admin.

- destinatari email giornaliera;
- configurazioni app;
- ruoli utenti;
- soglie e policy.

---

## 12. Validazioni critiche

Il sistema deve impedire:

- rifornimento senza operatore;
- rifornimento senza cisterna;
- rifornimento senza velivolo;
- quantità nulla o negativa;
- rifornimento con cisterna disattivata;
- rifornimento con velivolo disattivato;
- carburante incompatibile;
- modifica non autorizzata;
- cancellazione fisica di un rifornimento;
- accesso a dati non permessi dal ruolo.

---

## 13. Audit e tracciabilità

Ogni azione rilevante deve creare log in `audit_logs`.

Log obbligatori:

- creazione rifornimento;
- modifica rifornimento;
- annullamento rifornimento;
- modifica cisterna;
- modifica velivolo;
- export report;
- invio email giornaliera;
- errore invio email.

Il payload JSON deve contenere:

- valori precedenti, se modifica;
- valori nuovi;
- utente esecutore;
- timestamp;
- IP opzionale;
- user agent opzionale.

---

## 14. Reportistica

### Report giornaliero

Serve per email automatica.

Query base:

- da inizio giornata a fine giornata;
- escludere `status = 'cancelled'` dai totali;
- mostrare i cancellati in sezione separata.

### Report settimanale

Periodo:

- lunedì-domenica oppure intervallo personalizzato.

Output:

- CSV;
- XLSX;
- PDF opzionale.

### Report mensile

Periodo:

- primo giorno del mese - ultimo giorno del mese.

Output:

- CSV;
- XLSX;
- PDF opzionale.

---

## 15. UX richiesta

La web app deve essere pratica, non decorativa.

Priorità:

- inserimento rifornimento in meno di 30 secondi;
- campi grandi e leggibili;
- compatibilità tablet;
- ricerca rapida cisterne/velivoli;
- pulsante evidente “Nuovo rifornimento”;
- dashboard immediata;
- filtri semplici;
- export con un click;
- messaggi errore espliciti.

---

## 16. Vercel Cron

Creare file `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-daily-report",
      "schedule": "5 0 * * *"
    }
  ]
}
```

Nota: l'orario cron Vercel è in UTC. Se serve orario Italia, gestire il calcolo del giorno in backend usando timezone `Europe/Rome`.

---

## 17. Timezone

Usare sempre timezone applicativa:

```text
Europe/Rome
```

Salvare in database con `timestamptz`.

Mostrare le date lato frontend in formato italiano:

```text
DD/MM/YYYY HH:mm
```

---

## 18. Seed dati iniziale

Creare seed con:

- almeno 2 cisterne;
- almeno 3 velivoli;
- almeno 2 operatori;
- 1 admin;
- 1 supervisor;
- 1 operator;
- destinatario email test.

---

## 19. Definition of Done

Il progetto è considerato completo quando:

- login Supabase funzionante;
- ruoli funzionanti;
- RLS attiva;
- CRUD cisterne funzionante;
- CRUD velivoli funzionante;
- CRUD operatori funzionante;
- creazione rifornimento funzionante;
- lista rifornimenti filtrabile;
- annullamento logico funzionante;
- audit log funzionante;
- report giornaliero generato;
- email giornaliera inviata da cron;
- export settimanale CSV/XLSX funzionante;
- export mensile CSV/XLSX funzionante;
- deploy Vercel funzionante;
- variabili ambiente documentate;
- nessuna chiave sensibile esposta nel frontend.

---

## 20. Prompt operativo per IDE / AI coding agent

Sviluppa una web app full-stack con Next.js, React, TypeScript, Supabase e Vercel per la gestione dei rifornimenti tra cisterne e velivoli.

Implementa autenticazione Supabase con ruoli admin, supervisor, operator e viewer. Crea schema database PostgreSQL con tabelle profiles, operators, tankers, aircrafts, refuelings, daily_report_recipients e audit_logs. Abilita Row Level Security e crea policy coerenti con i ruoli.

La relazione tra cisterne e velivoli deve essere N-N tramite la tabella refuelings. Ogni rifornimento deve tracciare operatore, cisterna, velivolo, quantità litri, tipo carburante, data/ora, note, stato, creato da e modificato da.

Crea frontend con pagine login, dashboard, gestione cisterne, gestione velivoli, gestione operatori, nuovo rifornimento, lista rifornimenti, dettaglio rifornimento, report e impostazioni. Il form nuovo rifornimento deve essere rapido, validato e adatto a uso tablet.

Implementa API server-side protette per CRUD, report, export CSV/XLSX e invio email giornaliera. Usa Vercel Cron per chiamare un endpoint protetto `/api/cron/send-daily-report` che invia il riepilogo giornaliero dei rifornimenti ai destinatari configurati.

Implementa export settimanale e mensile in CSV e XLSX. Implementa audit log per creazione, modifica, annullamento, export e invio email. Usa timezone Europe/Rome per i report e salva le date in database come timestamptz.

Non esporre mai la service role key nel frontend. Tutte le operazioni amministrative devono avvenire lato server.

Consegna codice pulito, modulare, tipizzato, con validazioni Zod, componenti riutilizzabili, gestione errori chiara e file README con istruzioni per Supabase, Vercel, variabili ambiente e deploy.

