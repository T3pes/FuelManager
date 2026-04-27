# Struttura di progetto FuelManager

- /frontend  → App Next.js (React, TypeScript, Tailwind CSS)
  - Navigazione con barra superiore (Navbar) e link a tutte le sezioni
  - Logout utente
  - Possibilità di tornare indietro da ogni pagina
  - CRUD completo per cisterne (tankers)
  - Dashboard con dati utente
  - (In sviluppo: CRUD velivoli, operatori, rifornimenti, reportistica)
- /backend   → API custom (se necessario, altrimenti API Next.js)
- /db        → Schema e script Supabase (PostgreSQL)
- /docs      → Documentazione tecnica e wireframe

## Funzionalità implementate
- Login/logout sicuro con Supabase
- Navigazione tra dashboard e moduli
- Gestione cisterne (CRUD)
- Visualizzazione utente loggato
- Link di ritorno su ogni pagina

## Prossimi passi
- CRUD velivoli, operatori, rifornimenti
- Reportistica ed esportazione
- Policy sicurezza avanzate
- UI responsive e migliorata

---

Per dettagli, vedi README.md e specifica_gestionale_rifornimenti.md

