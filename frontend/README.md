# Billflow Frontend (Web & PWA)

A [DESIGN.md](../DESIGN.md) és a csatolt mobil/asztali specifikációk alapján megvalósított Vite + React + TypeScript + Tailwind CSS kliensoldali alkalmazás.

## Követelmények
- Node.js >= 20.0.0
- Futó backend API a `http://localhost:5000` címen (fejlesztéshez a Vite proxy automatikusan átirányítja a `/api` kéréseket).

## Indítás lépései

### 1. Függőségek telepítése
```bash
cd frontend
npm install
```

### 2. Fejlesztői szerver indítása
```bash
npm run dev
```
A felület a `http://localhost:5173` címen fog futni.

## Főbb funkciók és gyorsbillentyűk
- **Privacy mód:** Nyomd meg a **`P`** billentyűt vagy kattints a fejlécben a Szem ikonra az összes összeg elhomályosításához (`filter: blur`).
- **Keresés fókusz:** Nyomd meg a **`/`** billentyűt a keresőmező azonnali fókuszálásához.
- **Új tétel ablak:** Nyomd meg az **`N`** billentyűt vagy mobilon a középső kiemelt **`+`** gombot.
- **Téma váltás:** A fejlécben a Nap/Hold ikonnal válthatsz világos és sötét mód között.
