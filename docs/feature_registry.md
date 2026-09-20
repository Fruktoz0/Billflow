# Billflow – Funkció Nyilvántartás (Feature Registry)

Ez a dokumentum a Billflow alkalmazás jóváhagyott, tervezett és elutasított funkcióinak nyilvántartása.

| Funkció ID | Név | Kategória | Státusz | Leírás | Érintett komponensek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-001** | Több bankszámla kezelése (Multi-Account) | Pénzügy / Számlák | **Approved** | Dinamikus forrásszámlák (folyószámla, Revolut, készpénz) rögzítése egyedi színekkel és ikonokkal. | `backend/src/models/BankAccount.js`, `accountController` |
| **FEAT-002** | Fix kötelezettség sablonok | Pénzügy / Tervezés | **Approved** | Ismétlődő havi tételek rögzítése összeggel, határidővel (1-31), kategóriával és alapértelmezett számlával. | `backend/src/models/FixedExpense.js`, `expenseController` |
| **FEAT-003** | Havi Cash-Flow Műszerfal & Fedezetszámítás | Pénzügy / Összegzés | **Approved** | Adott hónap virtuális és valós kötelezettségeinek összegzése, számlánkénti szükséges fedezet kalkulációja. | `dashboardController`, `ExpensePayment.js` |
| **FEAT-004** | Befizetés rögzítése & Forrás felülbírálás | Pénzügy / Tényadatok | **Approved** | Tétel fizetettre állítása egy kattintással; szükség esetén eltérő tény összeg és forrásszámla rögzítése. | `paymentController`, `ExpensePayment.js` |
| **FEAT-005** | Befizetés visszavonása & Kihagyás (Skip) | Pénzügy / Tényadatok | **Approved** | Lekönyvelt tétel visszanyitása (unpay) vagy szezonális kihagyása (skip) a fedezeti igény torzítása nélkül. | `paymentController`, `ExpensePayment.js` |
| **FEAT-006** | Háztartáskezelés, Meghívások & Tagok | Felhasználó / Auth | **Implemented** | Családi / lakótársi háztartás közös számlákkal, e-mailes meghívókkal, 7 napos tokenekkel, meghívókódos csatlakozással és szerepkör-menedzsmenttel. | `Household.js`, `HouseholdInvitation.js`, `householdController.js`, `householdRoutes.js`, `SettingsPage.tsx`, `InviteMemberModal.tsx` |
| **FEAT-007** | PWA Web Push értesítések | Értesítések | **Approved** | Böngésző/PWA szintű VAPID push értesítések küldése 2 nappal a fizetési határidő előtt a szükséges fedezettel. | `PushSubscription.js`, `webpush.js`, `reminderWorker.js` |
| **FEAT-008** | Napi mikrotranzakciók kézi rögzítése | Pénzügy / Kiadások | **Rejected** | PSD2 / banki szinkron hiányában a napi apróköltések manuális adminisztrációja elhagyásra került. | - |
| **FEAT-009** | Gamifikációs modul (Érmék, XP, Skinek) | UI / Engagement | **Rejected** | Sallangmentesítés: a felület a tiszta cash-flow áttekintésre fókuszál. | - |
