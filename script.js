/* 
========================================================================
INDEX / INNEHÅLLSFÖRTECKNING ÖVER FUNKTIONER I script.js
Sök efter det exakta funktionsnamnet (inklusive parenteser) för att snabbt navigera.
========================================================================

# APPLIKATIONS-INITIALISERING & NAVIGATION
- app.init()                              - Initierar applikationen och lyssnar på hashchanges
- app.handleRoute()                       - Hanterar routing baserat på URL-hash
- app.navigate(hash)                      - Programmatisk navigering till angiven hash

# VIEWS / VYER (SPA)
- app.showCustomer()                      - Visar kundvyn med bilflottan
- app.showContact()                       - Visar kontaktinformation
- app.showStyleguide()                    - Visar systemets styleguide (designsystem)
- app.showLogin()                         - Visar inloggningsvyn
- app.showRegister()                      - Visar registreringsvyn
- app.showAdmin()                         - Visar admin-vyn (inlogg eller dashboard)
- app.showProfile()                       - Visar användarprofilen och aktiva bokningar

# API & AUTENTISERING
- app.api(endpoint, method, body)         - Generell helper för API-anrop med Basic Auth
- app.setAuth(username, password)         - Sätter Basic Auth-sträng och användarroll
- app.updateNavbar()                      - Uppdaterar navigeringsfältet baserat på auth-status
- app.handleLogin(e)                      - Hanterar inloggningsformulär
- app.handleRegister(e)                   - Hanterar registreringsformulär
- app.logout()                            - Loggar ut användaren och rensar sessionen

# BILFLOTTA & SÖKNING / FILTER (KUNDSIDA)
- app.renderLayout(title, subtitle)       - Renderar baslayouten för kundvyn
- app.renderCars()                        - Filtrerar, sorterar och renderar bilkort
- app.setCarFilter(val)                   - Sätter filtertyp för bilar (all, sedan, suv, etc)
- app.setCarSort(val)                     - Sätter sorteringsordning för bilar
- app.getCarImage(car)                    - Returnerar bildsökväg baserat på bilmodell

# BOKNING
- app.showBookingForm(carId)              - Visar bokningsformuläret i en modal
- app.handleBooking(e, carId)             - Skickar bokningsförfrågan till API:et

# ADMIN DASHBOARD
- app.renderAdminLogin()                  - Renderar inloggningsformulär för admin
- app.handleAdminLogin(e)                 - Hanterar inloggningsförsök för admin
- app.renderAdminDashboard()              - Renderar admin-panelen med sidonavigering
- app.loadAdminData(type)                 - Hämtar data från API för bilar/bokningar/användare
- app.renderAdminTable()                  - Renderar vald tabell i admin-panelen
- app.setAdminSort(field)                 - Sätter sorteringsfält för admin-tabeller
- app.sortData(data)                      - Sorterar administrativ data
- app.showAdminRevenue()                  - Beräknar och visar samlad inkomst och transaktioner
- app.exportRevenueJSON()                 - Exporterar intäktstransaktionerna som JSON-fil

# ADMIN TABELLER & CRUD
- app.renderCarsTable()                   - Renderar tabellen för bilar
- app.showAddCarForm()                    - Visar formulär för att lägga till ny bil
- app.showEditCarForm(id)                 - Visar formulär för att redigera en bil
- app.renderCarForm(title, action, car)   - Renderar bilformuläret
- app.handleAddCar(e)                     - Sparar en ny bil via API:et
- app.handleEditCar(e, id)                - Uppdaterar en bil via API:et
- app.renderBookingsTable()               - Renderar tabellen för bokningar
- app.renderUsersTable()                  - Renderar tabellen för användare
- app.showUserModal(userId)               - Visar modal för att lägga till/redigera användare
- app.handleUserSubmit(e, userId)         - Sparar eller uppdaterar en användare via API:et
- app.deleteItem(type, id)                - Raderar en bil/bokning/användare via API:et

# PROFILREDIGERING
- app.handleProfileSubmit(e)              - Uppdaterar användarens egna profiluppgifter

# MODALER (KONTAKT & ÅTERLÄMNING)
- app.showContactModal()                  - Visar allmänt kontaktformulär
- app.handleContactSubmit(e)              - Hanterar kontaktformulär
- app.closeModal()                        - Stänger den aktiva modalen

# RETUR- & BETALFLÖDE
- app.showReturnModal(bookingId)          - Startar returflödet, beräknar priser och ev. straffavgift
- app.renderReturnStep1()                 - Renderar steg 1: Sammanfattning av avgifter & val av betalsätt
- app.renderReturnCash()                  - Renderar steg 2 (Kontant): Inmatning av kontanter & växelberäkning
- app.calculateCashChange(totalPrice)     - Beräknar växel i realtid vid kontantbetalning
- app.renderReturnCard()                  - Renderar steg 2 (Kort): Kortterminalsimulering
- app.simulateCardTap()                   - Simulerar blippning och auktorisering av kort
- app.renderReturnInvoice()               - Renderar steg 2 (Faktura): Skapar utskriftsvänlig faktura med Skriv ut-knapp
- app.completeReturn(bookingId)           - Slutför returen mot API:et (PUT /bookings/return/{id})
========================================================================
*/

const app = {
    // Configuration
    baseUrl: 'http://localhost:8080/api/v1',
    user: null,
    auth: null,
    cars: [],
    bookings: [],
    users: [],
    carSort: { field: 'name', asc: true },
    carFilterType: 'all',
    adminSort: { field: 'id', asc: true },
    currentAdminType: null,

    async init() {
        console.log("Wigells Car Rental SPA Initialized");
        window.addEventListener('hashchange', () => this.handleRoute());
        
        if (!window.location.hash) {
            window.location.hash = '#bilar';
        } else {
            await this.handleRoute();
        }
    },

    async handleRoute() {
        const hash = window.location.hash || '#bilar';
        
        // Ta bort active-klass från alla nav-länkar
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

        if (hash === '#bilar') {
            document.getElementById('nav-fleet')?.classList.add('active');
            await this.showCustomer();
        } else if (hash === '#kontakt') {
            document.getElementById('nav-contact')?.classList.add('active');
            this.showContact();
        } else if (hash === '#styleguide') {
            this.showStyleguide();
        } else if (hash === '#admin') {
            if (this.auth && this.user && (this.user.role === 'ADMIN' || this.user.role === 'ROLE_ADMIN')) {
                document.getElementById('nav-admin-link')?.classList.add('active');
                this.showAdmin();
            } else {
                window.location.hash = '#login';
            }
        } else if (hash === '#login') {
            document.getElementById('nav-login-link')?.classList.add('active');
            this.showLogin();
        } else if (hash === '#register') {
            this.showRegister();
        } else {
            window.location.hash = '#bilar';
        }
    },

    navigate(hash) {
        if (window.location.hash === hash) {
            this.handleRoute();
        } else {
            window.location.hash = hash;
        }
    },

    showStyleguide() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="view-fade" style="padding: 2rem 0">
                <div class="styleguide-header">
                    <h1 class="h1-premium">Wigells Designsystem</h1>
                    <p class="text-muted">Komplett Styleguide (WCAG AA/AAA) för Wigellkoncernens Biluthyrning</p>
                </div>

                <section class="styleguide-section">
                    <h2 class="h2-premium">1. Färger (WCAG-Godkända)</h2>
                    <p class="text-muted">Följande CSS-variabler används för att bibehålla en lyxig Gold/Dark-mode estetik. Kontrasten mellan <span style="color:var(--color-brand-primary)">Guld</span> och <span style="color:var(--color-bg-base); background:#fff; padding:0 4px">Svart</span> uppfyller WCAG AAA för stor text och AA för normal text.</p>
                    
                    <div class="grid grid-3" style="margin-top:2rem">
                        <div class="card" style="padding:1rem; text-align:center">
                            <div style="height:60px; background:var(--color-brand-primary); border-radius:8px; margin-bottom:1rem"></div>
                            <p><strong>Primary Gold</strong></p>
                            <p class="text-muted text-small"><code>var(--color-brand-primary)</code></p>
                            <p class="text-muted text-small">HEX: #d4af37</p>
                        </div>
                        <div class="card" style="padding:1rem; text-align:center">
                            <div style="height:60px; background:var(--color-bg-base); border:1px solid #333; border-radius:8px; margin-bottom:1rem"></div>
                            <p><strong>Background Base</strong></p>
                            <p class="text-muted text-small"><code>var(--color-bg-base)</code></p>
                            <p class="text-muted text-small">HEX: #0a0a0b</p>
                        </div>
                        <div class="card" style="padding:1rem; text-align:center">
                            <div style="height:60px; background:var(--color-text-main); border-radius:8px; margin-bottom:1rem"></div>
                            <p><strong>Text Main</strong></p>
                            <p class="text-muted text-small"><code>var(--color-text-main)</code></p>
                            <p class="text-muted text-small">HEX: #f5f5f7</p>
                        </div>
                    </div>
                    <div class="code-block">/* I CSS använd: */
color: var(--color-brand-primary);
background-color: var(--color-bg-base);</div>
                </section>

                <section class="styleguide-section">
                    <h2 class="h2-premium">2. Typografi</h2>
                    <p class="text-muted">Inter används för att ge ett rent, modernt utseende med utmärkt läsbarhet.</p>
                    
                    <div style="margin-top:2rem; display:flex; flex-direction:column; gap:1.5rem">
                        <div>
                            <h1 class="h1-premium">Heading 1 Premium</h1>
                            <div class="code-block">&lt;h1 class="h1-premium"&gt;Heading 1 Premium&lt;/h1&gt;</div>
                        </div>
                        <div>
                            <h2 class="h2-premium">Heading 2 Premium</h2>
                            <div class="code-block">&lt;h2 class="h2-premium"&gt;Heading 2 Premium&lt;/h2&gt;</div>
                        </div>
                        <div>
                            <p>Standard brödtext. Används för den mesta texten och har hög kontrast (WCAG AAA) mot den mörka bakgrunden.</p>
                            <div class="code-block">&lt;p&gt;Standard brödtext.&lt;/p&gt;</div>
                        </div>
                        <div>
                            <p class="text-muted">Muted text. Används för sekundär information (WCAG AA).</p>
                            <div class="code-block">&lt;p class="text-muted"&gt;Muted text.&lt;/p&gt;</div>
                        </div>
                        <div>
                            <p class="text-small">Small text. För ID:n och små detaljer.</p>
                            <div class="code-block">&lt;p class="text-small"&gt;Small text.&lt;/p&gt;</div>
                        </div>
                    </div>
                </section>

                <section class="styleguide-section">
                    <h2 class="h2-premium">3. Knappar (Interactive Elements)</h2>
                    <p class="text-muted">Alla interaktiva element har en tydlig focus-state (<code>:focus-visible</code>) för tangentbordsanvändare (WCAG krav).</p>
                    
                    <div style="display:flex; gap:1rem; margin-top:2rem; flex-wrap:wrap">
                        <button class="btn btn-primary" aria-label="Exempelknapp primär">Primary Button</button>
                        <button class="btn btn-outline" aria-label="Exempelknapp sekundär">Outline Button</button>
                        <button class="btn btn-danger" aria-label="Exempelknapp fara">Danger Button</button>
                    </div>
                    <div class="code-block">&lt;!-- CSS-klasser: btn, btn-primary, btn-outline, btn-danger --&gt;
&lt;button class="btn btn-primary" aria-label="Skärmuppläsar-text"&gt;Boka nu&lt;/button&gt;</div>
                </section>

                <section class="styleguide-section">
                    <h2 class="h2-premium">4. Formulär (Inputs & Selects)</h2>
                    <p class="text-muted">Formulären måste ha synliga ledtexter (labels) för tillgänglighet. Focus-markering är guld.</p>
                    
                    <div class="card" style="padding:2rem; margin-top:2rem; max-width:400px">
                        <div class="form-group">
                            <label class="form-label" for="example-input">Användarnamn</label>
                            <input type="text" id="example-input" class="form-input" placeholder="Ange ditt namn">
                        </div>
                        <div class="form-group" style="margin-top:1rem">
                            <label class="form-label" for="example-select">Välj typ</label>
                            <select id="example-select" class="form-input">
                                <option>Alla</option>
                                <option>SUV</option>
                            </select>
                        </div>
                    </div>
                    <div class="code-block">&lt;div class="form-group"&gt;
    &lt;label class="form-label" for="username"&gt;Användarnamn&lt;/label&gt;
    &lt;input type="text" id="username" class="form-input" placeholder="..."&gt;
&lt;/div&gt;</div>
                </section>

                <section class="styleguide-section">
                    <h2 class="h2-premium">5. Kort (Cards) & Tabeller (Tables)</h2>
                    <p class="text-muted">Används för dynamiskt innehåll. Kort används för bilarna och tabeller för adminvyn. Båda stödjer responsivitet och hover-effekter.</p>
                    
                    <div class="card" style="padding:2rem; margin-top:2rem">
                        <span class="badge">Premium</span>
                        <h3 class="h2-premium" style="margin-top:1rem">Kort Exempel</h3>
                        <p class="text-muted">Detta är en <code>.card</code> med en <code>.badge</code> inuti.</p>
                    </div>

                    <div class="table-container" style="margin-top:2rem">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th tabindex="0" class="sortable-th">Kolumn 1 (Klickbar/Focus)</th>
                                    <th tabindex="0" class="sortable-th">Kolumn 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Värde A</td><td>Värde B</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="code-block">&lt;div class="card"&gt;
    &lt;span class="badge"&gt;Premium&lt;/span&gt;
    &lt;h3 class="h2-premium"&gt;...&lt;/h3&gt;
&lt;/div&gt;

&lt;table class="table"&gt;
    &lt;thead&gt;
        &lt;tr&gt;
            &lt;th tabindex="0" class="sortable-th"&gt;Kolumn&lt;/th&gt;
        &lt;/tr&gt;
    &lt;/thead&gt;
&lt;/table&gt;</div>
                </section>

                <div style="text-align: center; margin-top: 4rem">
                    <button class="btn btn-outline" onclick="app.navigate('#admin')">Tillbaka till Admin</button>
                </div>
            </div>
        `;
    },

    // Helper for API calls with Basic Auth
    async api(endpoint, method = 'GET', body = null) {
        let headers = {};
        let config = { method };

        if (this.auth) {
            headers['Authorization'] = 'Basic ' + this.auth;
        }

        if (body instanceof FormData) {
            // Fetch sätter rätt Content-Type automatiskt för FormData (inkl. boundary)
            config.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            if (body) config.body = JSON.stringify(body);
        }

        config.headers = headers;

        try {
            console.log(`API Call: ${method} ${endpoint}`);
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            
            if (response.status === 401) throw new Error("Obehörig - Kontrollera inloggning");
            if (!response.ok) throw new Error(`Serverfel: ${response.status}`);
            
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (err) {
            console.error("API Error:", err);
            throw err;
        }
    },

    setAuth(username, password) {
        this.auth = btoa(`${username}:${password}`);
        // Vi sätter rollen baserat på username tills handleLogin körs 
        // men handleLogin kommer nu sköta detta mer strikt via backend
        this.user = { username, role: username === 'admin' || username === 'wigell' ? 'ADMIN' : 'USER' };
        this.updateNavbar();
    },

    updateNavbar() {
        const loginItem = document.getElementById('nav-login-item');
        const adminItem = document.getElementById('nav-admin-item');
        const userInfo = document.getElementById('nav-user-info');
        const userDisplay = document.getElementById('user-display-name');

        if (this.auth) {
            loginItem.style.display = 'none';
            if (adminItem) adminItem.style.display = this.user.role === 'ADMIN' ? 'block' : 'none';
            userInfo.style.display = 'flex';
            userInfo.style.alignItems = 'center';
            userDisplay.textContent = this.user.username.toUpperCase();
        } else {
            loginItem.style.display = 'block';
            if (adminItem) adminItem.style.display = 'none';
            userInfo.style.display = 'none';
        }
    },

    showLogin() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div style="max-width:400px; margin: 8rem auto;" class="card view-fade">
                <div class="card-content" style="padding:2.5rem">
                    <h2 style="margin-bottom:1.5rem">Logga in</h2>
                    <form onsubmit="app.handleLogin(event)">
                        <label for="login-user" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary); font-size:0.8rem">ANVÄNDARNAMN</label>
                        <input type="text" id="login-user" required style="width:100%; padding:0.9rem; margin-bottom:1rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                        
                        <label for="login-pass" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary); font-size:0.8rem">LÖSENORD</label>
                        <input type="password" id="login-pass" required style="width:100%; padding:0.9rem; margin-bottom:1.5rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                        
                        <button class="btn btn-primary" style="margin-bottom:1rem">LOGGA IN</button>
                        <p style="text-align:center; font-size:0.8rem; color:var(--color-text-muted)">Saknar du konto? <a href="#" onclick="app.showRegister(); return false;" style="color:var(--color-brand-primary)">Registrera dig här</a></p>
                    </form>
                </div>
            </div>
        `;
    },

    showRegister() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div style="max-width:400px; margin: 8rem auto;" class="card view-fade">
                <div class="card-content" style="padding:2.5rem">
                    <h2 style="margin-bottom:1.5rem">Skapa Konto</h2>
                    <form onsubmit="app.handleRegister(event)">
                        <label class="form-label" for="reg-user">VALFRITT ANVÄNDARNAMN</label>
                        <input type="text" id="reg-user" required class="form-input" style="margin-bottom:1rem">
                        
                        <label class="form-label" for="reg-pass">LÖSENORD</label>
                        <input type="password" id="reg-pass" required class="form-input" style="margin-bottom:1.5rem">
                        
                        <button class="btn btn-primary" style="margin-bottom:1rem">SKAPA KONTO</button>
                        <p style="text-align:center; font-size:0.8rem; color:var(--color-text-muted)">Har du redan ett konto? <a href="#" onclick="app.showLogin(); return false;" style="color:var(--color-brand-primary)">Logga in</a></p>
                    </form>
                </div>
            </div>
        `;
    },

    showContact() {
        this.renderLayout("Kontakta Oss", "Vi finns här för att hjälpa dig dygnet runt.");
        const content = document.getElementById('view-container');
        content.innerHTML = `
            <div class="card view-fade" style="max-width:600px; margin: 2rem auto;">
                <div class="card-content" style="padding:3rem">
                    <h2 class="h2-premium" style="margin-bottom:2rem; text-align:center">Hör av dig</h2>
                    <div style="display:grid; gap:2rem; margin-bottom: 2.5rem">
                        <div style="display:flex; align-items:center; gap:1.5rem">
                            <div style="background:var(--color-brand-primary); color:black; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem">💬</div>
                            <div>
                                <h3 style="color:white; margin:0">Chatta med oss</h3>
                                <p style="color:var(--color-text-muted); margin-top:0.3rem">Öppettider: 08:00 - 17:00 (Mån-Fre)</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:1.5rem">
                            <div style="background:var(--color-brand-primary); color:black; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem">📞</div>
                            <div>
                                <h3 style="color:white; margin:0">Telefon</h3>
                                <p style="color:var(--color-text-muted); margin-top:0.3rem">08-123 45 67 (Dygnet runt för akuta ärenden)</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:1.5rem">
                            <div style="background:var(--color-brand-primary); color:black; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem">📍</div>
                            <div>
                                <h3 style="color:white; margin:0">Besöksadress</h3>
                                <p style="color:var(--color-text-muted); margin-top:0.3rem">Guldgatan 1, 111 22 Stockholm</p>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" onclick="app.showContactModal()">Skicka ett meddelande</button>
                </div>
            </div>
        `;
    },

    showContactModal() {
        const backdrop = document.getElementById('modal-backdrop');
        const container = document.getElementById('modal-container');
        
        container.innerHTML = `
            <button class="modal-close" onclick="app.closeModal()" aria-label="Stäng modal">&times;</button>
            <h2 class="h2-premium" style="margin-bottom:1.5rem">Skicka meddelande</h2>
            <form onsubmit="app.handleContactSubmit(event)">
                <label class="form-label" for="contact-name">NAMN</label>
                <input type="text" id="contact-name" required class="form-input" style="margin-bottom:1rem" placeholder="För- och efternamn">
                
                <label class="form-label" for="contact-email">E-POST</label>
                <input type="email" id="contact-email" required class="form-input" style="margin-bottom:1rem" placeholder="din.epost@exempel.se">
                
                <label class="form-label" for="contact-msg">MEDDELANDE</label>
                <textarea id="contact-msg" required class="form-input" style="margin-bottom:1.5rem; height:120px; resize:vertical" placeholder="Hur kan vi hjälpa dig?"></textarea>
                
                <button class="btn btn-primary">SKICKA</button>
            </form>
        `;
        
        backdrop.style.display = 'flex';
        // Trigger reflow to ensure transition works
        void backdrop.offsetWidth;
        backdrop.classList.add('active');
    },

    closeModal() {
        const backdrop = document.getElementById('modal-backdrop');
        backdrop.classList.remove('active');
        setTimeout(() => {
            backdrop.style.display = 'none';
        }, 300);
    },

    handleContactSubmit(e) {
        e.preventDefault();
        alert("Tack för ditt meddelande! Vi återkommer så snart vi kan.");
        this.closeModal();
    },

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-user').value;
        const password = document.getElementById('login-pass').value;
        
        try {
            // Använd LoginController för validering
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) throw new Error("Inloggning misslyckades");

            const data = await response.json();
            
            // Spara auth för framtida anrop
            this.auth = btoa(`${username}:${password}`);
            this.user = { 
                id: data.userId,
                username: data.username, 
                role: data.isAdmin ? 'ADMIN' : 'USER' 
            };
            
            this.updateNavbar();
            
            if (data.isAdmin) this.navigate('#admin');
            else this.navigate('#bilar');

        } catch (err) {
            alert("Inloggning misslyckades. Kontrollera användarnamn och lösenord.");
            this.auth = null;
            this.user = null;
            this.updateNavbar();
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('reg-user').value;
        const password = document.getElementById('reg-pass').value;

        try {
            // Vi använder POST /users från din UserController (utgår från att den finns och är öppen för registrering)
            // Om din backend kräver admin för att skapa users kan denna behöva justeras
            await this.api('/users', 'POST', { username, password, role: 'USER' });
            alert("Konto skapat! Du kan nu logga in.");
            this.navigate('#login');
        } catch (err) {
            alert("Kunde inte registrera: " + err.message);
        }
    },

    // --- CUSTOMER VIEWS ---

    async showCustomer() {
        this.renderLayout("Vår Vagnpark", "Upplev friheten med Wigells Gold Standard.");
        const grid = document.getElementById('view-container');
        grid.innerHTML = '<div class="grid grid-3" id="car-grid"><div style="grid-column:1/-1; text-align:center">Laddar vagnparken...</div></div>';

        try {
            const data = await this.api('/cars');
            this.cars = data || [];
            
            // Re-render hero to ensure it's visible
            const container = document.getElementById('app-content');
            if (container && !container.querySelector('.hero')) {
                this.renderLayout("Vår Vagnpark", "Upplev friheten med Wigells Gold Standard.");
            }
            
            this.renderCars();
        } catch (err) {
            document.getElementById('car-grid').innerHTML = `<p style="grid-column:1/-1; text-align:center">Kunde inte hämta bilar. Körs backend?</p>`;
        }
    },

    renderLayout(title, subtitle) {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="hero view-fade">
                <h1 class="h1-premium">${title}</h1>
                <p>${subtitle}</p>
            </div>
            <div id="view-container"></div>
        `;
    },

    renderCars() {
        const grid = document.getElementById('view-container');
        if (!grid) return;
        
        const types = [...new Set(this.cars.map(c => c.type || 'Premium'))];

        let filteredCars = [...this.cars];
        if (this.carFilterType && this.carFilterType !== 'all') {
            filteredCars = filteredCars.filter(car => (car.type || 'Premium') === this.carFilterType);
        }

        filteredCars.sort((a, b) => {
            let valA = a[this.carSort.field] || '';
            let valB = b[this.carSort.field] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return this.carSort.asc ? -1 : 1;
            if (valA > valB) return this.carSort.asc ? 1 : -1;
            return 0;
        });

        grid.innerHTML = `
            <div class="controls-bar view-fade" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem">
                <div style="display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap">
                    <div>
                        <label class="form-label" style="display:inline; margin-right:0.5rem" for="car-filter-select">Filtrera på typ:</label>
                        <select id="car-filter-select" class="form-input" style="width:auto; display:inline-block" onchange="app.setCarFilter(this.value)">
                            <option value="all" ${this.carFilterType==='all'?'selected':''}>Alla typer</option>
                            ${types.map(t => `<option value="${t}" ${this.carFilterType===t?'selected':''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="form-label" style="display:inline; margin-right:0.5rem" for="car-sort-select">Sortera på:</label>
                        <select id="car-sort-select" class="form-input" style="width:auto; display:inline-block" onchange="app.setCarSort(this.value)">
                            <option value="name_asc" ${this.carSort.field==='name'&&this.carSort.asc?'selected':''}>Namn (A-Ö)</option>
                            <option value="name_desc" ${this.carSort.field==='name'&&!this.carSort.asc?'selected':''}>Namn (Ö-A)</option>
                            <option value="type_asc" ${this.carSort.field==='type'&&this.carSort.asc?'selected':''}>Typ (A-Ö)</option>
                            <option value="type_desc" ${this.carSort.field==='type'&&!this.carSort.asc?'selected':''}>Typ (Ö-A)</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="grid grid-3" id="car-grid">
            ${filteredCars.map(car => `
                <div class="card view-fade">
                    <div class="card-img-container">
                        <img src="${this.getCarImage(car)}" class="car-photo" alt="${car.name}" onerror="this.src='koncernensBackend/images/corvetteZ06.jpg'">
                    </div>
                    <div class="card-content">
                        <div style="display:flex; justify-content:space-between; align-items:start">
                            <span class="badge">${car.type || 'Premium'}</span>
                            <span class="text-small">ID: ${car.id}</span>
                        </div>
                        <h2 class="h2-premium" style="font-size:1.5rem; margin-top:0.5rem; margin-bottom:0.8rem">${car.name} <span style="font-weight:400; color:var(--color-text-muted)">${car.model}</span></h2>
                        
                        <div style="margin-bottom:1.5rem; flex-grow:1">
                            <ul style="list-style:none; padding:0; display:flex; gap:1rem; flex-wrap:wrap">
                                ${car.feature1 ? `<li class="text-small"><span style="color:var(--color-brand-primary)">✓</span> ${car.feature1}</li>` : ''}
                                ${car.feature2 ? `<li class="text-small"><span style="color:var(--color-brand-primary)">✓</span> ${car.feature2}</li>` : ''}
                            </ul>
                        </div>

                        <div class="price-box">
                            <span class="price-value">${car.price} SEK</span>
                            <span class="price-unit">/ dygn</span>
                        </div>
                        <button class="btn btn-primary" onclick="app.showBookingForm(${car.id})">Boka nu</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    setCarFilter(val) {
        this.carFilterType = val;
        this.renderCars();
    },

    setCarSort(val) {
        const parts = val.split('_');
        this.carSort.field = parts[0];
        this.carSort.asc = parts[1] === 'asc';
        this.renderCars();
    },

    getCarImage(car) {
        const name = (car.name || "").toLowerCase();
        const model = (car.model || "").toLowerCase();
        if (name.includes('corvette')) return 'koncernensBackend/images/corvetteZ06.jpg';
        if (name.includes('bmw')) return 'koncernensBackend/images/BMWM440I.jpg';
        if (name.includes('mercedes')) return 'koncernensBackend/images/MercedesBenzMarcoPolo300.jpg';
        if (name.includes('nissan')) return 'koncernensBackend/images/NissanJuke.jpg';
        if (name.includes('peugeot')) return 'koncernensBackend/images/peugeotTraveller.jpg';
        if (name.includes('skoda') && model.includes('enyaq')) return 'koncernensBackend/images/skodaEnyaq.jpg';
        if (name.includes('skoda')) return 'koncernensBackend/images/skodaSuperb.jpg';
        if (name.includes('volkswagen')) return 'koncernensBackend/images/volkswagenBuzz.jpg';
        return 'koncernensBackend/images/corvetteZ06.jpg';
    },

    showBookingForm(carId) {
        if (!this.auth) {
            this.navigate('#login');
            return;
        }
        const car = this.cars.find(c => c.id == carId);
        const content = document.getElementById('view-container');
        content.innerHTML = `
            <div class="card view-fade responsive-two-column-grid" style="max-width:800px; margin:2rem auto; overflow:hidden">
                <div style="height:100%">
                    <img src="${this.getCarImage(car)}" style="width:100%; height:100%; object-fit:cover" onerror="this.src='koncernensBackend/images/corvetteZ06.jpg'">
                </div>
                <div style="padding:2.5rem; background:var(--color-bg-card)">
                    <span class="badge" style="margin-bottom:0.5rem">${car.type || 'Premium'}</span>
                    <h2 style="margin-bottom:0.5rem">Boka ${car.name}</h2>
                    <p style="color:var(--color-text-muted); margin-bottom:2rem">${car.model}</p>
                    
                    <form onsubmit="app.handleBooking(event, ${carId})" style="display:grid; gap:1.5rem">
                        <div>
                            <label for="book-from" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary); font-size:0.8rem">HÄMTNINGSDATUM</label>
                            <input type="date" id="book-from" required style="width:100%; padding:0.9rem; background:transparent; color:white; border:1px solid var(--border-color); border-radius:8px">
                        </div>
                        <div>
                            <label for="book-to" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary); font-size:0.8rem">RETURDATUM</label>
                            <input type="date" id="book-to" required style="width:100%; padding:0.9rem; background:transparent; color:white; border:1px solid var(--border-color); border-radius:8px">
                        </div>
                        
                        <div style="background:rgba(255,255,255,0.03); padding:1rem; border-radius:8px; margin:1rem 0">
                            <p style="font-size:0.8rem; color:var(--color-text-muted)">Pris per dygn</p>
                            <p style="font-size:1.4rem; color:var(--color-brand-primary); font-weight:700">${car.price} SEK</p>
                        </div>
 
                        <div class="responsive-two-column-grid" style="gap:1rem">
                            <button class="btn btn-primary">BEKRÄFTA</button>
                            <button type="button" class="btn btn-outline" onclick="app.navigate('#bilar')">AVBRYT</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
 
    async handleBooking(e, carId) {
        e.preventDefault();
        const bookingData = {
            carId: carId,
            fromDate: document.getElementById('book-from').value,
            toDate: document.getElementById('book-to').value
        };
 
        try {
            await this.api('/bookings', 'POST', bookingData);
            alert("Bokningen lyckades!");
            this.navigate('#bilar');
        } catch (err) {
            if (err.message.includes('403') || err.message.includes('Obehörig')) {
                alert("Åtkomst nekad (403): Du är inloggad som Admin. Endast vanliga användare (kunder) har behörighet att boka bilar enligt backend-konfigurationen. Logga in med en kundanvändare (ex: jerry/jerry) för att boka.");
            } else {
                alert("Fel vid bokning: " + err.message);
            }
        }
    },

    // --- ADMIN VIEWS ---

    showAdmin() {
        if (!this.auth || this.user.role !== 'ADMIN') {
            this.renderAdminLogin();
            return;
        }
        this.renderAdminDashboard();
    },

    renderAdminLogin() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div style="max-width:400px; margin: 8rem auto;" class="card view-fade">
                <div class="card-content" style="padding:2.5rem">
                    <h2 style="margin-bottom:1.5rem">Admin Login</h2>
                    <form onsubmit="app.handleAdminLogin(event)">
                        <label for="admin-user" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary); font-size:0.8rem">ANVÄNDARNAMN</label>
                        <input type="text" id="admin-user" value="admin" required style="width:100%; padding:0.9rem; margin-bottom:1rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                        
                        <label for="admin-pass" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary); font-size:0.8rem">LÖSENORD</label>
                        <input type="password" id="admin-pass" value="admin" required style="width:100%; padding:0.9rem; margin-bottom:1.5rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                        
                        <button class="btn btn-primary">Logga in</button>
                    </form>
                </div>
            </div>
        `;
    },

    async handleAdminLogin(e) {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        
        // Försök med Tomas eller admin/admin som fallback om DB är tom
        this.setAuth(user, pass);
        console.log("Försöker logga in med:", user);
        this.navigate('#admin');
    },

    renderAdminDashboard() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="view-fade" style="padding-top:2rem">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem">
                    <h1>Admin Kontrollpanel</h1>
                </div>
                
                <div class="admin-menu-buttons" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:1rem; margin-bottom:2rem;">
                    <button class="btn btn-outline" id="admin-btn-cars" onclick="app.loadAdminData('cars')">📦 BILAR</button>
                    <button class="btn btn-outline" id="admin-btn-bookings" onclick="app.loadAdminData('bookings')">📅 BOKNINGAR</button>
                    <button class="btn btn-outline" id="admin-btn-users" onclick="app.loadAdminData('users')">👥 ANVÄNDARE</button>
                    <button class="btn btn-outline" id="admin-btn-revenue" style="border-color: var(--color-brand-primary); color: var(--color-brand-primary);" onclick="app.showAdminRevenue()">💰 EKONOMI</button>
                    <button class="btn btn-outline" style="border-color: #555" onclick="app.showStyleguide()">🎨 STYLEGUIDE</button>
                </div>
                
                <div id="admin-table-area" class="table-container">
                    <p style="text-align:center; color:var(--color-text-muted)">Välj en kategori ovan för att visa data.</p>
                </div>
            </div>
        `;
    },

    async loadAdminData(type) {
        const area = document.getElementById('admin-table-area');
        area.innerHTML = '<p style="text-align:center" class="text-muted">Hämtar data...</p>';
        
        // Highlight active button
        document.querySelectorAll('.admin-menu-buttons button').forEach(el => el.classList.remove('active'));
        const activeBtn = document.getElementById(`admin-btn-${type}`);
        if (activeBtn) activeBtn.classList.add('active');

        try {
            const data = await this.api(`/${type}`);
            this[type] = data || [];
            this.currentAdminType = type;
            this.renderAdminTable();
        } catch (err) {
            area.innerHTML = `<p style="text-align:center; color:var(--color-danger)">Fel vid hämtning: ${err.message}</p>`;
        }
    },

    renderAdminTable() {
        const type = this.currentAdminType;
        if (type === 'cars') this.renderCarsTable();
        else if (type === 'bookings') this.renderBookingsTable();
        else if (type === 'users') this.renderUsersTable();
    },

    setAdminSort(field) {
        if (this.adminSort.field === field) {
            this.adminSort.asc = !this.adminSort.asc;
        } else {
            this.adminSort.field = field;
            this.adminSort.asc = true;
        }
        this.renderAdminTable();
    },

    sortData(data) {
        return [...data].sort((a, b) => {
            let valA = a[this.adminSort.field];
            let valB = b[this.adminSort.field];
            if (valA == null) valA = '';
            if (valB == null) valB = '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return this.adminSort.asc ? -1 : 1;
            if (valA > valB) return this.adminSort.asc ? 1 : -1;
            return 0;
        });
    },

    renderCarsTable() {
        const area = document.getElementById('admin-table-area');
        const sorted = this.sortData(this.cars);
        area.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                <h3 class="h2-premium">Registrerade Bilar</h3>
                <button class="btn btn-primary" style="width:auto; padding:0.5rem 1.5rem" onclick="app.showAddCarForm()">+ Lägg till bil</button>
            </div>
            <table class="table">
                <thead><tr>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('name')" onkeydown="if(event.key==='Enter') app.setAdminSort('name')">Märke</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('model')" onkeydown="if(event.key==='Enter') app.setAdminSort('model')">Modell</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('price')" onkeydown="if(event.key==='Enter') app.setAdminSort('price')">Pris</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('type')" onkeydown="if(event.key==='Enter') app.setAdminSort('type')">Typ</th>
                    <th>Åtgärd</th>
                </tr></thead>
                <tbody>${sorted.map(c => `
                    <tr>
                        <td>${c.name}</td>
                        <td>${c.model}</td>
                        <td style="color:var(--color-brand-primary)">${c.price} SEK</td>
                        <td>${c.type || '-'}</td>
                        <td>
                            <div style="display:flex; gap:0.5rem">
                                <button class="btn btn-outline" style="padding:0.2rem 0.8rem; font-size:0.7rem; border-color:var(--color-brand-primary)" onclick="app.showEditCarForm(${c.id})">Redigera</button>
                                <button class="btn btn-danger" style="padding:0.2rem 0.8rem; font-size:0.7rem" onclick="app.deleteItem('cars', ${c.id})">Ta bort</button>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
    },

    showAddCarForm() {
        this.renderCarForm("Lägg till ny bil", "app.handleAddCar(event)");
    },

    showEditCarForm(id) {
        const car = this.cars.find(c => c.id == id);
        if (!car) return;
        this.renderCarForm("Redigera bil", `app.handleEditCar(event, ${id})`, car);
    },

    renderCarForm(title, submitAction, car = null) {
        const area = document.getElementById('admin-table-area');
        area.innerHTML = `
            <h3>${title}</h3>
            <form onsubmit="${submitAction}" id="car-form" class="responsive-two-column-grid" style="margin-top:2rem; gap:1.2rem">
                <div style="grid-column: 1">
                    <label for="car-name-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Märke</label>
                    <input type="text" id="car-name-input" name="name" value="${car ? car.name : ''}" required style="width:100%; padding:0.9rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                </div>
                <div style="grid-column: 2">
                    <label for="car-model-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Modell</label>
                    <input type="text" id="car-model-input" name="model" value="${car ? car.model : ''}" required style="width:100%; padding:0.9rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                </div>
                <div>
                    <label for="car-price-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Pris per dygn (SEK)</label>
                    <input type="number" id="car-price-input" name="price" value="${car ? car.price : ''}" required style="width:100%; padding:0.9rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                </div>
                <div>
                    <label for="car-type-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Typ (t.ex. SUV, Sport)</label>
                    <input type="text" id="car-type-input" name="type" value="${car ? car.type || '' : ''}" style="width:100%; padding:0.9rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                </div>
                <div>
                    <label for="car-feature1-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Egenskap 1</label>
                    <input type="text" id="car-feature1-input" name="feature1" value="${car ? car.feature1 || '' : ''}" style="width:100%; padding:0.9rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                </div>
                <div>
                    <label for="car-feature2-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Egenskap 2</label>
                    <input type="text" id="car-feature2-input" name="feature2" value="${car ? car.feature2 || '' : ''}" style="width:100%; padding:0.9rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:white">
                </div>
                <div style="grid-column: 1 / span 2">
                    <label for="car-image-input" style="display:block; margin-bottom:0.5rem; color:var(--color-brand-primary)">Bild (.jpg, .png - max 20MB)</label>
                    <input type="file" id="car-image-input" name="image" accept="image/*" style="width:100%; padding:0.9rem; border:1px dashed var(--border-color); border-radius:12px; color:var(--color-text-muted)">
                </div>
                <div style="display:flex; gap:1rem; margin-top:1rem; grid-column: 1 / span 2">
                    <button type="submit" class="btn btn-primary">Spara ändringar</button>
                    <button type="button" class="btn btn-outline" onclick="app.loadAdminData('cars')">Avbryt</button>
                </div>
            </form>
        `;
    },

    async handleAddCar(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('feature3', ''); // Placeholder om backend kräver det
        formData.append('booked', false);

        try {
            await this.api('/cars', 'POST', formData);
            alert("Bilen har skapats!");
            this.loadAdminData('cars');
        } catch (err) {
            alert("Fel: " + err.message);
        }
    },

    async handleEditCar(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('feature3', ''); // Placeholder

        try {
            await this.api(`/cars/${id}`, 'PUT', formData);
            alert("Bilen har uppdaterats!");
            this.loadAdminData('cars');
        } catch (err) {
            alert("Fel vid uppdatering: " + err.message);
        }
    },

    renderBookingsTable() {
        const area = document.getElementById('admin-table-area');
        const sorted = this.sortData(this.bookings);
        area.innerHTML = `
            <h3 class="h2-premium">Bokningar</h3>
            <table class="table">
                <thead><tr>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('id')" onkeydown="if(event.key==='Enter') app.setAdminSort('id')">ID</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('carId')" onkeydown="if(event.key==='Enter') app.setAdminSort('carId')">Bil-ID</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('fromDate')" onkeydown="if(event.key==='Enter') app.setAdminSort('fromDate')">Från</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('toDate')" onkeydown="if(event.key==='Enter') app.setAdminSort('toDate')">Till</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('active')" onkeydown="if(event.key==='Enter') app.setAdminSort('active')">Status</th>
                    <th>Åtgärd</th>
                </tr></thead>
                <tbody>${sorted.map(b => `<tr>
                    <td>${b.id}</td><td>${b.carId}</td><td>${b.fromDate}</td><td>${b.toDate}</td>
                    <td><span class="badge" style="background: ${b.active ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.1)'}; color: ${b.active ? '#2ecc71' : 'var(--color-text-muted)'}; border-color: ${b.active ? '#2ecc71' : 'var(--border-color)'}">${b.active ? 'Aktiv' : 'Slutförd'}</span></td>
                    <td>
                        <div style="display:flex; gap:0.5rem">
                            ${b.active ? `<button class="btn btn-outline" style="padding:0.2rem 0.8rem; font-size:0.7rem; color:var(--color-brand-primary); border-color:var(--color-brand-primary); width:auto;" onclick="app.showReturnModal(${b.id})">Returnera</button>` : ''}
                            <button class="btn btn-danger" style="padding:0.2rem 0.8rem; font-size:0.7rem; width:auto;" onclick="app.deleteItem('bookings', ${b.id})">Radera</button>
                        </div>
                    </td>
                </tr>`).join('')}</tbody>
            </table>
        `;
    },

    renderUsersTable() {
        const area = document.getElementById('admin-table-area');
        const sorted = this.sortData(this.users);
        area.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h3 class="h2-premium" style="margin:0">Användare</h3>
                <button class="btn btn-primary" style="padding:0.5rem 1rem; width:auto; font-size:0.8rem;" onclick="app.showUserModal()">+ Skapa Användare</button>
            </div>
            <table class="table">
                <thead><tr>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('id')" onkeydown="if(event.key==='Enter') app.setAdminSort('id')">ID</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('username')" onkeydown="if(event.key==='Enter') app.setAdminSort('username')">Användarnamn</th>
                    <th tabindex="0" class="sortable-th" onclick="app.setAdminSort('role')" onkeydown="if(event.key==='Enter') app.setAdminSort('role')">Roll</th>
                    <th>Åtgärd</th>
                </tr></thead>
                <tbody>${sorted.map(u => `<tr>
                    <td class="text-muted">${u.id || '-'}</td>
                    <td style="font-weight:700">${u.username}</td>
                    <td><span class="badge" style="border-color:${u.role==='ROLE_ADMIN'||u.role==='ADMIN'?'var(--color-brand-primary)':'var(--color-text-muted)'}; color:${u.role==='ROLE_ADMIN'||u.role==='ADMIN'?'var(--color-brand-primary)':'var(--color-text-main)'}">${u.role}</span></td>
                    <td>
                        <div style="display:flex; gap:0.5rem">
                            <button class="btn btn-outline" style="padding:0.2rem 0.8rem; font-size:0.7rem; color:var(--color-brand-primary); border-color:var(--color-brand-primary)" onclick="app.showUserModal(${u.id})">Ändra</button>
                            <button class="btn btn-danger" style="padding:0.2rem 0.8rem; font-size:0.7rem" onclick="app.deleteItem('users', ${u.id})">Ta bort</button>
                        </div>
                    </td>
                </tr>`).join('')}</tbody>
            </table>
        `;
    },

    showUserModal(userId = null) {
        let user = null;
        if (userId) {
            user = this.users.find(u => u.id === userId);
            if (!user) return;
        }

        const backdrop = document.getElementById('modal-backdrop');
        const container = document.getElementById('modal-container');
        
        const title = user ? 'Ändra Användare' : 'Skapa Användare';
        const isEdit = !!user;

        container.innerHTML = `
            <button class="modal-close" onclick="app.closeModal()" aria-label="Stäng modal">&times;</button>
            <h2 class="h2-premium" style="margin-bottom:1.5rem">${title}</h2>
            <form onsubmit="app.handleUserSubmit(event, ${isEdit ? user.id : 'null'})">
                <div class="responsive-two-column-grid" style="gap:1rem; margin-bottom:1rem">
                    <div>
                        <label class="form-label" for="user-firstname">FÖRNAMN</label>
                        <input type="text" id="user-firstname" required class="form-input" value="${user ? user.firstName : ''}">
                    </div>
                    <div>
                        <label class="form-label" for="user-lastname">EFTERNAMN</label>
                        <input type="text" id="user-lastname" required class="form-input" value="${user ? user.lastName : ''}">
                    </div>
                </div>

                <label class="form-label" for="user-username">ANVÄNDARNAMN</label>
                <input type="text" id="user-username" required class="form-input" style="margin-bottom:1rem" value="${user ? user.username : ''}">

                <div class="responsive-two-column-grid" style="gap:1rem; margin-bottom:1rem">
                    <div>
                        <label class="form-label" for="user-email">E-POST</label>
                        <input type="email" id="user-email" required class="form-input" value="${user ? user.email : ''}">
                    </div>
                    <div>
                        <label class="form-label" for="user-phone">TELEFON</label>
                        <input type="text" id="user-phone" required class="form-input" value="${user ? user.phone : ''}">
                    </div>
                </div>

                <div class="responsive-two-column-grid" style="gap:1rem; margin-bottom:2rem">
                    <div>
                        <label class="form-label" for="user-password">LÖSENORD ${isEdit ? '<span style="font-size:0.7rem; color:var(--color-text-muted)">(Lämna tomt för att behålla)</span>' : ''}</label>
                        <input type="password" id="user-password" class="form-input" ${!isEdit ? 'required' : ''}>
                    </div>
                    <div>
                        <label class="form-label" for="user-role">ROLL</label>
                        <select id="user-role" class="form-input">
                            <option value="ROLE_USER" ${user && user.role === 'ROLE_USER' ? 'selected' : ''}>Kund (ROLE_USER)</option>
                            <option value="ROLE_ADMIN" ${user && (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') ? 'selected' : ''}>Administratör (ROLE_ADMIN)</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width:100%">${isEdit ? 'SPARA ÄNDRINGAR' : 'SKAPA ANVÄNDARE'}</button>
            </form>
        `;
        
        backdrop.style.display = 'flex';
        void backdrop.offsetWidth;
        backdrop.classList.add('active');
    },

    async handleUserSubmit(e, userId) {
        e.preventDefault();
        
        const password = document.getElementById('user-password').value;
        const userData = {
            firstName: document.getElementById('user-firstname').value,
            lastName: document.getElementById('user-lastname').value,
            username: document.getElementById('user-username').value,
            email: document.getElementById('user-email').value,
            phone: document.getElementById('user-phone').value,
            role: document.getElementById('user-role').value
        };

        if (password) {
            userData.password = password;
        }

        try {
            if (userId) {
                await this.api(`/users/${userId}`, 'PUT', userData);
                alert("Användaren har uppdaterats framgångsrikt!");
            } else {
                await this.api('/users', 'POST', userData);
                alert("Användaren har skapats!");
            }
            this.closeModal();
            this.loadAdminData('users');
        } catch (err) {
            alert("Ett fel uppstod: " + err.message);
        }
    },


    async showProfile() {
        if (!this.auth || !this.user || !this.user.id) {
            this.showLogin();
            return;
        }

        try {
            const userData = await this.api(`/users/${this.user.id}`);
            if (!userData) throw new Error("Kunde inte hämta användardata");

            let myBookings = [];
            try {
                myBookings = await this.api('/bookings/me') || [];
            } catch (e) {
                console.log("No bookings found or error fetching bookings", e);
            }

            const backdrop = document.getElementById('modal-backdrop');
            const container = document.getElementById('modal-container');

            container.innerHTML = `
                <button class="modal-close" onclick="app.closeModal()" aria-label="Stäng modal">&times;</button>
                <h2 class="h2-premium" style="margin-bottom:1.5rem">Min Profil</h2>
                <form onsubmit="app.handleProfileSubmit(event)">
                    <div class="responsive-two-column-grid" style="gap:1rem; margin-bottom:1rem">
                        <div>
                            <label class="form-label" for="profile-firstname">FÖRNAMN</label>
                            <input type="text" id="profile-firstname" required class="form-input" value="${userData.firstName || ''}">
                        </div>
                        <div>
                            <label class="form-label" for="profile-lastname">EFTERNAMN</label>
                            <input type="text" id="profile-lastname" required class="form-input" value="${userData.lastName || ''}">
                        </div>
                    </div>

                    <div class="responsive-two-column-grid" style="gap:1rem; margin-bottom:1rem">
                        <div>
                            <label class="form-label" for="profile-username">ANVÄNDARNAMN</label>
                            <input type="text" id="profile-username" readonly class="form-input" style="background:rgba(255,255,255,0.05); color:var(--color-text-muted)" value="${userData.username}">
                        </div>
                        <div>
                            <label class="form-label" for="profile-orders">ANTAL BOKNINGAR</label>
                            <input type="text" id="profile-orders" readonly class="form-input" style="background:rgba(255,255,255,0.05); color:var(--color-text-muted)" value="${userData.noOfOrders || 0}">
                        </div>
                    </div>

                    <div class="responsive-two-column-grid" style="gap:1rem; margin-bottom:1rem">
                        <div>
                            <label class="form-label" for="profile-email">E-POST</label>
                            <input type="email" id="profile-email" required class="form-input" value="${userData.email || ''}">
                        </div>
                        <div>
                            <label class="form-label" for="profile-phone">TELEFON</label>
                            <input type="text" id="profile-phone" required class="form-input" value="${userData.phone || ''}">
                        </div>
                    </div>

                    <div class="${this.user.role === 'ADMIN' ? 'responsive-two-column-grid' : ''}" style="gap:1rem; margin-bottom:2rem">
                        <div>
                            <label class="form-label" for="profile-password">NYTT LÖSENORD <span style="font-size:0.7rem; color:var(--color-text-muted)">(Lämna tomt för att behålla)</span></label>
                            <input type="password" id="profile-password" class="form-input">
                        </div>
                        ${this.user.role === 'ADMIN' ? `
                        <div>
                            <label class="form-label" for="profile-role">ROLL</label>
                            <input type="text" id="profile-role" readonly class="form-input" style="background:rgba(255,255,255,0.05); color:var(--color-text-muted)" value="${userData.role || 'ROLE_USER'}">
                        </div>
                        ` : `
                        <input type="hidden" id="profile-role" value="${userData.role || 'ROLE_USER'}">
                        `}
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width:100%; margin-bottom:1.5rem">SPARA ÄNDRINGAR</button>
                </form>

                ${myBookings.length > 0 ? `
                <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1.5rem;">
                    <h3 class="h2-premium" style="font-size: 1.3rem; margin-bottom: 1rem;">Mina Aktiva Bokningar</h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${myBookings.filter(b => b.active).map(b => {
                            const car = this.cars.find(c => c.id == b.carId) || { name: 'Bil', model: `ID: ${b.carId}` };
                            return `
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                                <div style="text-align: left;">
                                    <h4 style="color: white; margin: 0;">${car.name} <span style="color: var(--color-text-muted); font-weight: normal;">${car.model}</span></h4>
                                    <p class="text-small" style="margin: 0.2rem 0 0 0;">Period: ${b.fromDate} till ${b.toDate}</p>
                                </div>
                                <button class="btn btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="app.closeModal(); setTimeout(() => app.showReturnModal(${b.id}), 300);">Returnera bil</button>
                            </div>
                            `;
                        }).join('') || '<p class="text-muted" style="font-size: 0.9rem;">Inga aktiva bokningar för tillfället.</p>'}
                    </div>
                </div>
                ` : ''}
            `;

            backdrop.style.display = 'flex';
            void backdrop.offsetWidth;
            backdrop.classList.add('active');
        } catch (err) {
            alert("Kunde inte hämta din profil: " + err.message);
        }
    },

    async handleProfileSubmit(e) {
        e.preventDefault();
        if (!this.user || !this.user.id) return;

        const password = document.getElementById('profile-password').value;
        const username = document.getElementById('profile-username').value;
        const role = document.getElementById('profile-role').value;
        
        const userData = {
            firstName: document.getElementById('profile-firstname').value,
            lastName: document.getElementById('profile-lastname').value,
            username: username,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            role: role
        };

        if (password) {
            userData.password = password;
        }

        try {
            await this.api(`/users/${this.user.id}`, 'PUT', userData);
            alert("Dina profiluppgifter har uppdaterats!");
            
            if (password) {
                this.auth = btoa(`${username}:${password}`);
            }
            
            this.closeModal();
            this.updateNavbar();
        } catch (err) {
            alert("Kunde inte spara profiluppgifter: " + err.message);
        }
    },

    logout() { 
        this.auth = null; 
        this.user = null; 
        this.updateNavbar();
        this.navigate('#bilar'); 
    },

    async deleteItem(type, id) {
        if (!confirm("Radera?")) return;
        try { await this.api(`/${type}/${id}`, 'DELETE'); this.loadAdminData(type); } catch (err) { alert("Kunde inte radera."); }
    },

    async showReturnModal(bookingId) {
        try {
            const booking = await this.api(`/bookings/${bookingId}`);
            if (!booking) throw new Error("Kunde inte hämta bokningsdata.");

            const car = this.cars.find(c => c.id == booking.carId) || await this.api(`/cars/${booking.carId}`);
            if (!car) throw new Error("Kunde inte hämta bildata.");

            let customer;
            try {
                customer = await this.api(`/users/${booking.userId}`);
            } catch (err) {
                console.warn(`User with ID ${booking.userId} not found, using fallback.`, err);
                customer = {
                    id: booking.userId,
                    firstName: 'Okänd',
                    lastName: 'Kund',
                    email: 'ej angiven',
                    phone: 'ej angiven'
                };
            }

            const fromDate = new Date(booking.fromDate);
            const toDate = new Date(booking.toDate);
            const bookedDays = Math.max(1, Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)));
            const basePrice = bookedDays * car.price;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const compareToDate = new Date(booking.toDate);
            compareToDate.setHours(0, 0, 0, 0);

            let lateDays = 0;
            let penalty = 0;
            if (today > compareToDate) {
                lateDays = Math.round((today - compareToDate) / (1000 * 60 * 60 * 24));
                penalty = Math.round(basePrice * 0.05 * lateDays);
            }
            const totalPrice = basePrice + penalty;

            this.currentReturnData = { booking, car, customer, bookedDays, basePrice, lateDays, penalty, totalPrice };

            this.renderReturnStep1();
        } catch (err) {
            alert("Ett fel uppstod vid returen: " + err.message);
        }
    },

    renderReturnStep1() {
        const { booking, car, customer, bookedDays, basePrice, lateDays, penalty, totalPrice } = this.currentReturnData;
        const backdrop = document.getElementById('modal-backdrop');
        const container = document.getElementById('modal-container');

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        container.innerHTML = `
            <button class="modal-close" onclick="app.closeModal()" aria-label="Avbryt retur">&times;</button>
            <h2 class="h2-premium" style="margin-bottom:1.5rem">Returnera Bil & Betala</h2>
            
            <div style="display:grid; grid-template-columns: 1fr; gap:1.5rem; margin-bottom:2rem; text-align:left;">
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:1.5rem; border-radius:12px;">
                    <h3 style="color:var(--color-brand-primary); margin-top:0; margin-bottom:1rem; font-size:1.1rem;">Bokningsdetaljer</h3>
                    <p style="margin:0.3rem 0;"><strong>Fordon:</strong> ${car.name} ${car.model} (ID: ${car.id})</p>
                    <p style="margin:0.3rem 0;"><strong>Bokad Period:</strong> ${booking.fromDate} till ${booking.toDate} (${bookedDays} dygn)</p>
                    <p style="margin:0.3rem 0;"><strong>Returdatum:</strong> ${todayStr}</p>
                    <p style="margin:0.3rem 0;"><strong>Kund:</strong> ${customer.firstName} ${customer.lastName} (ID: ${customer.id})</p>
                </div>

                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:1.5rem; border-radius:12px;">
                    <h3 style="color:var(--color-brand-primary); margin-top:0; margin-bottom:1rem; font-size:1.1rem;">Prisberäkning</h3>
                    <div style="display:flex; justify-content:space-between; margin:0.3rem 0;">
                        <span>Grundpris (${bookedDays} dygn x ${car.price} SEK):</span>
                        <span>${basePrice} SEK</span>
                    </div>
                    ${lateDays > 0 ? `
                    <div style="display:flex; justify-content:space-between; margin:0.3rem 0; color:var(--color-danger);">
                        <span>Försening (${lateDays} dygn x 5% per dygn):</span>
                        <span>+${penalty} SEK</span>
                    </div>
                    ` : ''}
                    <div style="border-top:1px solid var(--border-color); margin-top:1rem; padding-top:1rem; display:flex; justify-content:space-between; font-weight:bold; font-size:1.2rem;">
                        <span>Totalt att betala:</span>
                        <span style="color:var(--color-brand-primary);">${totalPrice} SEK</span>
                    </div>
                </div>
            </div>

            <h3 class="form-label" style="text-align:center; margin-bottom:1rem;">Hur vill du betala?</h3>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-bottom:1rem;">
                <button class="btn btn-outline" style="padding:1rem 0.5rem;" onclick="app.renderReturnCash()">💵 Kontant</button>
                <button class="btn btn-outline" style="padding:1rem 0.5rem;" onclick="app.renderReturnCard()">💳 Kort</button>
                <button class="btn btn-outline" style="padding:1rem 0.5rem;" onclick="app.renderReturnInvoice()">📄 Faktura</button>
            </div>
            <button class="btn btn-outline" style="width:100%; border-color:var(--color-danger); color:var(--color-danger);" onclick="app.closeModal()">Avbryt</button>
        `;

        backdrop.style.display = 'flex';
        void backdrop.offsetWidth;
        backdrop.classList.add('active');
    },

    renderReturnCash() {
        if (this.currentReturnData) this.currentReturnData.paymentMethod = 'Kontant';
        const { booking, totalPrice } = this.currentReturnData;
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <h2 class="h2-premium" style="margin-bottom:1.5rem">💵 Betala Kontant</h2>
            <div style="text-align:left; margin-bottom:2rem;">
                <p style="font-size:1.1rem; margin-bottom:1.5rem;">Totalbelopp att betala: <strong style="color:var(--color-brand-primary);">${totalPrice} SEK</strong></p>
                
                <div class="form-group">
                    <label class="form-label" for="cash-tendered">MOTTAGET BELOPP (SEK)</label>
                    <input type="number" id="cash-tendered" class="form-input" placeholder="Ange belopp kunden lämnar" style="font-size:1.2rem; padding:1rem;" oninput="app.calculateCashChange(${totalPrice})">
                </div>

                <div id="cash-feedback" style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:1rem; border-radius:8px; text-align:center; font-size:1.2rem; min-height:56px; display:flex; align-items:center; justify-content:center;">
                    <span style="color:var(--color-text-muted);">Väntar på belopp...</span>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <button type="button" class="btn btn-outline" onclick="app.renderReturnStep1()">Tillbaka</button>
                <button type="button" id="btn-finish-return" class="btn btn-primary" disabled style="opacity:0.5; cursor:not-allowed;" onclick="app.completeReturn(${booking.id})">Avsluta</button>
            </div>
        `;
    },

    calculateCashChange(totalPrice) {
        const tenderedInput = document.getElementById('cash-tendered');
        const feedback = document.getElementById('cash-feedback');
        const finishBtn = document.getElementById('btn-finish-return');
        
        const tendered = parseFloat(tenderedInput.value) || 0;
        
        if (tendered === 0) {
            feedback.innerHTML = `<span style="color:var(--color-text-muted);">Väntar på belopp...</span>`;
            finishBtn.disabled = true;
            finishBtn.style.opacity = 0.5;
            finishBtn.style.cursor = 'not-allowed';
            return;
        }

        if (tendered < totalPrice) {
            feedback.innerHTML = `<span style="color:var(--color-danger); font-weight:600;">Kvar att betala: ${totalPrice - tendered} SEK</span>`;
            finishBtn.disabled = true;
            finishBtn.style.opacity = 0.5;
            finishBtn.style.cursor = 'not-allowed';
        } else {
            const change = tendered - totalPrice;
            feedback.innerHTML = `<span style="color:#2ecc71; font-weight:700; font-size:1.3rem;">Växel: ${change} SEK</span>`;
            finishBtn.disabled = false;
            finishBtn.style.opacity = 1;
            finishBtn.style.cursor = 'pointer';
        }
    },

    renderReturnCard() {
        if (this.currentReturnData) this.currentReturnData.paymentMethod = 'Kort';
        const { booking, totalPrice } = this.currentReturnData;
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <h2 class="h2-premium" style="margin-bottom:1.5rem">💳 Betala med Kort</h2>
            <div style="text-align:center; margin-bottom:2.5rem;">
                <p style="font-size:1.1rem; margin-bottom:1.5rem;">Totalbelopp att betala: <strong style="color:var(--color-brand-primary);">${totalPrice} SEK</strong></p>
                
                <div id="card-reader-simulation" style="border:2px dashed var(--border-color); border-radius:16px; padding:2.5rem 1rem; background:rgba(255,255,255,0.01); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1.5rem;">
                    <div id="card-icon" style="font-size:3.5rem; transition: transform 0.5s ease;">📳</div>
                    <span id="card-status-text" style="color:var(--color-text-muted); font-size:1.1rem; font-weight:600;">Blippa kort med mottagarenhet</span>
                    <button class="btn btn-outline" style="width:auto; padding:0.5rem 1.5rem; font-size:0.85rem;" onclick="app.simulateCardTap()">Blippa kort</button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <button type="button" class="btn btn-outline" id="btn-card-back" onclick="app.renderReturnStep1()">Tillbaka</button>
                <button type="button" id="btn-finish-card-return" class="btn btn-primary" disabled style="opacity:0.5; cursor:not-allowed;" onclick="app.completeReturn(${booking.id})">Avsluta</button>
            </div>
        `;
    },

    simulateCardTap() {
        const statusText = document.getElementById('card-status-text');
        const icon = document.getElementById('card-icon');
        const finishBtn = document.getElementById('btn-finish-card-return');
        
        statusText.textContent = "Behandlar betalning...";
        statusText.style.color = "var(--color-brand-primary)";
        icon.style.transform = "scale(1.2) rotate(15deg)";
        
        setTimeout(() => {
            statusText.textContent = "Betalning godkänd! Referens: Ref-" + Math.floor(100000 + Math.random() * 900000);
            statusText.style.color = "#2ecc71";
            icon.textContent = "✅";
            icon.style.transform = "scale(1)";
            
            finishBtn.disabled = false;
            finishBtn.style.opacity = 1;
            finishBtn.style.cursor = 'pointer';
        }, 1500);
    },

    renderReturnInvoice() {
        if (this.currentReturnData) this.currentReturnData.paymentMethod = 'Faktura';
        const { booking, car, customer, bookedDays, basePrice, lateDays, penalty, totalPrice } = this.currentReturnData;
        const container = document.getElementById('modal-container');
        container.style.maxWidth = '700px';

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueYear = dueDate.getFullYear();
        const dueMonth = String(dueDate.getMonth() + 1).padStart(2, '0');
        const dueDay = String(dueDate.getDate()).padStart(2, '0');
        const dueStr = `${dueYear}-${dueMonth}-${dueDay}`;

        const invoiceNum = `FA-${year}${month}${day}-${booking.id}`;

        container.innerHTML = `
            <div class="payment-header">
                <h2 class="h2-premium" style="margin-bottom:1.5rem">📄 Betala med Faktura</h2>
            </div>
            
            <div id="invoice-print-area" style="background:#ffffff; color:#1a1a1b; padding:2rem; border-radius:12px; border:1px solid #e0e0e0; font-family:'Inter', sans-serif; text-align:left; line-height:1.5; margin-bottom:2rem; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid #1a1a1b; padding-bottom:1rem; margin-bottom:1.5rem;">
                    <div>
                        <h2 style="margin:0; font-size:1.8rem; font-weight:800; text-transform:uppercase; letter-spacing:-0.02em; color:#000;">Wigells</h2>
                        <p style="margin:0.2rem 0; font-size:0.8rem; color:#666;">Wigells Gold Standard Car Rental</p>
                        <p style="margin:0.1rem 0; font-size:0.8rem; color:#666;">Guldgatan 1, 111 22 Stockholm</p>
                    </div>
                    <div style="text-align:right;">
                        <h3 style="margin:0; font-size:1.4rem; color:#000;">FAKTURA</h3>
                        <p style="margin:0.2rem 0; font-size:0.85rem;"><strong>Fakturanummer:</strong> ${invoiceNum}</p>
                        <p style="margin:0.1rem 0; font-size:0.85rem;"><strong>Fakturadatum:</strong> ${todayStr}</p>
                        <p style="margin:0.1rem 0; font-size:0.85rem;"><strong>Förfallodatum:</strong> ${dueStr}</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:2rem; font-size:0.9rem;">
                    <div>
                        <span style="font-size:0.75rem; color:#666; font-weight:bold; text-transform:uppercase; letter-spacing:0.05em;">Betalningsmottagare</span>
                        <p style="margin:0.3rem 0 0 0; font-weight:bold; color:#000;">Wigellkoncernen AB</p>
                        <p style="margin:0.1rem 0; color:#444;">Org.nr: 556123-4567</p>
                        <p style="margin:0.1rem 0; color:#444;">Bankgiro: 555-4321</p>
                    </div>
                    <div>
                        <span style="font-size:0.75rem; color:#666; font-weight:bold; text-transform:uppercase; letter-spacing:0.05em;">Fakturaadressat</span>
                        <p style="margin:0.3rem 0 0 0; font-weight:bold; color:#000;">${customer.firstName} ${customer.lastName}</p>
                        <p style="margin:0.1rem 0; color:#444;">Kund-ID: ${customer.id}</p>
                        <p style="margin:0.1rem 0; color:#444;">E-post: ${customer.email}</p>
                        <p style="margin:0.1rem 0; color:#444;">Tel: ${customer.phone}</p>
                    </div>
                </div>

                <table style="width:100%; border-collapse:collapse; margin-bottom:2rem; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid #1a1a1b;">
                            <th style="text-align:left; padding:0.5rem 0; color:#000;">Beskrivning</th>
                            <th style="text-align:right; padding:0.5rem 0; color:#000;">Mängd</th>
                            <th style="text-align:right; padding:0.5rem 0; color:#000;">Pris/dygn</th>
                            <th style="text-align:right; padding:0.5rem 0; color:#000;">Belopp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom:1px solid #e0e0e0;">
                            <td style="padding:0.8rem 0;">Hyra av ${car.name} ${car.model}<br><span style="font-size:0.75rem; color:#666;">Period: ${booking.fromDate} till ${booking.toDate}</span></td>
                            <td style="text-align:right; padding:0.8rem 0;">${bookedDays} dygn</td>
                            <td style="text-align:right; padding:0.8rem 0;">${car.price} SEK</td>
                            <td style="text-align:right; padding:0.8rem 0;">${basePrice} SEK</td>
                        </tr>
                        ${lateDays > 0 ? `
                        <tr style="border-bottom:1px solid #e0e0e0;">
                            <td style="padding:0.8rem 0; color:#c0392b;">Förseningsavgift (Överträtt med ${lateDays} dygn)<br><span style="font-size:0.75rem; color:#c0392b;">5% av grundhyra per dygn</span></td>
                            <td style="text-align:right; padding:0.8rem 0; color:#c0392b;">${lateDays} dygn</td>
                            <td style="text-align:right; padding:0.8rem 0; color:#c0392b;">${(basePrice * 0.05).toFixed(0)} SEK</td>
                            <td style="text-align:right; padding:0.8rem 0; color:#c0392b;">${penalty} SEK</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>

                <div style="display:flex; justify-content:flex-end; font-size:0.95rem;">
                    <div style="width:250px;">
                        <div style="display:flex; justify-content:space-between; margin:0.3rem 0;">
                            <span>Exkl. moms (20%):</span>
                            <span>${(totalPrice * 0.8).toFixed(2)} SEK</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin:0.3rem 0;">
                            <span>Moms (25%):</span>
                            <span>${(totalPrice * 0.2).toFixed(2)} SEK</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin:0.5rem 0 0 0; border-top:1px solid #1a1a1b; padding-top:0.5rem; font-weight:bold; font-size:1.1rem; color:#000;">
                            <span>Totalt att betala:</span>
                            <span>${totalPrice} SEK</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="payment-actions" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-container').style.maxWidth='500px'; app.renderReturnStep1()">Tillbaka</button>
                <button type="button" class="btn btn-outline" style="border-color:#2980b9; color:#2980b9;" onclick="window.print()">🖨️ Skriv ut</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('modal-container').style.maxWidth='500px'; app.completeReturn(${booking.id})">Avsluta</button>
            </div>
        `;
    },

    async completeReturn(bookingId) {
        try {
            await this.api(`/bookings/return/${bookingId}`, 'PUT');
            
            // Spara returdata lokalt i localStorage för framtida inkomstrullning
            if (this.currentReturnData && this.currentReturnData.booking.id == bookingId) {
                try {
                    const stored = localStorage.getItem('wigell_returns') || '[]';
                    const list = JSON.parse(stored);
                    const filtered = list.filter(item => item.bookingId != bookingId);
                    
                    const todayStr = new Date().toISOString().slice(0, 10);
                    
                    filtered.push({
                        bookingId: bookingId,
                        returnDate: todayStr,
                        paymentMethod: this.currentReturnData.paymentMethod || 'Faktura',
                        basePrice: this.currentReturnData.basePrice,
                        penalty: this.currentReturnData.penalty,
                        totalPrice: this.currentReturnData.totalPrice
                    });
                    
                    localStorage.setItem('wigell_returns', JSON.stringify(filtered));
                } catch (e) {
                    console.error("Kunde inte spara returdata till localStorage:", e);
                }
            }

            alert("Bilen har lämnats tillbaka och bokningen har stängts!");
            this.closeModal();
            if (window.location.hash === '#admin') {
                this.loadAdminData(this.currentAdminType || 'bookings');
            } else {
                this.showProfile();
            }
        } catch (err) {
            alert("Kunde inte registrera återlämningen: " + err.message);
        }
    },

    async showAdminRevenue() {
        const area = document.getElementById('admin-table-area');
        area.innerHTML = '<p style="text-align:center" class="text-muted">Beräknar inkomster...</p>';
        this.currentAdminType = 'revenue';
        
        // Highlight aktiv knapp
        document.querySelectorAll('.admin-menu-buttons button').forEach(el => el.classList.remove('active'));
        const ecoBtn = document.getElementById('admin-btn-revenue');
        if (ecoBtn) ecoBtn.classList.add('active');

        try {
            const bookings = await this.api('/bookings');
            const cars = this.cars.length ? this.cars : await this.api('/cars');
            let users = [];
            try {
                users = await this.api('/users');
            } catch (e) {
                console.warn("Kunde inte hämta användare för inkomstberäkning", e);
            }

            // Hämta lokalt sparade kvitton/returer
            let localReturns = {};
            try {
                const stored = localStorage.getItem('wigell_returns');
                if (stored) {
                    const list = JSON.parse(stored);
                    list.forEach(item => {
                        localReturns[item.bookingId] = item;
                    });
                }
            } catch (e) {
                console.error("Kunde inte läsa från localStorage", e);
            }

            let totalBase = 0;
            let totalPenalty = 0;
            let totalRevenue = 0;
            let transactions = [];

            // Filtrera ut avslutade bokningar (dvs active === false)
            const completedBookings = bookings.filter(b => !b.active);

            completedBookings.forEach(booking => {
                const car = cars.find(c => c.id == booking.carId);
                const user = users.find(u => u.id == booking.userId);
                const customerName = user ? `${user.firstName} ${user.lastName}` : `Kund (ID: ${booking.userId})`;
                
                const fromDate = new Date(booking.fromDate);
                const toDate = new Date(booking.toDate);
                const bookedDays = Math.max(1, Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)));
                
                let basePrice = car ? (bookedDays * car.price) : 0;
                let penalty = 0;
                let paymentMethod = "Faktura"; // Standard fallback
                let returnDate = booking.toDate; // Fallback till planerad retur

                // Kolla om vi har sparat specifika detaljer i localStorage
                const localData = localReturns[booking.id];
                if (localData) {
                    basePrice = localData.basePrice || basePrice;
                    penalty = localData.penalty || 0;
                    paymentMethod = localData.paymentMethod || paymentMethod;
                    returnDate = localData.returnDate || returnDate;
                }

                const totalPrice = basePrice + penalty;

                totalBase += basePrice;
                totalPenalty += penalty;
                totalRevenue += totalPrice;

                transactions.push({
                    bookingId: booking.id,
                    carName: car ? `${car.name} ${car.model}` : `Okänd bil (ID: ${booking.carId})`,
                    customerName,
                    period: `${booking.fromDate} till ${booking.toDate}`,
                    returnDate,
                    paymentMethod,
                    basePrice,
                    penalty,
                    totalPrice
                });
            });

            // Sortera transaktionerna efter bookingId fallande (senaste överst)
            transactions.sort((a, b) => b.bookingId - a.bookingId);

            let transactionsHtml = '';
            if (transactions.length === 0) {
                transactionsHtml = `
                    <tr>
                        <td colspan="9" style="text-align:center; padding:2rem; color:var(--color-text-muted);">
                            Inga slutförda uthyrningar finns registrerade än.
                        </td>
                    </tr>
                `;
            } else {
                transactions.forEach(t => {
                    transactionsHtml += `
                        <tr class="table-row-premium">
                            <td>#${t.bookingId}</td>
                            <td>${t.carName}</td>
                            <td>${t.customerName}</td>
                            <td><span style="font-size:0.75rem">${t.period}</span></td>
                            <td>${t.returnDate}</td>
                            <td><span class="badge" style="background:rgba(255,255,255,0.05); color:var(--color-text-main); font-weight:normal; padding: 2px 8px; border-radius: 4px;">${t.paymentMethod}</span></td>
                            <td style="text-align:right;">${t.basePrice} kr</td>
                            <td style="text-align:right; color:${t.penalty > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'}">${t.penalty} kr</td>
                            <td style="text-align:right; font-weight:bold; color:var(--color-brand-primary);">${t.totalPrice} kr</td>
                        </tr>
                    `;
                });
            }

            area.innerHTML = `
                <div class="view-fade">
                    <h2 class="h2-premium" style="margin-bottom:1.5rem">Inkomst & Omsättning</h2>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
                        <div class="card" style="padding:1.5rem; background:linear-gradient(135deg, rgba(212,175,55,0.1), rgba(0,0,0,0.2)); border:1px solid rgba(212,175,55,0.2); text-align:center;">
                            <p style="margin:0 0 0.5rem 0; color:var(--color-brand-primary); font-size:0.85rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Total Omsättning</p>
                            <h3 style="margin:0; font-size:2.2rem; font-weight:800; color:var(--color-brand-primary);">${totalRevenue} SEK</h3>
                            <p style="margin:0.5rem 0 0 0; font-size:0.75rem; color:var(--color-text-muted)">Inkl. moms och eventuella straffavgifter</p>
                        </div>
                        <div class="card" style="padding:1.5rem; text-align:center;">
                            <p style="margin:0 0 0.5rem 0; color:var(--color-text-muted); font-size:0.85rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Grundhyra</p>
                            <h3 style="margin:0; font-size:1.8rem; font-weight:700; color:var(--color-text-main);">${totalBase} SEK</h3>
                            <p style="margin:0.5rem 0 0 0; font-size:0.75rem; color:var(--color-text-muted)">Från ordinarie hyrestid</p>
                        </div>
                        <div class="card" style="padding:1.5rem; text-align:center;">
                            <p style="margin:0 0 0.5rem 0; color:var(--color-text-muted); font-size:0.85rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Straffavgifter</p>
                            <h3 style="margin:0; font-size:1.8rem; font-weight:700; color:${totalPenalty > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'};">${totalPenalty} SEK</h3>
                            <p style="margin:0.5rem 0 0 0; font-size:0.75rem; color:var(--color-text-muted)">Från försenade återlämningar (5%/dag)</p>
                        </div>
                        <div class="card" style="padding:1.5rem; text-align:center;">
                            <p style="margin:0 0 0.5rem 0; color:var(--color-text-muted); font-size:0.85rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Antal Slutförda</p>
                            <h3 style="margin:0; font-size:1.8rem; font-weight:700; color:var(--color-text-main);">${transactions.length} st</h3>
                            <p style="margin:0.5rem 0 0 0; font-size:0.75rem; color:var(--color-text-muted)">Returnerade bokningar i systemet</p>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="margin:0; color:var(--color-text-main);">Transaktionshistorik (JSON Live Data)</h3>
                        <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.75rem; width:auto;" onclick="app.exportRevenueJSON()">📥 Exportera JSON</button>
                    </div>

                    <div class="table-container">
                        <table class="table-premium" style="width:100%;">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Bil</th>
                                    <th>Kund</th>
                                    <th>Period</th>
                                    <th>Returdatum</th>
                                    <th>Betalsätt</th>
                                    <th style="text-align:right;">Grundhyra</th>
                                    <th style="text-align:right;">Straffavgift</th>
                                    <th style="text-align:right;">Totalpris</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transactionsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Spara transaktioner i objektet för export
            this.revenueTransactions = transactions;

        } catch (err) {
            area.innerHTML = `<p style="text-align:center; color:var(--color-danger)">Fel vid beräkning: ${err.message}</p>`;
        }
    },

    exportRevenueJSON() {
        if (!this.revenueTransactions || this.revenueTransactions.length === 0) {
            alert("Inga transaktioner att exportera.");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.revenueTransactions, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `wigell_rental_revenue_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
