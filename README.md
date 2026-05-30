# Wigellkoncernens Biluthyrning - Medarbetar- & Utvecklarmanual

Välkommen till projektet för Wigellkoncernens biluthyrningssystem! Det här är ett modernt och lyxigt system för biluthyrning, byggt som en snabb Single-Page Application (SPA) i frontend som pratar med ett robust Spring Boot-API och en MySQL-databas i backend. 

Det här dokumentet guidar dig genom hur du sätter upp projektet, hur systemet fungerar och de viktigaste funktionerna vi har byggt.

---

## 🚀 Komma igång

För att köra hela systemet lokalt behöver du ha Docker, Java (JDK 24 eller senare) och Node.js (eller en enkel HTTP-server) installerat. Följ stegen nedan för att få igång allt på några minuter.

### Steg 1: Starta databasen (MySQL)
Vi använder Docker för att köra vår MySQL-databas. All testdata och schemastruktur laddas in automatiskt vid start tack vare en pre-konfigurerad `data.sql`-fil.

1. Öppna en terminal i projektets rotkatalog.
2. Starta MySQL-containern i bakgrunden:
   ```bash
   docker compose up -d
   ```
   *Detta startar databasen på port `3307` lokalt för att inte krocka med eventuella andra MySQL-installationer.*

### Steg 2: Starta backend (Spring Boot)
Vår backend sköter all affärslogik, säkerhet (Spring Security med HTTP Basic Auth) och databashantering.

1. Navigera till backend-katalogen:
   ```bash
   cd koncernensBackend/carRentalBackend
   ```
2. Bygg och starta Spring Boot-applikationen:
   ```bash
   mvn spring-boot:run
   ```
   *Servern kommer att starta på `http://localhost:8080`.*

### Steg 3: Starta frontend (SPA)
Eftersom frontend är en ren Single Page Application byggd med klassisk HTML, CSS och JavaScript, behöver vi bara servera filerna över HTTP. För att undvika CORS-problem bör den köras på port `5500`.

1. Gå tillbaka till projektets rotkatalog.
2. Starta en lokal webbserver, till exempel med `http-server` (installeras/körs enkelt via npx):
   ```bash
   npx -y http-server -p 5500 -a 127.0.0.1
   ```
3. Öppna din webbläsare och besök: `http://127.0.0.1:5500`

---

## 🔑 Testkonton

Databasen är förberedd med två primära roller för att du enkelt ska kunna testa alla flöden:

| Användarnamn | Lösenord | Roll | Beskrivning |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin` | `ROLE_ADMIN` | Full åtkomst till administrationspanelen (CRUD för bilar, bokningar och användare). |
| **`user`** | `user` | `ROLE_USER` | Standardkund. Kan bläddra bland bilar, göra bokningar och se sin profil. |

---

## 🎨 Design & Tillgänglighet (WCAG)

Vi har valt en premium-estetik med mörkt tema och eleganta gulddetaljer som ger en exklusiv känsla. Men design handlar om mer än bara utseende – tillgänglighet har varit en grundpelare:

* **Hög kontrast**: Färgkombinationerna uppfyller WCAG AAA för stor text och AA för vanlig brödtext.
* **Tangentbordsnavigering**: Alla interaktiva element och formulär har tydliga fokusmarkeringar (`:focus-visible`). Administratörer kan till och med sortera tabeller enbart med tangentbordet (tack vare `tabindex` och Enter-lyssnare på tabellhuvuden).
* **Skärmläsarvänligt**: Formulärfält använder alltid tydligt kopplade `<label>`-element och kompletterande `aria-label`-attribut där det behövs.

Om du vill läsa mer eller se exempel på komponenterna, spana in fliken **Designsystem / Styleguide** direkt i applikationen!

---

## ✨ Nyckelfunktioner i Frontend

### 📱 Snabbt & responsivt SPA-flöde
Inga jobbiga sidomladdningar! Frontend använder hash-baserad routing (`#bilar`, `#kontakt`, `#admin`, etc.) vilket ger en direkt respons och en app-liknande känsla. Gränssnittet anpassar sig dessutom sömlöst till allt från små mobilskärmar till stora desktop-skärmar.

### 🚗 Filtrering & Sortering av Bilflottan
Kunder kan enkelt sortera bilarna på namn eller pris, samt filtrera på biltyp (t.ex. SUV, Sport, Familjebil) direkt i gränssnittet.

### 💳 Detaljerat Återlämnings- & Betalningsflöde
Detta är ett av systemets mest omfattande flöden och kan startas antingen av kunden (via profilsidan) eller av en administratör (via admin-panelen) när en bil lämnas tillbaka:
1. **Smarta kostnadsberäkningar**: Systemet räknar ut antal hyrda dagar (minst 1 dygn debiteras alltid). Om bilen lämnas tillbaka för sent beräknas en **förseningsavgift på 5% per dygn** på grundpriset.
2. **Säkerhet mot trasig data**: Om en bokning saknar en giltig kund i databasen (t.ex. pga. gamla testdata) kraschar inte systemet. En try-catch-fallback tillämpar automatiskt en "Okänd Kund" så att bilen ändå kan returneras och stängas.
3. **Tre flexibla betalsätt**:
   * **Kontant**: Mata in beloppet kunden betalar så räknar systemet ut växeln direkt. Knappen för att slutföra låses upp först när full betalning har erhållits.
   * **Kort**: En interaktiv laddnings- och blippsimulering visar hur transaktionen godkänns och genererar en unik referenskod.
   * **Faktura**: Skapar en komplett faktura med fakturanummer, kunduppgifter, momsredovisning (25%) och en fullt fungerande utskriftsknapp kopplad till webbläsarens utskriftsfunktion (`window.print()`).
4. **API-integration**: Vid avslutat köp skickas en `PUT`-förfrågan till backend som stänger bokningen och sätter dess status till inaktiv.

### 💰 Ekonomi- & Omsättningsrapport (Alternativ C)
Administratörer har tillgång till en interaktiv **Ekonomi**-flik i kontrollpanelen:
1. **Samlad inkomst live**: Beräknar och visar total omsättning, grundhyresintäkter och intäkter från förseningsavgifter i realtid.
2. **Lokal JSON-loggning**: Vid varje avslutad återlämning sparas betalningsmetod, faktiska belopp och returdatum i webbläsarens lokala minne (`localStorage`) under nyckeln `wigell_returns`.
3. **Kombinerad sammanställning**: När ekonomifliken öppnas hämtar systemet all boknings- och fordonsdata live från backend-API:et och slår samman den med den lokala JSON-loggen för att visa en komplett transaktionshistorik.
4. **Exportera data**: Administratören kan ladda ner hela transaktionsloggen över alla inkomster som en strukturerad `.json`-fil för redovisning och revision.

---

## 📂 Projektstruktur

Här är en snabb översikt över de viktigaste filerna i projektet:

* **`index.html`**: Applikationens enda HTML-fil. Innehåller sidstrukturen, navigationsmenyn och alla modaler.
* **`script.js`**: Hjärnan i appen. Hanterar all logik, API-kommunikation, routing och rendering av gränssnittets olika vyer. Överst i filen hittar du en strukturerad innehållsförteckning över alla funktioner för att underlätta sökning.
* **`css/style.css`**: Innehåller designsystemets grundstilar, färgvariabler, layoutregler samt anpassade stilar för utskrift av fakturor (`@media print`).
* **`css/mobile.css`**: Mobilanpassade CSS-regler för att säkerställa att appen fungerar klockrent på mindre skärmar.
* **`Javascript.md`**: En djupare teknisk manual speciellt skriven för utvecklare som vill förstå JavaScript-arkitekturen och API-anropen i detalj.

---

Tack för att du jobbar med Wigellkoncernens biluthyrningssystem! Om du stöter på några problem eller vill föreslå förbättringar, tveka inte att öppna en diskussion eller kontakta utvecklarteamet. Kör försiktigt! 🚗💨
