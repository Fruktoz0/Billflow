# Billflow: UI/UX Design specification (0.1.0)

Cél: egy app, ami egyetlen pillantással megmutatja, **mit kell fizetni, mikor, melyik számláról, és mennyi pénznek kell ott lennie**. Nincs kézi tranzakciórögzítés, nincs bankbekötés. A felület nyugodt, világos, és a szám a főszereplő.

---

## 1. Alapelvek

1. **A szám a főszereplő.** Nagy, jól olvasható összegek, minden más csendes.
2. **A szín jelent valamit.** A türkiz a márkaszín és az interakció színe. A státuszoknak (lejárt, esedékes, kifizetve) saját, fix színük van, amit a márkaszín soha nem használ.
3. **Státusz sosem csak színnel.** Mindig ikon vagy szöveg is kíséri (színtévesztők és nap alatti használat miatt).
4. **Egy koppintás a fő műveletre.** A "Kifizettem" a legrövidebb út az appban.
5. **Ugyanaz a nyelv mindenhol.** Egy művelet ugyanúgy hívódik a gombon, a toastban és a naplóban (pl. "Kifizettem" > "Kifizetve").
6. **Mobile first, de az asztali nézet nem nyújtott mobil.** Másik elrendezés, ugyanazok a komponensek.

## 2. Információs architektúra

| Szint | Mobil (alsó navigáció) | Asztali (oldalsáv) |
|---|---|---|
| 1 | Áttekintés | Áttekintés |
| 2 | Naptár | Naptár |
| Középen | Új tétel (lebegő gomb) | Új tétel (fejléc gomb, gyorsbillentyű: `N`) |
| 3 | Tételek | Tételek |
| 4 | Beállítások (benne: Számlák, Háztartás, Értesítések, Megjelenés) | Számlák |
| 5 | | Beállítások |

## 3. Design tokenek

### Színek

```css
:root, [data-theme="light"] {
  --bg:        #F5FBFB;  /* oldal háttér, alig türkiz "köd" */
  --surface:   #FFFFFF;  /* kártyák */
  --ink:       #16181D;  /* szöveg */
  --ink-2:     #566F74;  /* másodlagos szöveg, hűvös szürketürkiz (AA a --bg-n) */
  --line:      #DCECED;  /* hajszálvonal */

  --accent:        #0E8A9A;  /* grafika: sávok, pontok, haladás */
  --accent-strong: #0B7886;  /* kitöltött gombok, FAB (fehér szöveg AA) */
  --accent-text:   #0B6B78;  /* szöveg tint hátterén */
  --accent-tint:   #E5F4F6;  /* halvány háttér: chip, ikon négyzet */
  --accent-soft:   #A9DBE1;  /* második számla a csíkon, halvány elem */
  --on-accent:     #FFFFFF;

  --overdue: #B91C1C;  --overdue-bg: #FEE2E2;
  --soon:    #92400E;  --soon-bg:    #FEF3C7;
  --paid:    #15803D;  --paid-bg:    #DCFCE7;
}

[data-theme="dark"] {
  --bg: #0C1214;  --surface: #141D20;  --ink: #EEF3F3;  --ink-2: #93A3A8;  --line: #243236;
  --accent: #2BB3C4;  --accent-strong: #2BB3C4;  --accent-text: #7FD6E2;
  --accent-tint: #12333A;  --accent-soft: #1E5A63;  --on-accent: #06272C;
  --overdue: #FF8A8E;  --overdue-bg: #3A1416;
  --soon: #F5B942;     --soon-bg: #3A2E0B;
  --paid: #4ADE80;     --paid-bg: #12301D;
}
```

Szabályok:
- **Háttér és kártya viszonya:** a háttér (`--bg`, alig türkiz) csak nagyon kicsit tér el a kártyák fehérétől, ezért a kártyák **mindig** kapnak 0,5 px `--line` szegélyt. Ezt ne hagyd el, mert nélküle napfényben elvész a kártyák széle. Az alsó navigáció és az oldalsáv ugyanezt a hajszálvonalat használja.
- A sötét mód háttere is enyhén türkizes hűvös (`#0C1214`), hogy a két mód egy családba tartozzon.
- A sötét mód a rendszerbeállítást követi (`prefers-color-scheme`), a felhasználó felülírhatja (Rendszer / Világos / Sötét). A `theme-color` meta tag mindkét módhoz külön értéket kap.
- A kitöltött gombok és a lebegő gomb `--accent-strong` háttérrel és `--on-accent` szöveggel készülnek. A `--accent` csak grafikára (sáv, pont, haladás) való, kis szöveghez nem elég kontrasztos.
- Számlajelölés: **első számla `--accent`, második `--accent-soft`**. Több számlánál (készpénz, harmadik bank) a türkiz tónusskála további fokozatai és eltérő pontforma (kitöltött, gyűrű) jelöli őket, hogy ne kelljen új színt bevezetni.

### Tipográfia

- Betűtípus: **Manrope** (variálható), latin-ext részhalmazzal (ő, ű). Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`. Önállóan hosztolt (nem Google CDN), `font-display: swap`, csak a használt súlyok.
- Súlyok: 400 és 500. Nincs 600/700.
- Számok: `font-variant-numeric: tabular-nums` mindenhol, ahol összeg vagy dátum áll oszlopban.
- Skála (px, `rem`-ben megadva): 11 / 12 / 13 / 14 / 16 / 20 / 28 / 34. A 34-es a hero összeg mobilon, a 28-as asztali nézeten, ha a kártya keskenyebb.
- Pénzformátum: `new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 })`, eredmény: `12 500 Ft` (törhetetlen szóközzel). A hero összeg mellett sosem válik külön sorba a "Ft".

### Forma és térköz

- Térköz alap: 4 px, lépések: 4, 8, 12, 16, 20, 24, 32.
- Sarokkerekítés: chip és státusz teljesen kerek, vezérlők 10–12 px, lista kártya 18 px, hero kártya 24 px. **A kerekítés jelez hierarchiát**, ne minden elem kapja ugyanazt.
- Felület: nincs árnyék a síkfelületeken, csak 0,5 px hajszálvonal. Árnyék csak lebegő rétegen (bottom sheet, menü, dialog) van.
- Mozgás: 120 ms (visszajelzés), 220 ms (átmenet), 320 ms (sheet, dialog). Easing: `cubic-bezier(.2,.8,.2,1)`. `prefers-reduced-motion` esetén csak áttűnés marad, elmozdulás nincs.

## 4. Komponensek

**Hero kártya** (Áttekintés teteje)
- Fehér (`--surface`) kártya, 0,5 px vonal, 24 px kerekítés.
- Felül türkiz címke chip ikonnal: "Következő 7 nap". Alatta a nagy összeg.
- Alatta számlánkénti arányos csík (2 px rés a szegmensek között), majd számlánként egy sor: pont, név, összeg.
- Mobilon alul haladás: "Szeptember: 6 a 11-ből kifizetve" vékony sávval. Asztalin ez a jobb oldali összesítő kártyába kerül.
- A számok érintésre (hosszan) a részletekre visznek: a hét tételei, számlánként szűrve.

**Tétel sor**
- Bal oldalt 38 px-es ikon négyzet (`--accent-tint` háttér, `--accent-text` ikon), középen név és alatta számla pont + név, jobb oldalt összeg és státusz chip.
- Státusz chip: 11 px, teljesen kerek, ikon nélkül is szöveges ("Ma esedékes", "Kifizetve", "Lejárt").
- A tétel neve egy sorban marad (`white-space: nowrap; text-overflow: ellipsis`), a teljes név a részletekben látszik. Keskeny (320 px) képernyőn a státusz chip a számla neve alá kerülhet, de a név nem tör két sorba.
- Húzás jobbra: kifizetve. Húzás balra: szerkesztés, kihagyás erre a hónapra. Ugyanez asztali nézeten sor fölé húzva megjelenő gombokkal (nem csak gesztussal elérhető).

**Lejárt sáv**
- Piros tint sáv a lista fölött (`--overdue-bg`, `--overdue` szöveg), ikonnal és egy "Kifizettem" kontúr gombbal. Több lejárt tételnél összevonja: "3 lejárt tétel", koppintásra kinyílik.

**Számlajelölő**
- 8 px pont a névvel. Az első számla `--accent`, a második `--accent-soft`. A név mindig ott van, a pont önmagában nem hordoz információt.

**Lebegő gomb (FAB) és Új tétel**
- Mobilon 48 px, alsó sáv közepén, `--accent-strong`. Asztalon nem FAB, hanem "Új tétel" gomb a fejlécben és `N` gyorsbillentyű.
- Új tétel űrlap: mobilon bottom sheet, asztalon 480 px-es dialog. Mezők: név, összeg (`inputmode="decimal"`), gyakoriság (havonta, negyedévente, évente, egyszeri), esedékesség napja, számla (szegmentált választó), emlékeztető (napokkal előtte), "Változó összeg" kapcsoló (ilyenkor becsült összeg, utólag pontosítható), megjegyzés.
- Okos alapértékek: az utoljára használt számla és emlékeztető, a következő hónap első lehetséges napja.

**Naptár**
- Hétfővel induló hónapnézet. A napokon 4 px-es pont: türkiz (esedékes), piros (lejárt), a mai nap teli türkiz kör. Koppintásra (mobil) az adott nap tételei sheetben, asztalon a lista fölé húzva megjelenik a nap szűrése.

**Összesítő kártya**
- "Szeptember összesen", számlánkénti bontás és haladássáv. Ez válaszol arra, mennyi pénznek kell lennie a két számlán a hónap végéig.

**Privacy mód**
- A fejléc szem gombja elmossa az összes összeget (`filter: blur`), az állapot `aria-pressed`, megmarad újraindítás után is. Gyorsbillentyű: `P`.

## 5. Képernyők

### Mobil (0–767 px)

Fentről lefelé az Áttekintés: fejléc (hónap, cím, privacy gomb), hero kártya, lejárt sáv, napokra csoportosított lista ("Ma, szombat", "Holnap, vasárnap", "Hétfő, szeptember 21."), alsó navigáció. A lista 7 napot mutat, alatta "Még N tétel a héten" sor nyitja a teljes hetet. Az alsó sáv `env(safe-area-inset-bottom)` paddinget kap.

### Tablet (768–1023 px)

Ikonos oldalsáv (72 px), egy oszlopos tartalom max. 720 px-en, a naptár a hero alatt jelenik meg. Az új tétel dialog.

### Asztali (1024 px felett)

```
+------------+---------------------------------------------------------+
| Oldalsáv   |  Áttekintés                    [Keresés /] [szem] [Új tétel] |
| 232 px     |  [Lejárt sáv]                                            |
|            |  +-----------------------------+ +---------------------+ |
| Logó       |  | Hero kártya                 | | Naptár (hónap)      | |
| Áttekintés |  | 84 200 Ft, számlák          | |                     | |
| Naptár     |  +-----------------------------+ +---------------------+ |
| Tételek    |  | Következő napok             | | Szeptember összesen | |
| Számlák    |  | szűrők: Mind Revolut ...    | | számlák + haladás   | |
| Beállítások|  | napokra bontott sorok       | |                     | |
|            |  +-----------------------------+ +---------------------+ |
| Háztartás  |                                                          |
+------------+---------------------------------------------------------+
```

- Oldalsáv 232 px, a tartalom max. **1200 px** széles és középre igazított, nagy monitoron nem nyúlik szét.
- 12 oszlopos rács, 24 px oszloptávolság: bal oszlop 8, jobb oszlop 4 (naptár és összesítő, `position: sticky`).
- A lista asztalon **táblázatos**: ikon és név, számla, esedékesség, összeg, státusz, műveletek. A "Kifizettem" gomb sor fölé húzva jelenik meg, és mindig elérhető billentyűzettel (Tab).
- A Tételek oldal: szűrők (számla, gyakoriság, státusz), rendezés fejlécre kattintva, oldalt nyíló részlet panel (480 px, tétel szerkesztése és a kifizetések előzménye).
- Egér és billentyűzet: látható fókuszgyűrű (2 px `--accent` + 2 px `--bg` rés), `/` keresés, `N` új tétel, `G` majd `C` naptár, `P` privacy mód, `Esc` bezár.
- Hover állapot csak asztalon (`@media (hover: hover)`), érintőképernyőn nem marad "ragadt" hover.

## 6. PWA-specifikus követelmények

**Manifest**
- `name`: "BudgetBuddy: fix kiadások", `short_name`: "Fix kiadások", `display: "standalone"`, `start_url: "/?source=pwa"`, `lang: "hu"`.
- `theme_color` és `background_color`: `#F5FBFB` (világos), sötétre `#0C1214` külön `<meta name="theme-color" media="(prefers-color-scheme: dark)">`.
- Ikonok: 192, 512, **maskable** 512 (a jel a biztonságos 80%-on belül), Apple touch icon 180.
- `shortcuts`: "Új tétel", "Mai esedékes" (hosszú nyomásra az ikonon).

**Viewport és biztonságos zóna**
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, az alsó és felső sáv `env(safe-area-inset-*)` paddinget kap. Az egész képernyős rétegek `dvh` egységet használnak, nem `vh`-t.

**Offline és gyorsítótár**
- App shell precache (Workbox, `vite-plugin-pwa`). Az API GET-ek stale-while-revalidate, hogy a lista és a naptár utolsó ismert állapota offline is látszik.
- Offline állapotban vékony sáv jelzi: "Nincs kapcsolat, az utolsó mentett állapotot látod".
- A "Kifizettem" és a szerkesztés offline sorba kerül (IndexedDB queue), újra kapcsolódáskor automatikusan szinkronizál, a sor mellett "Szinkronizálásra vár" jelzés. Ütközésnél (két eszközön ugyanaz) a szerver időbélyege dönt, a felhasználó értesítést kap.
- Kijelentkezéskor a gyorsítótár és az IndexedDB is törlődik.

**Telepítés**
- Saját telepítési felület (ne a böngésző alapértelmezett bannere): a harmadik látogatás után, vagy a Beállításokban, "Telepítés a kezdőképernyőre" gombbal. iOS-en rövid útmutatás (Megosztás, majd Kezdőképernyőhöz adás).

**Értesítések**
- Web Push (VAPID). Emlékeztető a tétel saját "N nappal előtte" beállítása szerint, plusz reggeli összefoglaló az aznapi esedékesekről (idő beállítható).
- iOS-en a Web Push csak a kezdőképernyőre telepített appban működik, ezt az első bekapcsolásnál el kell mondani. Az értesítés koppintásra a tételre mutat, az értesítésen "Kifizettem" művelet is van, ahol a platform engedi.
- Badge API: a lejárt és a mai esedékes tételek száma az app ikonján, ahol támogatott.

## 7. Állapotok és szövegek

- **Töltés:** a hero és a sorok helyén skeleton (a végleges méretben, nem ugrál az elrendezés).
- **Üres:** "Vedd fel az első fix kiadásodat" + rövid magyarázat egy mondatban + "Új tétel" gomb. Nincs bocsánatkérő szöveg.
- **Hiba:** mondja meg, mi történt és mit tehet a felhasználó. Példa: "Nem sikerült elmenteni. Nincs kapcsolat, a változtatás sorba került." Nincs "Hiba:" előtag és nincs nyers kivételüzenet.
- **Siker:** rövid toast, visszavonás lehetőséggel 6 másodpercig: "Kifizetve. Visszavonás".
- Szövegek: mondatkezdő nagybetű, aktív igék, az ellentmondó szinonimák kerülése ("tétel" végig, nem váltakozik "kiadás" és "számla" között).
- Az app hu és en nyelvű (`i18next`), minden új szöveg mindkét fájlba kerül.

## 8. Akadálymentesség

- Szöveg kontraszt legalább AA (4,5:1), nagy szöveg és grafika 3:1. A tokenek ehhez vannak kiválasztva, a `--accent` kis szövegként nem használható.
- Koppintási felület legalább 44 x 44 px, a gombok közt legalább 8 px.
- Minden interaktív elem elérhető billentyűzettel, sorrend a vizuális sorrendet követi, a dialogban fókuszcsapda, `Esc` zár.
- A státusz szöveggel és ikonnal is szerepel. Az összegek `aria-label`-je teljes szöveg ("nyolcezer-kilencszáz forint").
- A privacy mód elmosott összegeit a képernyőolvasó nem olvassa fel (`aria-hidden` + "Összegek elrejtve").
- `prefers-reduced-motion`, `prefers-contrast` és `prefers-color-scheme` tiszteletben tartva. A szöveg 200%-ig nagyítható, az elrendezés nem törik.

## 9. Biztonsági szempontok a kliensben

- **Munkamenet:** lehetőleg `HttpOnly`, `Secure`, `SameSite=Lax` cookie a hozzáférési tokenre, ne `localStorage`. Ha JWT marad, rövid élettartamú access token memóriában, refresh token cookie-ban.
- **CSP:** szigorú `Content-Security-Policy` (`default-src 'self'`, nincs `unsafe-inline` szkriptre, a betűtípus önhosztolt), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Service worker:** csak `GET` kéréseket és csak a saját origint kezelje. Érzékeny válaszokat ne gyorsítótárazzon tovább a szükségesnél, kijelentkezéskor mindent törölni kell.
- **Privacy mód** és automatikus zárolás: ha az app 5 percnél tovább háttérben volt, az összegek elrejtve jönnek elő (opcionálisan PIN vagy biometria a WebAuthn-nal).
- **Beviteli validáció:** kliensen is és szerveren is (összeg, dátum, hosszkorlát), a felhasználói szöveg (tétel neve, megjegyzés) csak szövegként jelenik meg, sosem `innerHTML`-ként.
- **Push:** a feliratkozások (endpoint, kulcsok) felhasználóhoz kötve, lejárt vagy visszavont feliratkozás törlése a szerveren. Az értesítés szövege ne tartalmazzon teljes összeget, ha a felhasználó ezt kikapcsolja (zárolási képernyő védelme).
- **Bank adatok:** az app nem tárol számlaszámot, kártyaszámot vagy bejelentkezési adatot, csak a számla **megnevezését** (pl. "Revolut", "UniCredit").

## 10. Megvalósítási javaslat

- Vite + React + TypeScript, Tailwind a fenti CSS változókra építve, `shadcn/ui` primitívek (Dialog, Sheet, Popover, Toggle) a tokenekre húzva, React Query, React Router, `vite-plugin-pwa` (Workbox), `i18next`, Motion (mikro animációkhoz).
- A dizájn tokenek egy közös fájlban (`tokens.css`).
- A meglévő backend marad: a recurring items modell kap **számla** mezőt, **időszakonkénti fizetett állapotot** (tétel + hónap) és **becsült/tényleges összeg** megkülönböztetést. A Web Push új provider.
- Teszt: Playwright a fő folyamatokra (kifizetés, új tétel, offline sor), Lighthouse PWA és akadálymentesség auditot CI-ben, kézi ellenőrzés iPhone-on (telepített PWA) és Androidon.
