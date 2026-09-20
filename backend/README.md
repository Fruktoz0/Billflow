# Billflow Backend API

A [backend.md](../backend.md) specifikáció alapján megvalósított Node.js + Express + MySQL + Sequelize backend.

## Követelmények
- Node.js >= 20.0.0
- Docker & Docker Compose (vagy helyi MySQL 8 adatbázis)

## Első lépések

### 1. Adatbázis indítása Dockerrel
```bash
docker compose up -d
```
Ez elindítja a MySQL 8 adatbázist a `3306`-os porton `billflow` adatbázissal, `billflow_user` felhasználóval és `billflow_password` jelszóval.

### 2. Függőségek telepítése
```bash
npm install
```

### 3. Adatbázis táblák szinkronizálása
```bash
npm run db:init
```

### 4. Fejlesztői szerver indítása
```bash
npm run dev
```
A szerver a `http://localhost:5000` címen fog futni. Health-check elérhető: `http://localhost:5000/api/health`.
