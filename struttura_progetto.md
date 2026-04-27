# Struttura di progetto FuelManager

- /frontend  → App Next.js (React, TypeScript, Tailwind CSS)
- /backend   → API custom (se necessario, altrimenti API Next.js)
- /db        → Schema e script Supabase (PostgreSQL)
- /docs      → Documentazione tecnica e wireframe

## Funzionalità implementate
- Login/logout sicuro con Supabase
- CRUD completo per Cisterne, Velivoli, Operatori, Rifornimenti
- Dashboard utente con dati e link rapidi
- Navbar sempre visibile con logout e info utente
- Reportistica con esportazione CSV e invio email (manuale e automatico alle 19:00)
- Interfaccia chiara, coerente e responsive su tutte le pagine

## Passi successivi
1. Personalizza la reportistica o aggiungi filtri avanzati
2. (Opzionale) Automatizza invio report lato server (Vercel Cron o Supabase Edge Function)
3. Aggiorna la documentazione in /docs

---

Per dettagli, vedi README.md e specifica_gestionale_rifornimenti.md
