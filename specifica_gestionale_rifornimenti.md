# Specifica gestionale rifornimenti - FuelManager

## Funzionalità implementate
- Login/logout con Supabase
- CRUD completo per:
  - Cisterne
  - Velivoli
  - Operatori (con ruoli)
  - Rifornimenti (con selezione entità)
- Dashboard utente con info e link rapidi
- Navbar sempre visibile con logout e info utente
- Reportistica: riepilogo, tabella, esportazione CSV, invio email (manuale e automatico alle 19:00)
- Interfaccia chiara, coerente e responsive su tutte le pagine

## Come usare
1. Accedi con Supabase (crea utente se necessario)
2. Gestisci dati da dashboard e CRUD
3. Esporta o invia report dalla sezione Reportistica

## Personalizzazioni possibili
- Filtri avanzati per report
- Invio automatico server-side (Vercel Cron)
- Notifiche email custom

---

Per dettagli tecnici vedi struttura_progetto.md e codice sorgente.
