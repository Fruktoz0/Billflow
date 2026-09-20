# Billflow – Felhasználói Utak (User Journeys)

A rendszer legfontosabb végfelhasználói folyamatainak ábrázolása.

## 1. Havi Fedezet-ellenőrzés és Tétel Befizetés

```mermaid
sequenceDiagram
    autonumber
    actor User as Felhasználó
    participant App as Billflow Kliens
    participant API as Backend REST API
    participant DB as MySQL Adatbázis

    User->>App: Megnyitja az Áttekintést (hónap: 2026-10)
    App->>API: GET /api/dashboard/2026-10
    API->>DB: Lekéri a fix kiadásokat és a havi fizetéseket
    DB-->>API: Adatok visszaadása
    API-->>App: Aggregált adatok: virtuális PENDING státuszok, számlánkénti fedezeti igény
    App-->>User: Megjeleníti a Hero kártyát, számlánkénti kötelező egyenleget és a határidőket

    User->>App: Egy kattintással "Kifizettem" gomb
    alt Felülbírálás nélkül
        App->>API: POST /api/expenses/:id/pay { periodYearMonth: "2026-10" }
    else Eltérő összeggel vagy számláról
        App->>API: POST /api/expenses/:id/pay { periodYearMonth: "2026-10", actualAmount: 14320, accountId: "..." }
    end
    API->>DB: Upsert expense_payments (status = 'PAID', paidAt = NOW())
    DB-->>API: Siker
    API-->>App: 200 OK (Frissített fizetési rekord)
    App-->>User: Zöld "Kifizetve" státuszchip és frissült fedezeti egyenleg
```

## 2. Napi Értesítési és Emlékeztető Folyamat

```mermaid
flowchart TD
    Start([08:00 Cron Trigger: reminderWorker.js]) --> QueryExpenses[Lekéri a mai és a következő 2 napban esedékes fix kiadásokat]
    QueryExpenses --> CheckStatus{Havi státusz a fizetések közt?}
    CheckStatus -- PAID vagy SKIPPED --> Skip[Értesítés kihagyása]
    CheckStatus -- PENDING vagy nincs rekord --> GetSubscriptions[Háztartás tagjainak Web Push tokenjei]
    GetSubscriptions --> FormatMsg[Üzenet generálása: Név, Tervezett összeg, Kötelező számla fedezet]
    FormatMsg --> SendPush[Web Push küldése VAPID aláírással]
    SendPush --> PushResult{Küldés eredménye?}
    PushResult -- Siker (201) --> Done([Értesítés megjelenik a felhasználó eszközén])
    PushResult -- 404 / 410 Gone --> Cleanup[Érvénytelen feliratkozás törlése a DB-ből]
    Cleanup --> Done
```
