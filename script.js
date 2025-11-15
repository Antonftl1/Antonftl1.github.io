// Globale Variablen
let currentUser = null;
let events = []; // Array von Events/Wunschzetteln
let currentEventId = null; // ID des aktuell angezeigten Events
let wishes = [];
let wishlistSettings = null;
let isReadOnly = false;
let editingIndex = -1;
let filteredWishes = [];
let currentSort = 'priority';
let categoryChart = null;

// Kategorien
const CATEGORIES = ['Technik', 'Bücher', 'Kleidung', 'Spiele', 'Sport', 'Schmuck', 'Möbel', 'Erlebnisse', 'Sonstiges'];

// Anlass-Farben
const OCCASION_THEMES = {
    birthday: { emoji: '', color: '#ff4d4d', bg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)' },
    christmas: { emoji: '', color: '#ff4d4d', bg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)' },
    easter: { emoji: '', color: '#ff4d4d', bg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)' },
    valentine: { emoji: '', color: '#ff4d4d', bg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)' },
    anniversary: { emoji: '', color: '#ff4d4d', bg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)' },
    other: { emoji: '', color: '#ff4d4d', bg: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)' }
};

// Globale Variable für Hintergrundbild
let backgroundImage = null;

// Globale Variable für Share-Namen
let shareName = null;

// Datei zu Base64 konvertieren
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    // Zuerst Share-Modus prüfen (funktioniert auch ohne Login)
    if (!checkShareMode()) {
        // Nur wenn nicht im Share-Modus, dann Auth prüfen
        checkAuth();
    }
    setCanonicalLink();
    setupEventListeners();
    setupMobileOptimizations();
    initCookieBanner();
});

// Mobile Optimierungen
function setupMobileOptimizations() {
    // Verhindere Zoom bei Doppel-Tap auf iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Verbessere Scroll-Performance auf mobilen Geräten
    if ('ontouchstart' in window) {
        document.body.style.overflowScrolling = 'touch';
    }
    
    // Verhindere horizontales Scrollen
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Authentifizierung prüfen
function checkAuth() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        showApp();
    } else {
        showAuth();
    }
}

// Auth-Screen anzeigen
function showAuth() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

// App-Screen anzeigen
function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    loadUserData();
    updateUI();
    showMainMenu();
}

// User-Daten laden
function loadUserData() {
    if (!currentUser) return;
    
    const userData = localStorage.getItem(`user_${currentUser.email}`);
    if (userData) {
        const data = JSON.parse(userData);
        // Neue Struktur: events Array
        if (data.events && Array.isArray(data.events)) {
            events = data.events;
        } else {
            // Migration: Alte Daten in neue Struktur umwandeln
            if (data.wishes || data.settings) {
                const event = {
                    id: Date.now().toString(),
                    name: data.settings?.name || 'Meine Wunschliste',
                    occasion: data.settings?.occasion || 'other',
                    date: data.settings?.date || new Date().toISOString().split('T')[0],
                    wishes: data.wishes || [],
                    createdAt: new Date().toISOString()
                };
                events = [event];
                saveUserData();
            } else {
                events = [];
            }
        }
    } else {
        events = [];
    }
}

// Events-Übersicht anzeigen
function showEventsOverview() {
    document.getElementById('eventsOverviewScreen').style.display = 'block';
    document.getElementById('eventDetailScreen').style.display = 'none';
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'none';
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('show');
    document.querySelectorAll('.right-sidebar.open').forEach(a => a.classList.remove('open'));
    renderEvents();
}

function showMainMenu() {
    document.getElementById('mainMenuScreen').style.display = 'block';
    document.getElementById('eventsOverviewScreen').style.display = 'none';
    document.getElementById('eventDetailScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'none';
}

function showOtherWishlists() {
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('eventsOverviewScreen').style.display = 'none';
    document.getElementById('eventDetailScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'block';
    renderOtherWishlists();
}

function showAccountSettings() {
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('eventsOverviewScreen').style.display = 'none';
    document.getElementById('eventDetailScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'block';
    const emailInput = document.getElementById('accountEmail');
    if (currentUser && emailInput) emailInput.value = currentUser.email;
}

function showProScreen() {
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('eventsOverviewScreen').style.display = 'none';
    document.getElementById('eventDetailScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'block';
    const tbl = document.getElementById('proPlanTable');
    if (tbl) { tbl.style.display = 'block'; renderProTable(); }
    const proj = document.getElementById('proProjectTable');
    if (proj) { proj.style.display = 'block'; renderProProjectTable(); }
    try { const t = sessionStorage.getItem('activeTheme'); if (t) applyGlobalTheme(t); } catch {}
}

function showInfoScreen() {
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('eventsOverviewScreen').style.display = 'none';
    document.getElementById('eventDetailScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'block';
}

// Event-Detail anzeigen
function showEventDetail(eventId) {
    currentEventId = eventId;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Stelle sicher, dass alle Wünsche ein giftedBy Array haben
    wishes = (event.wishes || []).map(w => ({
        ...w,
        giftedBy: w.giftedBy || [],
        trackedPrice: w.trackedPrice || null,
        priceUrl: w.priceUrl || ''
    }));
    // Mergen von geteilten Daten (Geschenke/Preise) falls verfügbar
    if (event.shareId) {
        const shared = localStorage.getItem(`shared_${event.shareId}`);
        if (shared) {
            try {
                const sharedData = JSON.parse(shared);
                wishes = wishes.map(w => {
                    const sw = (sharedData.wishes || []).find(x => x.id === w.id);
                    if (sw) {
                        return {
                            ...w,
                            giftedBy: sw.giftedBy || w.giftedBy,
                            trackedPrice: sw.trackedPrice || w.trackedPrice
                        };
                    }
                    return w;
                });
            } catch {}
        }
    }
    wishlistSettings = {
        name: event.name,
        occasion: event.occasion,
        date: event.date,
        backgroundImage: event.backgroundImage || null
    };
    backgroundImage = event.backgroundImage || null;
    updateBackgroundImage();
    
    // Im normalen Modus (nicht Share-Modus) sind wir nicht read-only
    isReadOnly = false;
    
    document.getElementById('eventsOverviewScreen').style.display = 'none';
    document.getElementById('eventDetailScreen').style.display = 'block';
    document.getElementById('mainMenuScreen').style.display = 'none';
    document.getElementById('otherWishlistsScreen').style.display = 'none';
    document.getElementById('accountSettingsScreen').style.display = 'none';
    document.getElementById('proScreen').style.display = 'none';
    document.getElementById('infoScreen').style.display = 'none';
    
    filteredWishes = [...wishes];
    updateStats();
    renderWishes();
    updateCountdown();
    updateCategoryFilter();
    updateUI();
    scheduleDailyPriceCheck();
    try { const t = sessionStorage.getItem('activeTheme'); if (t) applyGlobalTheme(t); } catch {}
}

// Events rendern
function renderEvents() {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = '';
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-events">
                <p>Noch keine Ereignisse erstellt</p>
                <p>Erstelle dein erstes Ereignis, um zu beginnen!</p>
            </div>
        `;
        return;
    }
    
    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        const theme = OCCASION_THEMES[event.occasion] || OCCASION_THEMES.other;
        const eventDate = new Date(event.date);
        const now = new Date();
        const diff = eventDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        let countdownText = '';
        if (diff <= 0) {
            countdownText = 'Heute';
        } else if (days === 0) {
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdownText = `In ${hours} Stunden`;
        } else {
            countdownText = `In ${days} Tagen`;
        }
        
        const wishCount = (event.wishes || []).length;
        const totalPrice = (event.wishes || []).reduce((sum, w) => sum + (w.price || 0), 0);
        
        eventCard.innerHTML = `
            <div class="event-card-header">
                <h3>${event.name}</h3>
                <span class="event-date">${new Date(event.date).toLocaleDateString('de-DE')}</span>
            </div>
            <div class="event-card-countdown">${countdownText}</div>
            <div class="event-card-stats">
                <span>${wishCount} Wünsche</span>
                <span>${totalPrice.toFixed(2)} €</span>
            </div>
        `;
        
        eventCard.addEventListener('click', () => showEventDetail(event.id));
        container.appendChild(eventCard);
    });
}

// UI aktualisieren
function updateUI() {
    if (currentUser) {
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = currentUser.name;
        }
    }
    // Hintergrund und Titel immer aktualisieren (auch im Share-Modus)
    updateBackgroundTheme();
    updateTitle();
}

// Hintergrund-Theme aktualisieren
function updateBackgroundTheme() {
    if (!wishlistSettings) return;
    const bg = document.getElementById('dynamicBackground');
    if (backgroundImage) {
        bg.style.backgroundImage = `url(${backgroundImage})`;
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
        bg.style.backgroundRepeat = 'no-repeat';
    } else {
        let theme = OCCASION_THEMES[wishlistSettings.occasion] || OCCASION_THEMES.other;
        const t = sessionStorage.getItem('activeTheme');
        if (t === 'christmas') theme = { bg: 'linear-gradient(135deg, #0b1a0b 0%, #133a13 50%, #0b1a0b 100%)' };
        bg.style.background = theme.bg;
        bg.style.backgroundImage = 'none';
    }
}

// Hintergrundbild aktualisieren
function updateBackgroundImage() {
    updateBackgroundTheme();
}

// Titel aktualisieren
function updateTitle() {
    if (!wishlistSettings) return;
    const theme = OCCASION_THEMES[wishlistSettings.occasion] || OCCASION_THEMES.other;
    const title = document.getElementById('mainTitle');
    const active = sessionStorage.getItem('activeTheme');
    const base = wishlistSettings.name || 'Meine Wunschliste';
    title.textContent = (active === 'christmas') ? `🎄 ${base}` : base;
}

// Countdown aktualisieren (groß oben in der Mitte)
function updateCountdown() {
    const countdownLarge = document.getElementById('countdownLarge');
    const countdownLargeContainer = document.getElementById('countdownLargeContainer');
    
    if (!wishlistSettings || !wishlistSettings.date) {
        if (countdownLargeContainer) countdownLargeContainer.style.display = 'none';
        return;
    }
    
    if (countdownLargeContainer) countdownLargeContainer.style.display = 'block';
    const targetDate = new Date(wishlistSettings.date);
    const now = new Date();
    const diff = targetDate - now;
    
    if (!countdownLarge) return;
    
    if (diff <= 0) {
        countdownLarge.innerHTML = `
            <div class="countdown-large-title">${wishlistSettings.name}</div>
            <div class="countdown-large-time">Heute!</div>
        `;
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    countdownLarge.innerHTML = `
        <div class="countdown-large-title">${wishlistSettings.name}</div>
        <div class="countdown-large-time">
            <div class="countdown-unit">
                <span class="countdown-number">${days}</span>
                <span class="countdown-label">Tage</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="countdown-number">${hours}</span>
                <span class="countdown-label">Stunden</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="countdown-number">${minutes}</span>
                <span class="countdown-label">Minuten</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="countdown-number">${seconds}</span>
                <span class="countdown-label">Sekunden</span>
            </div>
        </div>
    `;
    
    // Aktualisiere jede Sekunde
    setTimeout(updateCountdown, 1000);
}

// Registrierung
function register(email, password, name, birthday, emailNotifications) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (localStorage.getItem(`user_${normalizedEmail}`)) {
        showToast('Diese Email ist bereits registriert!', 'error');
        return false;
    }
    const user = {
        email: normalizedEmail,
        password: (password || '').trim(),
        name,
        birthday,
        emailNotifications,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem(`user_${normalizedEmail}`, JSON.stringify({
        user,
        wishes: [],
        settings: null
    }));
    sendRegistrationEmail(normalizedEmail, name);
    showToast('Registrierung erfolgreich!', 'success');
    return true;
}

// Login
function login(email, password) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const userData = localStorage.getItem(`user_${normalizedEmail}`) || localStorage.getItem(`user_${email}`);
    if (!userData) {
        showToast('Email oder Passwort falsch!', 'error');
        return false;
    }
    
    const data = JSON.parse(userData);
    if (data.user.password !== (password || '').trim()) {
        showToast('Email oder Passwort falsch!', 'error');
        return false;
    }
    
    currentUser = { ...data.user, email: normalizedEmail };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showApp();
    return true;
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
    showToast('Erfolgreich abgemeldet!', 'success');
}

// Email bei Registrierung senden (Mock)
function getEmailConfig() {
    return {
        endpoint: localStorage.getItem('emailEndpoint') || '/.netlify/functions/sendEmail',
        apiKey: localStorage.getItem('emailApiKey') || null
    };
}

function appendEmailLog(entry) {
    const logs = JSON.parse(localStorage.getItem('email_logs') || '[]');
    logs.push(entry);
    localStorage.setItem('email_logs', JSON.stringify(logs));
}

async function sendEmail(payload) {
    const cfg = getEmailConfig();
    let status = 'skipped';
    let response = null;
    if (cfg.endpoint) {
        try {
            const res = await fetch(cfg.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(cfg.apiKey ? { 'Authorization': 'Bearer ' + cfg.apiKey } : {})
                },
                body: JSON.stringify(payload)
            });
            response = await res.text().catch(() => null);
            status = res.ok ? 'sent' : 'failed';
            if (!res.ok) throw new Error('HTTP ' + res.status);
        } catch (err) {
            appendEmailLog({ to: payload.to, subject: payload.subject, status: 'failed', error: String(err), at: new Date().toISOString() });
            return false;
        }
    }
    appendEmailLog({ to: payload.to, subject: payload.subject, status, response, at: new Date().toISOString() });
    return status === 'sent' || status === 'skipped';
}

function buildWelcomeEmailHtml(name) {
    const baseUrl = localStorage.getItem('appBaseUrl') || 'https://wunschzettel-a.netlify.app/';
    return (
        `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1218;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">` +
        `<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f1218 0%,#141a22 100%);">` +
        `<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="margin:32px;background:#151a22;border-radius:16px;border:1px solid rgba(255,255,255,0.12);">` +
        `<tr><td style="padding:24px 24px 8px;font-size:24px;font-weight:700;">🎄 Willkommen bei unserem Service!</td></tr>` +
        `<tr><td style="padding:0 24px 16px;font-size:16px;">Hallo ${name || 'Freund'},</td></tr>` +
        `<tr><td style="padding:0 24px 16px;line-height:1.6;font-size:15px;">` +
        `Schön, dass du dabei bist! Hier die wichtigsten Schritte zum Start:` +
        `</td></tr>` +
        `<tr><td style="padding:0 24px 6px;">` +
        `<a href="${baseUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#ff4d4d;color:#fff;text-decoration:none;font-weight:600;">🎁 Wünsche anlegen</a>` +
        ` <a href="${baseUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#2ecc71;color:#0f1218;text-decoration:none;font-weight:700;margin-left:8px;">🎄 Pro & Informationen</a>` +
        `</td></tr>` +
        `<tr><td style="padding:16px 24px 8px;font-size:15px;">Nützliche Ressourcen:</td></tr>` +
        `<tr><td style="padding:0 24px 16px;">` +
        `<ul style="margin:0;padding-left:18px;">` +
        `<li><a href="${baseUrl}" style="color:#ffd700;text-decoration:none;">Kurzanleitung</a></li>` +
        `<li><a href="${baseUrl}" style="color:#ffd700;text-decoration:none;">Pro‑Funktionen</a></li>` +
        `<li><a href="${baseUrl}" style="color:#ffd700;text-decoration:none;">Informationen & Datenschutz</a></li>` +
        `</ul>` +
        `</td></tr>` +
        `<tr><td style="padding:0 24px 24px;color:rgba(255,255,255,0.8);font-size:14px;">` +
        `Support: <a href="mailto:antonmunzig@gmail.com?subject=Support%20Wunschliste" style="color:#6bb3ff;text-decoration:none;">Kontakt</a>` +
        `</td></tr>` +
        `</table></td></tr></table></body></html>`
    );
}

function buildWelcomeEmailText(name) {
    const baseUrl = localStorage.getItem('appBaseUrl') || 'https://wunschzettel-a.netlify.app/';
    const n = name || 'Freund';
    return (
        `Willkommen bei unserem Service!\n\n` +
        `Hallo ${n},\n\n` +
        `Schön, dass du dabei bist! Mit unserer Wunschliste erstellst, teilst und verwaltest du deine Wünsche schnell und übersichtlich.\n\n` +
        `Start:\n` +
        `- Wünsche anlegen: ${baseUrl}\n` +
        `- Pro-Bereich & Informationen: ${baseUrl}\n\n` +
        `Ressourcen:\n` +
        `- Kurzanleitung: ${baseUrl}\n` +
        `- Pro-Funktionen: ${baseUrl}\n` +
        `- Informationen & Datenschutz: ${baseUrl}\n\n` +
        `Support: antonmunzig@gmail.com\n\n` +
        `Viel Freude mit deiner Wunschliste!\n` +
        `Dein Wunschliste-Team`
    );
}

async function sendRegistrationEmail(email, name) {
    const subject = 'Willkommen bei unserem Service!';
    const html = buildWelcomeEmailHtml(name);
    const text = buildWelcomeEmailText(name);
    const ok = await sendEmail({ to: email, subject, html, text });
    if (!ok) setTimeout(() => { sendEmail({ to: email, subject, html, text }); }, 3000);
}

// Email-Benachrichtigung bei neuem Geschenk (Mock)
function sendNewGiftNotification(giftName, addedBy) {
    if (!currentUser || !currentUser.emailNotifications) return;
    
    console.log(`Email-Benachrichtigung würde gesendet werden an: ${currentUser.email}`);
    console.log(`Neues Geschenk hinzugefügt: ${giftName} von ${addedBy}`);
    // Hier würde eine Email gesendet werden
}

// Wunschzettel-Einstellungen öffnen
async function openWishlistSettings() {
    const modal = document.getElementById('wishlistSettingsModal');
    const modalTitle = modal.querySelector('h2');
    modal.classList.add('show');
    
    if (wishlistSettings) {
        document.getElementById('wishlistName').value = wishlistSettings.name || '';
        document.getElementById('wishlistOccasion').value = wishlistSettings.occasion || 'other';
        document.getElementById('wishlistDate').value = wishlistSettings.date || '';
        document.getElementById('wishlistBackground').value = wishlistSettings.backgroundImage && !wishlistSettings.backgroundImage.startsWith('data:') ? wishlistSettings.backgroundImage : '';
        document.getElementById('wishlistBackgroundFile').value = '';
        if (wishlistSettings.backgroundImage) {
            const preview = document.getElementById('backgroundPreview');
            preview.innerHTML = `<img src="${wishlistSettings.backgroundImage}" alt="Hintergrund-Vorschau" loading="lazy" decoding="async">`;
            preview.classList.add('show');
        } else {
            document.getElementById('backgroundPreview').classList.remove('show');
            document.getElementById('backgroundPreview').innerHTML = '';
        }
        if (modalTitle) modalTitle.textContent = 'Wunschzettel-Einstellungen';
    } else {
        document.getElementById('wishlistName').value = '';
        document.getElementById('wishlistOccasion').value = 'other';
        document.getElementById('wishlistDate').value = '';
        document.getElementById('wishlistBackground').value = '';
        document.getElementById('wishlistBackgroundFile').value = '';
        document.getElementById('backgroundPreview').classList.remove('show');
        document.getElementById('backgroundPreview').innerHTML = '';
        if (modalTitle) modalTitle.textContent = 'Neues Ereignis erstellen';
    }
}

// Wunschzettel-Einstellungen speichern
async function saveWishlistSettings() {
    const name = document.getElementById('wishlistName').value;
    const occasion = document.getElementById('wishlistOccasion').value;
    const date = document.getElementById('wishlistDate').value;
    const backgroundUrl = document.getElementById('wishlistBackground').value;
    const backgroundFile = document.getElementById('wishlistBackgroundFile').files[0];
    
    let bgImage = backgroundUrl;
    
    // Wenn eine Datei hochgeladen wurde, konvertiere sie zu Base64
    if (backgroundFile) {
        try {
            bgImage = await fileToBase64(backgroundFile);
        } catch (error) {
            showToast('Fehler beim Hochladen des Hintergrundbildes: ' + error.message, 'error');
            return;
        }
    }
    
    backgroundImage = bgImage || null;
    wishlistSettings = { name, occasion, date, backgroundImage: backgroundImage };
    
    // Event aktualisieren oder neu erstellen
    if (currentEventId) {
        const eventIndex = events.findIndex(e => e.id === currentEventId);
        if (eventIndex >= 0) {
            events[eventIndex].name = name;
            events[eventIndex].occasion = occasion;
            events[eventIndex].date = date;
            events[eventIndex].backgroundImage = backgroundImage;
        }
    } else {
        // Neues Event erstellen (robuste eindeutige ID)
        const newEvent = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
            name: name,
            occasion: occasion,
            date: date,
            backgroundImage: backgroundImage,
            wishes: [],
            createdAt: new Date().toISOString()
        };
        events.push(newEvent);
        currentEventId = newEvent.id;
    }
    
    saveUserData();
    updateUI();
    updateCountdown();
    updateBackgroundImage();
    closeModalById('wishlistSettingsModal');
    showToast('Einstellungen gespeichert!', 'success');
    
    // Nach dem Speichern zum Event-Detail wechseln
    if (currentEventId) {
        showEventDetail(currentEventId);
    } else {
        // Nach dem Erstellen eines neuen Events zur Übersicht
        renderEvents();
    }
}

// Neues Event erstellen
function createNewEvent() {
    currentEventId = null;
    wishes = [];
    wishlistSettings = null;
    openWishlistSettings();
}

// User-Daten speichern
function saveUserData() {
    if (!currentUser) return;
    
    // Aktuelles Event aktualisieren
    if (currentEventId) {
        const eventIndex = events.findIndex(e => e.id === currentEventId);
        if (eventIndex >= 0) {
            events[eventIndex].wishes = wishes;
            events[eventIndex].name = wishlistSettings?.name || events[eventIndex].name;
            events[eventIndex].occasion = wishlistSettings?.occasion || events[eventIndex].occasion;
            events[eventIndex].date = wishlistSettings?.date || events[eventIndex].date;
            events[eventIndex].backgroundImage = wishlistSettings?.backgroundImage || events[eventIndex].backgroundImage;
        }
    }
    
    const userData = {
        user: currentUser,
        events: events
    };
    localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(userData));
    // Aktualisiere geteilte Daten für Events mit shareId
    events.forEach(ev => {
        if (ev.shareId) {
            const sharedData = localStorage.getItem(`shared_${ev.shareId}`);
            const payload = {
                eventId: ev.id,
                name: ev.name,
                occasion: ev.occasion,
                date: ev.date,
                wishes: ev.wishes,
                backgroundImage: ev.backgroundImage || null
            };
            localStorage.setItem(`shared_${ev.shareId}`, JSON.stringify(sharedData ? { ...JSON.parse(sharedData), ...payload } : payload));
        }
    });
}

// Prüfe ob wir im Teilen-Modus sind
function checkShareMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareMode = urlParams.get('share');
    const shareId = urlParams.get('id');
    const shareDataParam = urlParams.get('data');
    
    if (shareMode === 'true' && (shareId || shareDataParam)) {
        isReadOnly = true;
        let sharedData = shareId ? localStorage.getItem(`shared_${shareId}`) : null;
        if (!sharedData && shareDataParam) {
            try {
                const json = decodeURIComponent(escape(atob(shareDataParam)));
                sharedData = json;
            } catch {}
        }
        if (sharedData) {
            try {
                const data = JSON.parse(sharedData);
                // Stelle sicher, dass alle Wünsche ein giftedBy Array haben
                wishes = (data.wishes || []).map(w => ({
                    ...w,
                    giftedBy: w.giftedBy || []
                }));
                
                // Unterstütze sowohl alte als auch neue Datenstruktur
                if (data.settings) {
                    // Alte Struktur
                    wishlistSettings = data.settings;
                } else {
                    // Neue Struktur
                    wishlistSettings = {
                        name: data.name || 'Wunschliste',
                        occasion: data.occasion || 'other',
                        date: data.date || null,
                        backgroundImage: data.backgroundImage || null
                    };
                }
                backgroundImage = wishlistSettings.backgroundImage || null;
                
                // Zeige App-Screen direkt an (ohne Login)
                document.getElementById('authScreen').style.display = 'none';
                document.getElementById('appScreen').style.display = 'block';
                document.getElementById('eventsOverviewScreen').style.display = 'none';
                document.getElementById('eventDetailScreen').style.display = 'block';
                
                // Verstecke alle Bearbeitungs-Buttons und Controls
                const headerButtons = document.getElementById('headerButtons');
                const controlsPanel = document.getElementById('controlsPanel');
                const userInfo = document.getElementById('userNameDisplay')?.parentElement;
                const backBtn = document.getElementById('backToEventsBtn');
                
                if (headerButtons) headerButtons.style.display = 'none';
                if (controlsPanel) controlsPanel.style.display = 'none';
                if (userInfo) userInfo.style.display = 'none';
                if (backBtn) backBtn.style.display = 'none';
                const shareActions = document.getElementById('shareActions');
                if (shareActions) shareActions.style.display = 'flex';
                
                // Prüfe ob Name bereits eingegeben wurde
                shareName = shareId ? localStorage.getItem(`shareName_${shareId}`) : shareName;
                
                if (!shareName) {
                    // Zeige Modal für Name-Eingabe
                    const nameModal = document.getElementById('shareNameModal');
                    if (nameModal) {
                        nameModal.classList.add('show');
                    }
                } else {
                    // Name bereits vorhanden, zeige direkt die Wunschliste
                    if (shareId) showSharedWishlist(shareId);
                }
                
                return true; // Share-Modus aktiv
            } catch (error) {
                console.error('Fehler beim Laden der geteilten Daten:', error);
                showToast('Fehler beim Laden der geteilten Wunschliste!', 'error');
            }
        } else {
            // Share-ID existiert nicht mehr
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'block';
            document.getElementById('eventsOverviewScreen').style.display = 'none';
            document.getElementById('eventDetailScreen').style.display = 'block';
            const container = document.getElementById('wishlistContainer');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Diese geteilte Wunschliste existiert nicht mehr oder ist abgelaufen.</p>
                        <p>Bitte kontaktiere die Person, die die Liste geteilt hat.</p>
                    </div>
                `;
            }
            return true; // Share-Modus aktiv (auch wenn Daten fehlen)
        }
    }
    
    return false; // Nicht im Share-Modus
}

// Wunsch als geschenkt markieren (im Share-Modus)
function markAsGifted(index) {
    if (!isReadOnly || !shareName) return;
    
    const wish = wishes[index];
    if (wish && wish.doNotWant) { showToast('Dieser Wunsch ist als Nicht gewünscht markiert', 'info'); return; }
    if (!wish.giftedBy) {
        wish.giftedBy = [];
    }
    
    if (!wish.giftedBy.includes(shareName)) {
        wish.giftedBy.push(shareName);
        
        // Speichere die Änderung in den geteilten Daten
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('id');
        if (shareId) {
            const sharedData = localStorage.getItem(`shared_${shareId}`);
            if (sharedData) {
                try {
                    const data = JSON.parse(sharedData);
                    const wishIndex = data.wishes.findIndex(w => w.id === wish.id);
                    if (wishIndex >= 0) {
                        data.wishes[wishIndex] = wish;
                        localStorage.setItem(`shared_${shareId}`, JSON.stringify(data));
                        
                        // Aktualisiere auch das Original-Event, damit die Information gespeichert wird
                        // (aber der Inhaber sieht sie nicht, da isReadOnly = false im normalen Modus)
                        if (data.eventId && currentUser) {
                            const userData = localStorage.getItem(`user_${currentUser.email}`);
                            if (userData) {
                                try {
                                    const userDataObj = JSON.parse(userData);
                                    if (userDataObj.events && Array.isArray(userDataObj.events)) {
                                        const eventIndex = userDataObj.events.findIndex(e => e.id === data.eventId);
                                        if (eventIndex >= 0) {
                                            const wishIndexInEvent = userDataObj.events[eventIndex].wishes.findIndex(w => w.id === wish.id);
                                            if (wishIndexInEvent >= 0) {
                                                userDataObj.events[eventIndex].wishes[wishIndexInEvent] = wish;
                                                localStorage.setItem(`user_${currentUser.email}`, JSON.stringify(userDataObj));
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('Fehler beim Aktualisieren des Original-Events:', error);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Fehler beim Speichern:', error);
                }
            }
        }
        
        showToast(`Du hast "${wish.name}" als Geschenk markiert!`, 'success');
        renderWishes();
    } else {
        showToast('Du hast diesen Wunsch bereits als Geschenk markiert!', 'info');
    }
}

// Geteilte Wunschliste anzeigen
function showSharedWishlist(shareId) {
    const sharedData = localStorage.getItem(`shared_${shareId}`);
    if (!sharedData) return;
    
    try {
        const data = JSON.parse(sharedData);
        // Stelle sicher, dass alle Wünsche ein giftedBy Array haben
        wishes = (data.wishes || []).map(w => ({
            ...w,
            giftedBy: w.giftedBy || []
        }));
        
        // Unterstütze sowohl alte als auch neue Datenstruktur
        if (data.settings) {
            wishlistSettings = data.settings;
        } else {
            wishlistSettings = {
                name: data.name || 'Wunschliste',
                occasion: data.occasion || 'other',
                date: data.date || null,
                backgroundImage: data.backgroundImage || null
            };
        }
        backgroundImage = wishlistSettings.backgroundImage || null;
        
        // Zeige App-Screen direkt an (ohne Login)
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        document.getElementById('eventsOverviewScreen').style.display = 'none';
        document.getElementById('eventDetailScreen').style.display = 'block';
        
        // Verstecke alle Bearbeitungs-Buttons und Controls
        const headerButtons = document.getElementById('headerButtons');
        const controlsPanel = document.getElementById('controlsPanel');
        const userInfo = document.getElementById('userNameDisplay')?.parentElement;
        const backBtn = document.getElementById('backToEventsBtn');
        
        if (headerButtons) headerButtons.style.display = 'none';
        if (controlsPanel) controlsPanel.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        if (backBtn) backBtn.style.display = 'none';
        
        // Zeige Share-Name-Info
        const title = document.getElementById('mainTitle');
        if (title && shareName) {
            title.textContent = `Geteilte Wunschliste: ${wishlistSettings.name || 'Wunschliste'}`;
            // Füge Share-Name-Info hinzu
            const shareInfo = document.createElement('div');
            shareInfo.id = 'shareNameInfo';
            shareInfo.className = 'share-name-info';
            shareInfo.innerHTML = `<span>Du schenkst als: <strong>${shareName}</strong></span>`;
            title.parentElement.insertBefore(shareInfo, title.nextSibling);
        }
        
        // Update UI mit geteilten Daten
        updateUI();
        updateBackgroundImage();
        updateCountdown();
        filteredWishes = [...wishes];
        updateStats();
        renderWishes();
        updateCategoryFilter();
    } catch (error) {
        console.error('Fehler beim Laden der geteilten Daten:', error);
        showToast('Fehler beim Laden der geteilten Wunschliste!', 'error');
    }
}

// Konvertiere Datei zu Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Toast-Benachrichtigung anzeigen
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Modal öffnen
function openModal() {
    const modal = document.getElementById('wishModal');
    modal.classList.add('show');
    editingIndex = -1;
    document.getElementById('modalTitle').textContent = 'Neuen Wunsch hinzufügen';
    document.getElementById('wishForm').reset();
    document.getElementById('priorityValue').textContent = '5';
    document.getElementById('imagePreview').classList.remove('show');
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('groupGiftDetails').style.display = 'none';
}

// Modal schließen
function closeModal() {
    const modal = document.getElementById('wishModal');
    modal.classList.remove('show');
    editingIndex = -1;
    document.getElementById('wishForm').reset();
    document.getElementById('imagePreview').classList.remove('show');
    document.getElementById('imagePreview').innerHTML = '';
}

// Modal nach ID schließen
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

let wheelItems = [];
let wheelAngle = 0;
let wheelVelocity = 0;
let wheelAnimating = false;
let wheelAnimationId = null;
let selectedWheelItem = null;

function openWheelModal() {
    const list = wishes.filter(w => Array.isArray(w.giftedBy) && w.giftedBy.length > 0 && !w.doNotWant);
    if (list.length === 0) {
        showToast('Keine gekauften Wünsche vorhanden', 'info');
        return;
    }
    wheelItems = list.map(w => ({ id: w.id, name: w.name, index: wishes.findIndex(x => x.id === w.id) }));
    wheelAngle = 0;
    wheelVelocity = 0;
    wheelAnimating = false;
    const modal = document.getElementById('wheelModal');
    modal.classList.add('show');
    renderWheel();
    const wheelList = document.getElementById('wheelList');
    wheelList.innerHTML = wheelItems.map(n => `<div class="suggestion-item">${n.name}</div>`).join('');
}

function openWheelModalAll() {
    const list = wishes.filter(w => !w.doNotWant);
    if (list.length === 0) {
        showToast('Keine Wünsche vorhanden', 'info');
        return;
    }
    wheelItems = list.map(w => ({ id: w.id, name: w.name, index: wishes.findIndex(x => x.id === w.id) }));
    wheelAngle = 0;
    wheelVelocity = 0;
    wheelAnimating = false;
    const modal = document.getElementById('wheelModal');
    modal.classList.add('show');
    renderWheel();
    const wheelList = document.getElementById('wheelList');
    wheelList.innerHTML = wheelItems.map(n => `<div class="suggestion-item">${n.name}</div>`).join('');
}

function renderWheel() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 10;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const count = wheelItems.length;
    const step = (Math.PI * 2) / count;
    const colors = ['#4d9aff','#6bb3ff','#2b3e57','#223045','#1a1f2b','#3a7bd5','#00c6ff'];
    for (let i = 0; i < count; i++) {
        const start = wheelAngle + i * step;
        const end = start + step;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.save();
        ctx.translate(cx, cy);
        const textAngle = start + step / 2;
        ctx.rotate(textAngle);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(wheelItems[i].name, r - 12, 6);
        ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#0f1117';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 10);
    ctx.lineTo(cx + 14, cy - r + 18);
    ctx.lineTo(cx - 14, cy - r + 18);
    ctx.closePath();
    ctx.fillStyle = '#4d9aff';
    ctx.fill();
}

function spinWheel() {
    if (wheelAnimating || wheelItems.length === 0) return;
    wheelVelocity = 0.4 + Math.random() * 0.4;
    const friction = 0.003 + Math.random() * 0.002;
    wheelAnimating = true;
    function tick() {
        wheelAngle += wheelVelocity;
        wheelVelocity = Math.max(0, wheelVelocity - friction);
        renderWheel();
        if (wheelVelocity <= 0.001) {
            wheelAnimating = false;
            cancelAnimationFrame(wheelAnimationId);
            const count = wheelItems.length;
            const step = (Math.PI * 2) / count;
            const a = (Math.PI * 2 + (wheelAngle % (Math.PI * 2))) % (Math.PI * 2);
            const pointerAngle = ((Math.PI * 2) - a) % (Math.PI * 2);
            const index = Math.floor(pointerAngle / step) % count;
            selectedWheelItem = wheelItems[index];
            showWheelConfirm(selectedWheelItem);
            return;
        }
        wheelAnimationId = requestAnimationFrame(tick);
    }
    wheelAnimationId = requestAnimationFrame(tick);
}

function showWheelConfirm(item) {
    const box = document.getElementById('wheelConfirm');
    const text = document.getElementById('wheelConfirmText');
    if (!box || !text) return;
    text.innerHTML = `Willst du "${item.name}" schenken?`;
    box.style.display = 'block';
}

// Wunsch hinzufügen/bearbeiten
async function handleWishSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('wishName').value;
    const price = parseFloat(document.getElementById('wishPrice').value);
    const priority = parseInt(document.getElementById('wishPriority').value);
    const category = document.getElementById('wishCategory').value;
    const imageUrl = document.getElementById('wishImage').value;
    const imageFile = document.getElementById('wishImageFile').files[0];
    const productUrl = document.getElementById('wishProductUrl').value;
    const isGroupGift = document.getElementById('wishGroupGift').checked;
    const groupGiftNames = document.getElementById('groupGiftNames').value;
    const doNotWant = document.getElementById('wishDoNotWant').checked;
    
    let image = imageUrl;
    
    if (imageFile) {
        try {
            image = await fileToBase64(imageFile);
        } catch (error) {
            alert('Fehler beim Hochladen des Bildes: ' + error.message);
            return;
        }
    }
    
    const wish = {
        id: editingIndex >= 0 ? wishes[editingIndex].id : Date.now(),
        name: name,
        price: price,
        priority: priority,
        category: category,
        image: image || 'https://via.placeholder.com/300x200?text=Kein+Bild',
        priceUrl: productUrl || '',
        trackedPrice: null,
        isGroupGift: isGroupGift,
        groupGiftNames: isGroupGift ? groupGiftNames.split(',').map(n => n.trim()) : [],
        doNotWant: doNotWant,
        addedBy: currentUser ? currentUser.name : 'Unbekannt',
        addedAt: new Date().toISOString()
    };
    
    const isNew = editingIndex < 0;
    
    if (editingIndex >= 0) {
        wishes[editingIndex] = wish;
    } else {
        wishes.push(wish);
        // Benachrichtige andere User (Mock)
        if (currentUser) {
            sendNewGiftNotification(wish.name, currentUser.name);
        }
    }
    
    saveUserData();
    showToast(isNew ? 'Wunsch erfolgreich hinzugefügt!' : 'Wunsch erfolgreich bearbeitet!', 'success');
    if (wish.priceUrl) {
        try {
            await checkPriceForWish(wish);
            saveUserData();
            updateSharedPricesForCurrentEvent();
        } catch {}
    }
    applyFiltersAndSort();
    closeModal();
}

// Wunsch bearbeiten
function editWish(index) {
    if (isReadOnly) return;
    
    const wish = wishes[index];
    editingIndex = index;
    
    document.getElementById('modalTitle').textContent = 'Wunsch bearbeiten';
    document.getElementById('wishName').value = wish.name;
    document.getElementById('wishPrice').value = wish.price;
    document.getElementById('wishPriority').value = wish.priority;
    document.getElementById('priorityValue').textContent = wish.priority;
    document.getElementById('wishCategory').value = wish.category || '';
    document.getElementById('wishImage').value = wish.image.startsWith('data:') ? '' : wish.image;
    document.getElementById('wishImageFile').value = '';
    document.getElementById('wishProductUrl').value = wish.priceUrl || '';
    const info = document.getElementById('detectedPriceInfo');
    if (info) {
        if (typeof wish.trackedPrice === 'number') {
            info.textContent = `Preis erkannt: ${wish.trackedPrice.toFixed(2)} €`;
            document.getElementById('wishPrice').readOnly = true;
            document.getElementById('wishPrice').value = wish.trackedPrice.toFixed(2);
        } else {
            info.textContent = '';
            document.getElementById('wishPrice').readOnly = false;
        }
    }
    document.getElementById('wishGroupGift').checked = wish.isGroupGift || false;
    document.getElementById('groupGiftNames').value = (wish.groupGiftNames || []).join(', ');
    const dnw = document.getElementById('wishDoNotWant'); if (dnw) dnw.checked = !!wish.doNotWant;
    document.getElementById('groupGiftDetails').style.display = wish.isGroupGift ? 'block' : 'none';
    
    openModal();
}

// Wunsch löschen
function deleteWish(index) {
    if (isReadOnly) return;
    
    if (confirm('Möchtest du diesen Wunsch wirklich löschen?')) {
        wishes.splice(index, 1);
        saveUserData();
        showToast('Wunsch erfolgreich gelöscht!', 'success');
        applyFiltersAndSort();
    }
}

// Statistiken aktualisieren
function updateStats() {
    let visibleWishes = filteredWishes.length > 0 ? filteredWishes : wishes;
    if (!isReadOnly) visibleWishes = visibleWishes.filter(w => !w.doNotWant);
    const count = visibleWishes.length;
    const total = visibleWishes.reduce((sum, w) => sum + w.price, 0);
    const avg = count > 0 ? total / count : 0;
    
    document.getElementById('wishCount').textContent = count;
    document.getElementById('totalPrice').textContent = total.toFixed(2) + ' €';
    document.getElementById('avgPrice').textContent = avg.toFixed(2) + ' €';
}

// Kategorie-Filter aktualisieren
function updateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    const categories = [...new Set(wishes.map(w => w.category).filter(c => c))];
    
    filter.innerHTML = '<option value="">Alle Kategorien</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filter.appendChild(option);
    });
}

const SAMPLE_WISHES = [
    { id: 'sample_1',  name: 'Kabellose Kopfhörer',       price: 59.99, category: 'Technik',   image: 'https://picsum.photos/seed/headphones/600/400', priority: 8 },
    { id: 'sample_2',  name: 'Smartwatch',                price: 129.00, category: 'Technik',  image: 'https://picsum.photos/seed/smartwatch/600/400', priority: 7 },
    { id: 'sample_3',  name: 'Bluetooth Lautsprecher',    price: 49.90, category: 'Technik',   image: 'https://picsum.photos/seed/speaker/600/400', priority: 7 },
    { id: 'sample_4',  name: 'Powerbank 20000 mAh',       price: 29.95, category: 'Technik',   image: 'https://picsum.photos/seed/powerbank/600/400', priority: 6 },
    { id: 'sample_5',  name: 'Gaming Maus',               price: 39.99, category: 'Technik',   image: 'https://picsum.photos/seed/mouse/600/400', priority: 6 },
    { id: 'sample_6',  name: 'Der Alchimist (Buch)',      price: 12.99, category: 'Bücher',    image: 'https://picsum.photos/seed/alchemist/600/400', priority: 5 },
    { id: 'sample_7',  name: 'Harry Potter (Buch)',       price: 19.99, category: 'Bücher',    image: 'https://picsum.photos/seed/harry/600/400', priority: 6 },
    { id: 'sample_8',  name: 'Schwarzer Hoodie',          price: 34.99, category: 'Kleidung',  image: 'https://picsum.photos/seed/hoodie/600/400', priority: 6 },
    { id: 'sample_9',  name: 'Weiße Sneaker',             price: 79.00, category: 'Kleidung',  image: 'https://picsum.photos/seed/sneaker/600/400', priority: 7 },
    { id: 'sample_10', name: 'LEGO Creator Set',          price: 59.99, category: 'Spiele',    image: 'https://picsum.photos/seed/lego/600/400', priority: 7 },
    { id: 'sample_11', name: 'Brettspiel Catan',          price: 32.90, category: 'Spiele',    image: 'https://picsum.photos/seed/catan/600/400', priority: 6 },
    { id: 'sample_12', name: 'Fußball Trainingsball',     price: 24.99, category: 'Sport',     image: 'https://picsum.photos/seed/football/600/400', priority: 5 },
    { id: 'sample_13', name: 'Fitnessband',               price: 19.99, category: 'Sport',     image: 'https://picsum.photos/seed/fitnessband/600/400', priority: 6 },
    { id: 'sample_14', name: 'Silberkette',               price: 49.00, category: 'Schmuck',   image: 'https://picsum.photos/seed/necklace/600/400', priority: 6 },
    { id: 'sample_15', name: 'Lederarmband',              price: 29.00, category: 'Schmuck',   image: 'https://picsum.photos/seed/bracelet/600/400', priority: 5 },
    { id: 'sample_16', name: 'Edelstahl Ring',            price: 45.00, category: 'Schmuck',   image: 'https://picsum.photos/seed/ring/600/400', priority: 5 },
    { id: 'sample_17', name: 'Schreibtischlampe',         price: 89.00, category: 'Möbel',     image: 'https://picsum.photos/seed/lamp/600/400', priority: 6 },
    { id: 'sample_18', name: 'Wandregal',                 price: 39.00, category: 'Möbel',     image: 'https://picsum.photos/seed/shelf/600/400', priority: 5 },
    { id: 'sample_19', name: 'Kissen-Set',                price: 25.00, category: 'Möbel',     image: 'https://picsum.photos/seed/pillow/600/400', priority: 5 },
    { id: 'sample_20', name: 'Kino Gutschein',            price: 20.00, category: 'Erlebnisse', image: 'https://picsum.photos/seed/cinema/600/400', priority: 6 },
    { id: 'sample_21', name: 'Escape Room',               price: 30.00, category: 'Erlebnisse', image: 'https://picsum.photos/seed/escape/600/400', priority: 7 },
    { id: 'sample_22', name: 'Therme Tag',                price: 35.00, category: 'Erlebnisse', image: 'https://picsum.photos/seed/spa/600/400', priority: 6 },
    { id: 'sample_23', name: 'Thermobecher',              price: 18.99, category: 'Sonstiges', image: 'https://picsum.photos/seed/mug/600/400', priority: 5 },
    { id: 'sample_24', name: 'Rucksack',                  price: 54.99, category: 'Sonstiges', image: 'https://picsum.photos/seed/backpack/600/400', priority: 6 },
    { id: 'sample_25', name: 'Trinkflasche',              price: 14.99, category: 'Sonstiges', image: 'https://picsum.photos/seed/bottle/600/400', priority: 5 },
    { id: 'sample_26', name: 'USB‑C Hub',                 price: 24.99, category: 'Technik',   image: 'https://picsum.photos/seed/hub/600/400', priority: 5 },
    { id: 'sample_27', name: 'SSD 1TB',                   price: 79.99, category: 'Technik',   image: 'https://picsum.photos/seed/ssd/600/400', priority: 7 },
    { id: 'sample_28', name: 'Mechanische Tastatur',      price: 59.99, category: 'Technik',   image: 'https://picsum.photos/seed/keyboard/600/400', priority: 6 },
    { id: 'sample_29', name: 'Kochbuch Italien',          price: 22.00, category: 'Bücher',    image: 'https://picsum.photos/seed/cookbook/600/400', priority: 5 },
    { id: 'sample_30', name: 'Kalender 2026',             price: 14.00, category: 'Bücher',    image: 'https://picsum.photos/seed/calendar/600/400', priority: 4 },
    { id: 'sample_31', name: 'Wintermütze',               price: 12.00, category: 'Kleidung',  image: 'https://picsum.photos/seed/hat/600/400', priority: 5 },
    { id: 'sample_32', name: 'Lederhandschuhe',           price: 27.00, category: 'Kleidung',  image: 'https://picsum.photos/seed/gloves/600/400', priority: 5 },
    { id: 'sample_33', name: 'Puzzle 1000 Teile',         price: 16.00, category: 'Spiele',    image: 'https://picsum.photos/seed/puzzle/600/400', priority: 5 },
    { id: 'sample_34', name: 'Nintendo eShop Karte',      price: 25.00, category: 'Spiele',    image: 'https://picsum.photos/seed/eshop/600/400', priority: 6 },
    { id: 'sample_35', name: 'Springseil',                price: 11.00, category: 'Sport',     image: 'https://picsum.photos/seed/rope/600/400', priority: 4 },
    { id: 'sample_36', name: 'Yogamatte',                 price: 29.00, category: 'Sport',     image: 'https://picsum.photos/seed/yoga/600/400', priority: 6 },
    { id: 'sample_37', name: 'Ohrringe',                  price: 39.00, category: 'Schmuck',   image: 'https://picsum.photos/seed/earrings/600/400', priority: 5 },
    { id: 'sample_38', name: 'Armbanduhr',                price: 119.00, category: 'Schmuck',  image: 'https://picsum.photos/seed/watch/600/400', priority: 7 },
    { id: 'sample_39', name: 'Schreibtischstuhl',         price: 149.00, category: 'Möbel',    image: 'https://picsum.photos/seed/chair/600/400', priority: 7 },
    { id: 'sample_40', name: 'Pflanzentopf',              price: 15.00, category: 'Möbel',     image: 'https://picsum.photos/seed/plantpot/600/400', priority: 4 },
    { id: 'sample_41', name: 'Konzertticket',             price: 99.00, category: 'Erlebnisse', image: 'https://picsum.photos/seed/concert/600/400', priority: 8 },
    { id: 'sample_42', name: 'Museumspass',               price: 19.00, category: 'Erlebnisse', image: 'https://picsum.photos/seed/museum/600/400', priority: 5 },
    { id: 'sample_43', name: 'Kartenetui',                price: 17.00, category: 'Sonstiges', image: 'https://picsum.photos/seed/cardholder/600/400', priority: 4 },
    { id: 'sample_44', name: 'Wandkalender',              price: 12.00, category: 'Sonstiges', image: 'https://picsum.photos/seed/wallcalendar/600/400', priority: 4 },
    { id: 'sample_45', name: 'HD Webcam',                 price: 49.00, category: 'Technik',   image: 'https://picsum.photos/seed/webcam/600/400', priority: 6 },
    { id: 'sample_46', name: 'USB Mikrofon',              price: 59.00, category: 'Technik',   image: 'https://picsum.photos/seed/microphone/600/400', priority: 6 },
    { id: 'sample_47', name: 'Fantasy Roman',             price: 13.00, category: 'Bücher',    image: 'https://picsum.photos/seed/fantasy/600/400', priority: 5 },
    { id: 'sample_48', name: 'Socken Set',                price: 9.90,  category: 'Kleidung',  image: 'https://picsum.photos/seed/socks/600/400', priority: 4 },
    { id: 'sample_49', name: 'UNO Kartenspiel',           price: 8.90,  category: 'Spiele',    image: 'https://picsum.photos/seed/uno/600/400', priority: 5 },
    { id: 'sample_50', name: 'Pro Wasserflasche',         price: 21.00, category: 'Sport',     image: 'https://picsum.photos/seed/waterbottle/600/400', priority: 5 }
];

function renderOtherWishlists() {
    const c = document.getElementById('otherListContainer');
    c.innerHTML = '';
    SAMPLE_WISHES.forEach((w) => {
        const card = document.createElement('div');
        card.className = 'wish-card';
        const stars = '★'.repeat(w.priority);
        const emptyStars = '☆'.repeat(10 - w.priority);
        card.innerHTML = `
            <div class="wish-category">${w.category}</div>
            <div class="wish-image">${w.image ? `<img src="${w.image}" alt="${w.name}" onerror="this.src='https://picsum.photos/seed/gift/600/400'">` : `<img src="https://picsum.photos/seed/gift/600/400" alt="${w.name}">`}</div>
            <div class="wish-name">${w.name}</div>
            <div class="wish-price">${w.price.toFixed(2)} €</div>
            <div class="wish-priority"><span class="priority-label">Wunschstärke:</span><div class="priority-stars" title="${w.priority}/10">${stars}${emptyStars}</div></div>
        `;
        c.appendChild(card);
    });
}

function renderProTable() {
    const el = document.getElementById('proPlanTable');
    if (!el) return;
    const rows = [
        { name: 'Werbung', free: '✓', pro: 'X' },
        { name: 'Design‑Themen', free: 'Basis', pro: 'Festlich je Anlass' },
        { name: 'Glücksrad', free: '✓', pro: '✓' },
        { name: 'Preiserkennung', free: '✓', pro: '✓' },
        { name: 'Rabatt‑Check', free: 'Täglich', pro: 'Täglich + Hinweis' },
        { name: 'Synchronisierung', free: 'Share‑Link', pro: 'Share‑Link + Rabatte' },
        { name: 'Export', free: 'Text/JSON', pro: 'Text/JSON + Präsentation' },
        { name: 'Statistiken', free: 'Basis', pro: 'Erweitert' },
        { name: 'AI‑Vorschläge', free: 'Basis', pro: 'Erweitert' },
        { name: 'Support', free: 'Standard', pro: 'Schnell' }
    ];
    el.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'plan-row plan-header';
    header.innerHTML = '<div>Funktion</div><div>Free</div><div>Pro</div>';
    el.appendChild(header);
    rows.forEach(r => {
        const row = document.createElement('div');
        row.className = 'plan-row';
        const freeVal = (r.free === '✓') ? `<span class="plan-ok">✓</span>` : r.free;
        const proVal = (r.pro === '✓') ? `<span class="plan-ok">✓</span>` : (r.pro === 'X' || r.pro === '✗') ? `<span class="plan-no">X</span>` : r.pro;
        row.innerHTML = `<div>${r.name}</div><div>${freeVal}</div><div>${proVal}</div>`;
        el.appendChild(row);
    });
}

function renderProProjectTable() {
    const el = document.getElementById('proProjectTable');
    if (!el) return;
    if (!window.proProjectState) {
        window.proProjectState = { sortKey: 'id', sortDir: 'asc', filterStatus: 'alle', search: '' };
        window.proProjectRows = [
            { id: 'PR-101', name: 'UI Redesign', status: 'In Arbeit', start: '03.11.2025', due: '20.11.2025', owner: 'A. Müzig', effort: 12, note: 'Header, Buttons, Karten' },
            { id: 'PR-102', name: 'Preisprüfung v2', status: 'Geplant', start: '15.11.2025', due: '30.11.2025', owner: 'Team', effort: 9, note: 'Verbesserte Erkennung' },
            { id: 'PR-103', name: 'Export Präsentation', status: 'Abgeschlossen', start: '10.10.2025', due: '24.10.2025', owner: 'S. Weber', effort: 7, note: 'Slides generieren' },
            { id: 'PR-104', name: 'Pro Themen', status: 'In Arbeit', start: '12.11.2025', due: '25.11.2025', owner: 'Anton', effort: 10, note: 'Anlass‑Styles' },
            { id: 'PR-105', name: 'Teilen & Reservierung', status: 'Abgeschlossen', start: '01.10.2025', due: '12.10.2025', owner: 'Team', effort: 8, note: 'Share‑Flow' },
            { id: 'PR-106', name: 'Statistiken erweitert', status: 'Geplant', start: '22.11.2025', due: '05.12.2025', owner: 'Data', effort: 11, note: 'Charts & KPIs' },
            { id: 'PR-107', name: 'Cookie Einstellungen', status: 'Abgeschlossen', start: '05.10.2025', due: '08.10.2025', owner: 'Frontend', effort: 3, note: 'Banner & Modal' },
            { id: 'PR-108', name: 'AI Vorschläge Plus', status: 'In Arbeit', start: '09.11.2025', due: '28.11.2025', owner: 'AI', effort: 14, note: 'Qualität erhöhen' },
            { id: 'PR-109', name: 'Mobile Optimierung', status: 'Abgeschlossen', start: '18.10.2025', due: '31.10.2025', owner: 'Mobile', effort: 6, note: 'Formulare, Karten' },
            { id: 'PR-110', name: 'Pro Vergleichstabelle', status: 'Abgeschlossen', start: '07.11.2025', due: '10.11.2025', owner: 'Frontend', effort: 2, note: 'Feature Matrix' },
            { id: 'PR-111', name: 'Performance Tuning', status: 'Geplant', start: '26.11.2025', due: '10.12.2025', owner: 'Backend', effort: 10, note: 'Caching & Bundles' },
            { id: 'PR-112', name: 'Support Prozess', status: 'Geplant', start: '02.12.2025', due: '12.12.2025', owner: 'Ops', effort: 5, note: 'Antwortzeiten' }
        ];
    }
    el.innerHTML = '';
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.innerHTML = `
        <div class="control"><label>Status</label><select id="projStatusFilter"><option value="alle">Alle</option><option value="Geplant">Geplant</option><option value="In Arbeit">In Arbeit</option><option value="Abgeschlossen">Abgeschlossen</option></select></div>
        <div class="control"><label>Suche</label><input id="projSearch" type="text" placeholder="ID, Name, Verantwortlich"></div>
    `;
    el.appendChild(controls);
    const header = document.createElement('div');
    header.className = 'data-row data-header';
    header.innerHTML = '<div data-key="id">ID</div><div data-key="name">Name</div><div data-key="status">Status</div><div data-key="start">Start</div><div data-key="due">Fällig</div><div data-key="owner">Verantwortlich</div><div data-key="effort">Aufwand (Tage)</div>';
    el.appendChild(header);
    const state = window.proProjectState;
    let rows = [...window.proProjectRows];
    if (state.filterStatus !== 'alle') rows = rows.filter(r => r.status === state.filterStatus);
    if (state.search) {
        const q = state.search.toLowerCase();
        rows = rows.filter(r => (r.id + r.name + r.owner + r.status).toLowerCase().includes(q));
    }
    rows.sort((a,b) => {
        const k = state.sortKey;
        const av = a[k];
        const bv = b[k];
        if (k === 'effort') return state.sortDir === 'asc' ? av - bv : bv - av;
        return state.sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    rows.forEach(r => {
        const row = document.createElement('div');
        row.className = 'data-row';
        const sClass = r.status === 'Abgeschlossen' ? 'done' : r.status === 'In Arbeit' ? 'ok' : r.status === 'Geplant' ? 'pending' : 'blocked';
        row.innerHTML = `<div>${r.id}</div><div>${r.name}</div><div><span class="badge ${sClass}">${r.status}</span></div><div>${r.start}</div><div>${r.due}</div><div>${r.owner}</div><div>${r.effort}</div>`;
        el.appendChild(row);
    });
    header.querySelectorAll('div').forEach(d => d.addEventListener('click', () => { const key = d.getAttribute('data-key'); if (!key) return; if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; else { state.sortKey = key; state.sortDir = 'asc'; } renderProProjectTable(); }));
    document.getElementById('projStatusFilter').value = state.filterStatus;
    document.getElementById('projStatusFilter').addEventListener('change', (e) => { state.filterStatus = e.target.value; renderProProjectTable(); });
    document.getElementById('projSearch').value = state.search;
    document.getElementById('projSearch').addEventListener('input', (e) => { state.search = e.target.value; renderProProjectTable(); });
}

// Suche und Sortierung anwenden
function applyFiltersAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortValue = document.getElementById('sortSelect').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredWishes = wishes.filter(wish => {
        const matchesSearch = wish.name.toLowerCase().includes(searchTerm) ||
                            wish.price.toString().includes(searchTerm) ||
                            (wish.category && wish.category.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || wish.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    filteredWishes.sort((a, b) => {
        switch(sortValue) {
            case 'priority':
                return b.priority - a.priority;
            case 'priority-asc':
                return a.priority - b.priority;
            case 'price':
                return b.price - a.price;
            case 'price-asc':
                return a.price - b.price;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'category':
                return (a.category || '').localeCompare(b.category || '');
            case 'newest':
                return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
            case 'oldest':
                return new Date(a.addedAt || 0) - new Date(b.addedAt || 0);
            default:
                return b.priority - a.priority;
        }
    });
    
    currentSort = sortValue;
    updateStats();
    renderWishes();
}

// Wünsche rendern
function renderWishes() {
    const container = document.getElementById('wishlistContainer');
    const emptyState = document.getElementById('emptyState');
    const isFiltering = document.getElementById('searchInput').value.trim() || document.getElementById('categoryFilter').value;
    let wishesToRender = isFiltering ? filteredWishes : wishes;
    if (!isReadOnly) wishesToRender = wishesToRender.filter(w => !w.doNotWant);
    
    if (wishesToRender.length === 0) {
        emptyState.style.display = 'block';
        container.innerHTML = '';
        container.appendChild(emptyState);
        emptyState.innerHTML = '<p>Keine Wünsche gefunden</p><p>Versuche einen anderen Suchbegriff oder Filter!</p>';
        return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    wishesToRender.forEach((wish) => {
        const originalIndex = wishes.findIndex(w => w.id === wish.id);
        const card = document.createElement('div');
        card.className = `wish-card ${isReadOnly ? 'read-only' : ''}`;
        
        const stars = '★'.repeat(wish.priority);
        const emptyStars = '☆'.repeat(10 - wish.priority);
        
        const groupGiftInfo = wish.isGroupGift && wish.groupGiftNames && wish.groupGiftNames.length > 0
            ? `<div class="group-gift-info">Gruppen-Geschenk von: ${wish.groupGiftNames.join(', ')}</div>`
            : '';
        
        const isDoNotWant = !!wish.doNotWant;
        const giftedInfo = isReadOnly && wish.giftedBy && wish.giftedBy.length > 0
            ? `<div class="gifted-info">Geschenkt von: ${wish.giftedBy.join(', ')}</div>`
            : '';
        
        const isGiftedByMe = isReadOnly && shareName && wish.giftedBy && wish.giftedBy.includes(shareName);
        const isGifted = isReadOnly && wish.giftedBy && wish.giftedBy.length > 0;
        
        const discountActive = isReadOnly && typeof wish.trackedPrice === 'number' && wish.trackedPrice < wish.price;
        const discountPercent = discountActive ? Math.round((1 - (wish.trackedPrice / wish.price)) * 100) : 0;
        const discountBadge = discountActive ? `<div class="discount-badge">-${discountPercent}%</div>` : '';
        card.innerHTML = `
            <div class="wish-category">${wish.category || 'Keine Kategorie'}</div>
            ${isDoNotWant ? '<div class="do-not-want-badge">Nicht gewünscht</div>' : ''}
            ${discountBadge}
            ${isGiftedByMe ? '<div class="gifted-badge">Von dir geschenkt</div>' : isGifted ? '<div class="gifted-badge">Bereits geschenkt</div>' : ''}
            <div class="wish-image">
                ${wish.image ? `<img src="${wish.image}" alt="${wish.name}" loading="lazy" decoding="async" onerror="this.src='https://source.unsplash.com/600x400/?gift'">` : `<img src="https://source.unsplash.com/600x400/?gift" alt="${wish.name}" loading="lazy" decoding="async">`}
            </div>
            <div class="wish-name">${wish.name}</div>
            <div class="wish-price">${wish.price.toFixed(2)} €</div>
            <div class="wish-priority">
                <span class="priority-label">Wunschstärke:</span>
                <div class="priority-stars" title="${wish.priority}/10">
                    ${stars}${emptyStars}
                </div>
            </div>
            ${groupGiftInfo}
            ${giftedInfo}
            ${!isReadOnly && !isDoNotWant ? `
                <div class="wish-actions">
                    <button class="btn-small btn-edit" onclick="editWish(${originalIndex})">Bearbeiten</button>
                    <button class="btn-small btn-delete" onclick="deleteWish(${originalIndex})">Löschen</button>
                </div>
            ` : isReadOnly && shareName && !isGifted && !isDoNotWant ? `
                <div class="wish-actions">
                    <button class="btn-small btn-primary" onclick="markAsGifted(${originalIndex})">Als Geschenk markieren</button>
                </div>
            ` : ''}
        `;
        
        container.appendChild(card);
    });
}

// Share Modal öffnen
function openShareModal() {
    if (!currentEventId) {
        showToast('Bitte wähle zuerst ein Ereignis aus!', 'error');
        return;
    }
    
    const modal = document.getElementById('shareModal');
    const shareLink = document.getElementById('shareLink');
    
    const shareId = Date.now().toString();
    const event = events.find(e => e.id === currentEventId);
    if (!event) {
        showToast('Fehler: Ereignis nicht gefunden!', 'error');
        return;
    }
    
    const shareData = {
        eventId: currentEventId,
        name: event.name,
        occasion: event.occasion,
        date: event.date,
        wishes: event.wishes || [],
        backgroundImage: event.backgroundImage || null
    };
    localStorage.setItem(`shared_${shareId}`, JSON.stringify(shareData));
    event.shareId = shareId;
    saveUserData();
    
    const currentUrl = window.location.origin + window.location.pathname;
    let dataParam = '';
    try {
        const base = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
        dataParam = `&data=${base}`;
    } catch {}
    const shareUrl = currentUrl + `?share=true&id=${shareId}${dataParam}`;
    shareLink.value = shareUrl;
    const qr = document.getElementById('shareQr');
    if (qr) {
        qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`;
        qr.alt = 'QR-Code zum Teilen';
    }
    
    modal.classList.add('show');
}

// Share Modal schließen
function closeShareModal() {
    closeModalById('shareModal');
}

// Link kopieren
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(shareLink.value).then(() => {
        const btn = document.getElementById('copyLinkBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Kopiert!';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
}

// PowerPoint generieren und downloaden
async function generateGammaPowerPoint() {
    if (typeof pptxgen === 'undefined') {
        showToast('PowerPoint-Bibliothek wird geladen...', 'info');
        setTimeout(() => generateGammaPowerPoint(), 1000);
        return;
    }
    
    try {
        showToast('PowerPoint wird erstellt...', 'info');
        
        const pptx = new pptxgen();
        const title = wishlistSettings ? wishlistSettings.name : 'Meine Wunschliste';
        const wishesToExport = wishes.length > 0 ? wishes : [];
        
        // Titel-Folie
        pptx.layout = 'LAYOUT_WIDE';
        let titleSlide = pptx.addSlide();
        titleSlide.background = { color: '000000' };
        titleSlide.addText(title, {
            x: 0.5,
            y: 2,
            w: 9,
            h: 1.5,
            fontSize: 48,
            bold: true,
            color: 'FFFFFF',
            align: 'center'
        });
        
        if (wishlistSettings && wishlistSettings.date) {
            const eventDate = new Date(wishlistSettings.date).toLocaleDateString('de-DE');
            titleSlide.addText(`Datum: ${eventDate}`, {
                x: 0.5,
                y: 3.5,
                w: 9,
                h: 0.5,
                fontSize: 24,
                color: 'CCCCCC',
                align: 'center'
            });
        }
        
        // Wünsche-Folien
        if (wishesToExport.length > 0) {
            wishesToExport.forEach((wish, index) => {
                let slide = pptx.addSlide();
                slide.background = { color: '000000' };
                
                // Wunsch-Name
                slide.addText(wish.name, {
                    x: 0.5,
                    y: 1,
                    w: 9,
                    h: 1,
                    fontSize: 36,
                    bold: true,
                    color: 'FFFFFF',
                    align: 'center'
                });
                
                // Preis
                slide.addText(`${wish.price.toFixed(2)} €`, {
                    x: 0.5,
                    y: 2.2,
                    w: 9,
                    h: 0.8,
                    fontSize: 32,
                    color: '4D9AFF',
                    align: 'center',
                    bold: true
                });
                
                // Kategorie
                if (wish.category) {
                    slide.addText(`Kategorie: ${wish.category}`, {
                        x: 0.5,
                        y: 3.2,
                        w: 9,
                        h: 0.5,
                        fontSize: 20,
                        color: 'CCCCCC',
                        align: 'center'
                    });
                }
                
                // Priorität
                slide.addText(`Wunschstärke: ${wish.priority}/10`, {
                    x: 0.5,
                    y: 3.8,
                    w: 9,
                    h: 0.5,
                    fontSize: 20,
                    color: 'CCCCCC',
                    align: 'center'
                });
                
                // Gruppen-Geschenk Info
                if (wish.isGroupGift && wish.groupGiftNames && wish.groupGiftNames.length > 0) {
                    slide.addText(`Gruppen-Geschenk von: ${wish.groupGiftNames.join(', ')}`, {
                        x: 0.5,
                        y: 4.5,
                        w: 9,
                        h: 0.5,
                        fontSize: 18,
                        color: '999999',
                        align: 'center'
                    });
                }
            });
        } else {
            // Leere Liste
            let slide = pptx.addSlide();
            slide.background = { color: '000000' };
            slide.addText('Noch keine Wünsche vorhanden', {
                x: 0.5,
                y: 2.5,
                w: 9,
                h: 1,
                fontSize: 32,
                color: 'CCCCCC',
                align: 'center'
            });
        }
        
        // PowerPoint herunterladen
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
        await pptx.writeFile({ fileName: fileName });
        
        showToast('PowerPoint erfolgreich erstellt und heruntergeladen!', 'success');
        closeModalById('shareModal');
    } catch (error) {
        console.error('Fehler beim Erstellen der PowerPoint:', error);
        showToast('Fehler beim Erstellen der PowerPoint: ' + error.message, 'error');
    }
}

// AI-Vorschläge generieren
async function generateAiSuggestions() {
    const prompt = document.getElementById('aiPrompt').value;
    const aiProvider = document.getElementById('aiProvider').value;
    
    if (!prompt.trim()) {
        showToast('Bitte gib einen Hinweis ein!', 'error');
        return;
    }
    
    showToast(`${aiProvider === 'openai' ? 'OpenAI' : aiProvider === 'claude' ? 'Claude' : aiProvider === 'gemini' ? 'Gemini' : 'Lokale KI'} generiert Vorschläge...`, 'info');
    
    // Simuliere unterschiedliche Vorschläge basierend auf Prompt und KI
    const suggestions = generateSmartSuggestions(prompt, aiProvider);
    
    const container = document.getElementById('aiSuggestions');
    container.innerHTML = `<h3>KI-Vorschläge (${aiProvider === 'openai' ? 'OpenAI GPT' : aiProvider === 'claude' ? 'Claude' : aiProvider === 'gemini' ? 'Google Gemini' : 'Lokale KI'}):</h3>`;
    
    if (suggestions.length === 0) {
        container.innerHTML += '<p>Keine Vorschläge gefunden. Versuche einen anderen Hinweis!</p>';
        return;
    }
    
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'ai-suggestion-item';
        const escapedName = suggestion.name.replace(/'/g, "\\'");
        div.innerHTML = `
            <div class="suggestion-name">${suggestion.name}</div>
            <div class="suggestion-details">${suggestion.price.toFixed(2)} € | ${suggestion.category} | Priorität: ${suggestion.priority}/10</div>
            <button class="btn btn-small btn-primary" onclick="addAiSuggestion('${escapedName}', ${suggestion.price}, '${suggestion.category}', ${suggestion.priority})">Hinzufügen</button>
        `;
        container.appendChild(div);
    });
    
    showToast('Vorschläge generiert!', 'success');
}

// Intelligente Vorschläge basierend auf Prompt generieren
function generateSmartSuggestions(prompt, aiProvider) {
    const lowerPrompt = prompt.toLowerCase();
    const suggestions = [];
    
    // Basis-Vorschläge für verschiedene Kategorien
    const suggestionPools = {
        gaming: [
            { name: 'Gaming-Headset mit 7.1 Surround', price: 89.99, category: 'Technik', priority: 9 },
            { name: 'Mechanische Gaming-Tastatur', price: 129.99, category: 'Technik', priority: 8 },
            { name: 'Gaming-Maus mit RGB-Beleuchtung', price: 69.99, category: 'Technik', priority: 7 },
            { name: 'Gaming-Stuhl ergonomisch', price: 249.99, category: 'Möbel', priority: 8 },
            { name: 'Gaming-Monitor 144Hz', price: 299.99, category: 'Technik', priority: 9 }
        ],
        technik: [
            { name: 'Smartwatch mit Fitness-Tracking', price: 199.99, category: 'Technik', priority: 8 },
            { name: 'Wireless Earbuds mit Noise Cancelling', price: 149.99, category: 'Technik', priority: 7 },
            { name: 'Tablet 10 Zoll', price: 349.99, category: 'Technik', priority: 8 },
            { name: 'Smart Home Hub', price: 79.99, category: 'Technik', priority: 6 },
            { name: 'Externe Festplatte 2TB', price: 89.99, category: 'Technik', priority: 7 }
        ],
        sport: [
            { name: 'Fitness-Tracker mit Herzfrequenz', price: 149.99, category: 'Sport', priority: 8 },
            { name: 'Yoga-Matte Premium', price: 39.99, category: 'Sport', priority: 6 },
            { name: 'Laufschuhe für Straße', price: 119.99, category: 'Sport', priority: 7 },
            { name: 'Dumbbells Set 2x10kg', price: 79.99, category: 'Sport', priority: 7 },
            { name: 'Fitness-Armband', price: 29.99, category: 'Sport', priority: 5 }
        ],
        bücher: [
            { name: 'Bestseller-Roman 2024', price: 19.99, category: 'Bücher', priority: 6 },
            { name: 'Fachbuch Programmierung', price: 49.99, category: 'Bücher', priority: 7 },
            { name: 'Kochbuch mit Rezepten', price: 24.99, category: 'Bücher', priority: 5 },
            { name: 'Fantasy-Romanreihe', price: 39.99, category: 'Bücher', priority: 7 },
            { name: 'Biografie eines Prominenten', price: 22.99, category: 'Bücher', priority: 6 }
        ],
        kleidung: [
            { name: 'Designer-Jacke', price: 199.99, category: 'Kleidung', priority: 7 },
            { name: 'Marken-Sneaker', price: 129.99, category: 'Kleidung', priority: 8 },
            { name: 'Premium-Hoodie', price: 79.99, category: 'Kleidung', priority: 6 },
            { name: 'Elegante Armbanduhr', price: 299.99, category: 'Schmuck', priority: 8 },
            { name: 'Designer-Tasche', price: 249.99, category: 'Kleidung', priority: 7 }
        ],
        erlebnisse: [
            { name: 'Spa-Gutschein', price: 99.99, category: 'Erlebnisse', priority: 8 },
            { name: 'Konzert-Tickets', price: 79.99, category: 'Erlebnisse', priority: 9 },
            { name: 'Kochkurs für 2 Personen', price: 149.99, category: 'Erlebnisse', priority: 7 },
            { name: 'Wellness-Wochenende', price: 299.99, category: 'Erlebnisse', priority: 8 },
            { name: 'Theater-Abonnement', price: 199.99, category: 'Erlebnisse', priority: 6 }
        ]
    };
    
    // Finde relevante Kategorien basierend auf Prompt
    const relevantCategories = [];
    if (lowerPrompt.includes('gaming') || lowerPrompt.includes('spiel')) relevantCategories.push('gaming');
    if (lowerPrompt.includes('technik') || lowerPrompt.includes('tech') || lowerPrompt.includes('elektronik')) relevantCategories.push('technik');
    if (lowerPrompt.includes('sport') || lowerPrompt.includes('fitness') || lowerPrompt.includes('training')) relevantCategories.push('sport');
    if (lowerPrompt.includes('buch') || lowerPrompt.includes('lesen') || lowerPrompt.includes('roman')) relevantCategories.push('bücher');
    if (lowerPrompt.includes('kleidung') || lowerPrompt.includes('mode') || lowerPrompt.includes('outfit')) relevantCategories.push('kleidung');
    if (lowerPrompt.includes('erlebnis') || lowerPrompt.includes('gutschein') || lowerPrompt.includes('ticket')) relevantCategories.push('erlebnisse');
    
    // Wenn keine spezifische Kategorie gefunden, verwende alle
    const categoriesToUse = relevantCategories.length > 0 ? relevantCategories : Object.keys(suggestionPools);
    
    // Wähle zufällige Vorschläge aus relevanten Kategorien
    const selectedSuggestions = new Set();
    const maxSuggestions = 5;
    
    // Unterschiedliche Logik je nach KI-Provider
    let selectionMethod = 'random';
    if (aiProvider === 'openai') {
        selectionMethod = 'diverse';
    } else if (aiProvider === 'claude') {
        selectionMethod = 'premium';
    } else if (aiProvider === 'gemini') {
        selectionMethod = 'balanced';
    }
    
    while (suggestions.length < maxSuggestions && selectedSuggestions.size < 20) {
        const category = categoriesToUse[Math.floor(Math.random() * categoriesToUse.length)];
        const pool = suggestionPools[category];
        const item = pool[Math.floor(Math.random() * pool.length)];
        const key = `${item.name}-${item.price}`;
        
        if (!selectedSuggestions.has(key)) {
            selectedSuggestions.add(key);
            
            // Variiere Preise und Prioritäten je nach KI
            let adjustedItem = { ...item };
            if (aiProvider === 'claude') {
                adjustedItem.price = item.price * (0.9 + Math.random() * 0.3); // Höhere Preise
                adjustedItem.priority = Math.min(10, item.priority + Math.floor(Math.random() * 2));
            } else if (aiProvider === 'gemini') {
                adjustedItem.price = item.price * (0.8 + Math.random() * 0.4); // Ausgewogen
            } else {
                adjustedItem.price = item.price * (0.7 + Math.random() * 0.5); // Variiert
            }
            
            suggestions.push(adjustedItem);
        }
    }
    
    // Sortiere nach Priorität (höchste zuerst)
    suggestions.sort((a, b) => b.priority - a.priority);
    
    return suggestions.slice(0, maxSuggestions);
}

// AI-Vorschlag hinzufügen
function addAiSuggestion(name, price, category, priority) {
    const wish = {
        id: Date.now(),
        name: name,
        price: price,
        priority: priority,
        category: category,
        image: 'https://via.placeholder.com/300x200?text=Kein+Bild',
        isGroupGift: false,
        groupGiftNames: [],
        addedBy: currentUser ? currentUser.name : 'KI',
        addedAt: new Date().toISOString()
    };
    
    wishes.push(wish);
    saveUserData();
    showToast('Vorschlag hinzugefügt!', 'success');
    applyFiltersAndSort();
    updateCategoryFilter();
}

// Statistiken anzeigen
function showStatistics() {
    const modal = document.getElementById('statsModal');
    modal.classList.add('show');
    
    if (wishes.length === 0) {
        const details = document.getElementById('statsDetails');
        details.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Noch keine Wünsche vorhanden. Füge Wünsche hinzu, um Statistiken zu sehen!</p>';
        return;
    }
    
    // Kategorien zählen
    const categoryCounts = {};
    wishes.forEach(wish => {
        const cat = wish.category || 'Keine Kategorie';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    // Sortiere nach Häufigkeit (absteigend)
    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const categoryLabels = sortedCategories.map(([cat]) => cat);
    const categoryValues = sortedCategories.map(([, count]) => count);
    
    // Chart erstellen
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Farben für Kategorien
    const colors = [
        '#4ecdc4', '#ff6b6b', '#45b7d1', '#f9ca24',
        '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8',
        '#00b894', '#e17055', '#0984e3', '#6c5ce7'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryValues,
                backgroundColor: colors.slice(0, categoryLabels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Details anzeigen
    const details = document.getElementById('statsDetails');
    let html = '<h3>Kategorie-Übersicht</h3>';
    html += '<div class="stats-list">';
    
    sortedCategories.forEach(([cat, count], index) => {
        const percentage = ((count / wishes.length) * 100).toFixed(1);
        const color = colors[index % colors.length];
        html += `
            <div class="stats-item">
                <div class="stats-item-color" style="background-color: ${color}"></div>
                <div class="stats-item-info">
                    <span class="stats-item-name">${cat}</span>
                    <span class="stats-item-count">${count} ${count === 1 ? 'Wunsch' : 'Wünsche'}</span>
                </div>
                <div class="stats-item-percentage">${percentage}%</div>
            </div>
        `;
    });
    
    html += '</div>';
    html += `<div class="stats-summary">
        <p><strong>Gesamt:</strong> ${wishes.length} ${wishes.length === 1 ? 'Wunsch' : 'Wünsche'}</p>
        <p><strong>Kategorien:</strong> ${categoryLabels.length}</p>
    </div>`;
    
    details.innerHTML = html;
}

// Export als Text
function exportAsText() {
    const wishesToExport = filteredWishes.length > 0 ? filteredWishes : wishes;
    const occasionName = wishlistSettings ? wishlistSettings.name : 'Wunschliste';
    let text = `${occasionName.toUpperCase()}\n\n`;
    text += `Erstellt am: ${new Date().toLocaleDateString('de-DE')}\n`;
    text += `Anzahl Wünsche: ${wishesToExport.length}\n`;
    text += `Gesamtpreis: ${wishesToExport.reduce((sum, w) => sum + w.price, 0).toFixed(2)} €\n\n`;
    text += '─'.repeat(50) + '\n\n';
    
    wishesToExport.forEach((wish, index) => {
        text += `${index + 1}. ${wish.name}\n`;
        text += `   Preis: ${wish.price.toFixed(2)} €\n`;
        text += `   Kategorie: ${wish.category || 'Keine'}\n`;
        text += `   Wunschstärke: ${wish.priority}/10 ${'★'.repeat(wish.priority)}\n`;
        if (wish.isGroupGift && wish.groupGiftNames && wish.groupGiftNames.length > 0) {
            text += `   Gruppen-Geschenk von: ${wish.groupGiftNames.join(', ')}\n`;
        }
        text += '\n';
    });
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wunschliste_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Wunschliste als Text exportiert!', 'success');
    closeModalById('exportModal');
}

// Export als JSON
function exportAsJson() {
    const wishesToExport = filteredWishes.length > 0 ? filteredWishes : wishes;
    const data = {
        exportDate: new Date().toISOString(),
        settings: wishlistSettings,
        totalWishes: wishesToExport.length,
        totalPrice: wishesToExport.reduce((sum, w) => sum + w.price, 0),
        wishes: wishesToExport
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wunschliste_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Wunschliste als JSON exportiert!', 'success');
    closeModalById('exportModal');
}

// Drucken
function printWishlist() {
    const printWindow = window.open('', '_blank');
    const wishesToPrint = filteredWishes.length > 0 ? filteredWishes : wishes;
    const occasionName = wishlistSettings ? wishlistSettings.name : 'Wunschliste';
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${occasionName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .wish-item { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .wish-name { font-size: 1.2em; font-weight: bold; margin-bottom: 5px; }
                .wish-price { color: #ff6b6b; font-size: 1.1em; margin-bottom: 5px; }
                .wish-priority { color: #666; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <h1>${occasionName}</h1>
            <p><strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
            <p><strong>Anzahl Wünsche:</strong> ${wishesToPrint.length}</p>
            <p><strong>Gesamtpreis:</strong> ${wishesToPrint.reduce((sum, w) => sum + w.price, 0).toFixed(2)} €</p>
            <hr>
    `;
    
    wishesToPrint.forEach((wish, index) => {
        html += `
            <div class="wish-item">
                <div class="wish-name">${index + 1}. ${wish.name}</div>
                <div class="wish-price">Preis: ${wish.price.toFixed(2)} €</div>
                <div>Kategorie: ${wish.category || 'Keine'}</div>
                <div class="wish-priority">Wunschstärke: ${wish.priority}/10 ${'★'.repeat(wish.priority)}</div>
            </div>
        `;
    });
    
    html += '</body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
    
    showToast('Druckvorschau geöffnet!', 'info');
}

// Export Modal öffnen
function openExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.add('show');
}

// Export Modal schließen
function closeExportModal() {
    closeModalById('exportModal');
}

// AI Modal öffnen
function openAiModal() {
    const modal = document.getElementById('aiModal');
    modal.classList.add('show');
    document.getElementById('aiSuggestions').innerHTML = '';
}

// AI Modal schließen
function closeAiModal() {
    closeModalById('aiModal');
}

// Bildvorschau anzeigen
function showImagePreview(file) {
    const preview = document.getElementById('imagePreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Vorschau" loading="lazy" decoding="async">`;
            preview.classList.add('show');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.remove('show');
        preview.innerHTML = '';
    }
}

function isProActive() { return localStorage.getItem('isPro') === 'true'; }
function applyGlobalTheme(theme) {
    const root = document.documentElement;
    ['default','christmas','birthday','easter','valentine','anniversary','other'].forEach(n => root.classList.remove('theme-' + n));
    if (theme) root.classList.add('theme-' + theme);
    const snow = document.getElementById('snowContainer');
    if (snow) snow.style.display = theme === 'christmas' ? 'block' : 'none';
    updateNavEmojis(theme);
}

function updateNavEmojis(theme) {
    const map = [
        ['menuMyBtn','Meine Wunschliste','🎁 '],
        ['menuOtherBtn','Andere Wunschlisten','🎄 '],
        ['menuSettingsBtn','Einstellungen','⚙️ '],
        ['menuProBtn','Pro','🌟 '],
        ['menuInfoBtn','Informationen','❄️ '],
        ['topHomeBtn','Start','🏠 '],
        ['navMyBtn0','Meine Wunschliste','🎁 '],['navMyBtn','Meine Wunschliste','🎁 '],['navMyBtn2','Meine Wunschliste','🎁 '],['navMyBtn3','Meine Wunschliste','🎁 '],['navMyBtn4','Meine Wunschliste','🎁 '],
        ['navOtherBtn0','Andere Wunschlisten','🎄 '],['navOtherBtn','Andere Wunschlisten','🎄 '],['navOtherBtn2','Andere Wunschlisten','🎄 '],['navOtherBtn3','Andere Wunschlisten','🎄 '],['navOtherBtn4','Andere Wunschlisten','🎄 '],
        ['navSettingsBtn0','Einstellungen','⚙️ '],['navSettingsBtn','Einstellungen','⚙️ '],['navSettingsBtn2','Einstellungen','⚙️ '],['navSettingsBtn3','Einstellungen','⚙️ '],['navSettingsBtn4','Einstellungen','⚙️ '],
        ['navProBtn0','Pro','🌟 '],['navProBtn','Pro','🌟 '],['navProBtn2','Pro','🌟 '],['navProBtn3','Pro','🌟 '],['navProBtn4','Pro','🌟 '],
        ['navInfoBtn0','Informationen','❄️ '],['navInfoBtn','Informationen','❄️ '],['navInfoBtn2','Informationen','❄️ '],['navInfoBtn3','Informationen','❄️ '],['navInfoBtn4','Informationen','❄️ ']
    ];
    map.forEach(([id, base, emoji]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = (theme === 'christmas') ? (emoji + base) : base;
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Auth Forms
    document.getElementById('loginFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        document.getElementById('loginError').textContent = '';
        document.getElementById('loginEmail').classList.remove('input-error');
        document.getElementById('loginPassword').classList.remove('input-error');
        const ok = login(email, password);
        if (!ok) {
            document.getElementById('loginError').textContent = 'Email oder Passwort ist falsch';
            document.getElementById('loginEmail').classList.add('input-error');
            document.getElementById('loginPassword').classList.add('input-error');
        }
    });
    
    document.getElementById('registerFormElement').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;
        const birthday = document.getElementById('registerBirthday').value;
        const emailNotifications = document.getElementById('registerEmailNotifications').checked;
        
        if (register(email, password, name, birthday, emailNotifications)) {
            login(email, password);
        }
    });
    
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });
    
    // Logout
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => btn.addEventListener('click', logout));
    
    // Share Name Form
    document.getElementById('shareNameForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('shareNameInput').value.trim();
        if (name) {
            const urlParams = new URLSearchParams(window.location.search);
            const shareId = urlParams.get('id');
            if (shareId) {
                shareName = name;
                localStorage.setItem(`shareName_${shareId}`, name);
                closeModalById('shareNameModal');
                showSharedWishlist(shareId);
            }
        }
    });
    
    // Events Navigation
    document.getElementById('createEventBtn')?.addEventListener('click', () => {
        const backdrop = document.getElementById('sidebarBackdrop');
        document.querySelectorAll('.right-sidebar.open').forEach(a => a.classList.remove('open'));
        if (backdrop) backdrop.classList.remove('show');
        createNewEvent();
    });
    const eventsOverview = document.getElementById('eventsOverviewScreen');
    if (eventsOverview) {
        eventsOverview.addEventListener('click', (e) => {
            const target = e.target;
            if (target && (target.id === 'createEventBtn' || (target.closest && target.closest('#createEventBtn')))) {
                e.preventDefault();
                const backdrop = document.getElementById('sidebarBackdrop');
                document.querySelectorAll('.right-sidebar.open').forEach(a => a.classList.remove('open'));
                if (backdrop) backdrop.classList.remove('show');
                createNewEvent();
            }
        });
    }
    document.getElementById('backToEventsBtn')?.addEventListener('click', () => {
        saveUserData();
        showMainMenu();
    });
    
    // Wunschzettel-Einstellungen
    document.getElementById('wishlistSettingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveWishlistSettings();
    });
    
    // Hintergrundbild-Upload
    const backgroundFileInput = document.getElementById('wishlistBackgroundFile');
    if (backgroundFileInput) {
        backgroundFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await fileToBase64(file);
                    const preview = document.getElementById('backgroundPreview');
                    if (preview) {
                        preview.innerHTML = `<img src="${base64}" alt="Hintergrund-Vorschau" loading="lazy" decoding="async">`;
                        preview.classList.add('show');
                    }
                    // Setze auch das URL-Feld zurück
                    const urlInput = document.getElementById('wishlistBackground');
                    if (urlInput) urlInput.value = '';
                } catch (error) {
                    showToast('Fehler beim Laden des Bildes: ' + error.message, 'error');
                }
            }
        });
    }
    
    // URL-Input für Hintergrundbild
    const backgroundUrlInput = document.getElementById('wishlistBackground');
    if (backgroundUrlInput) {
        backgroundUrlInput.addEventListener('input', (e) => {
            const url = e.target.value;
            const preview = document.getElementById('backgroundPreview');
            if (url && url.startsWith('http')) {
                if (preview) {
                    preview.innerHTML = `<img src="${url}" alt="Hintergrund-Vorschau" loading="lazy" decoding="async" onerror="this.parentElement.classList.remove('show'); this.parentElement.innerHTML=''; document.getElementById('wishlistBackground').value='';">`;
                    preview.classList.add('show');
                }
                // Setze auch das File-Input zurück
                if (backgroundFileInput) backgroundFileInput.value = '';
            } else if (!url && preview) {
                preview.classList.remove('show');
                preview.innerHTML = '';
            }
        });
    }
    
    // Modal Buttons
    document.getElementById('addWishBtn').addEventListener('click', openModal);
    document.getElementById('settingsBtn').addEventListener('click', openWishlistSettings);
    document.getElementById('shareBtn').addEventListener('click', openShareModal);
    document.getElementById('exportBtn').addEventListener('click', openExportModal);
    document.getElementById('aiSuggestBtn').addEventListener('click', openAiModal);
    document.getElementById('wheelBtn').addEventListener('click', openWheelModal);
    document.getElementById('shareWheelBtn')?.addEventListener('click', openWheelModalAll);
    document.getElementById('statsBtn').addEventListener('click', showStatistics);
    document.getElementById('menuMyBtn').addEventListener('click', showEventsOverview);
    document.getElementById('menuOtherBtn').addEventListener('click', showOtherWishlists);
    document.getElementById('menuSettingsBtn').addEventListener('click', showAccountSettings);
    document.getElementById('menuProBtn').addEventListener('click', showProScreen);
    document.getElementById('menuInfoBtn').addEventListener('click', showInfoScreen);
    document.getElementById('topHomeBtn').addEventListener('click', showMainMenu);
    document.getElementById('topMenuBtn')?.addEventListener('click', () => {
        const backdrop = document.getElementById('sidebarBackdrop');
        // finde die sichtbare Seitenleiste des aktiven Screens
        const screens = ['eventsOverviewScreen','eventDetailScreen','otherWishlistsScreen','accountSettingsScreen','proScreen','infoScreen'];
        let opened = false;
        for (const id of screens) {
            const sc = document.getElementById(id);
            if (sc && sc.style.display !== 'none') {
                const aside = sc.querySelector('.right-sidebar');
                if (aside) {
                    aside.classList.add('open');
                    if (backdrop) backdrop.classList.add('show');
                    opened = true;
                }
                break;
            }
        }
        // falls im Event-Detail eine rechte Leiste existiert (künftig), ebenfalls öffnen
        if (!opened) {
            const evAside = document.querySelector('#eventDetailScreen .right-sidebar');
            if (evAside) {
                evAside.classList.add('open');
                if (backdrop) backdrop.classList.add('show');
            }
        }
    });
    ['navMyBtn0','navMyBtn','navMyBtn2','navMyBtn3','navMyBtn4'].forEach(id => document.getElementById(id)?.addEventListener('click', showEventsOverview));
    ['navOtherBtn0','navOtherBtn','navOtherBtn2','navOtherBtn3','navOtherBtn4'].forEach(id => document.getElementById(id)?.addEventListener('click', showOtherWishlists));
    ['navSettingsBtn0','navSettingsBtn','navSettingsBtn2','navSettingsBtn3','navSettingsBtn4'].forEach(id => document.getElementById(id)?.addEventListener('click', showAccountSettings));
    ['navProBtn0','navProBtn','navProBtn2','navProBtn3','navProBtn4'].forEach(id => document.getElementById(id)?.addEventListener('click', showProScreen));
    ['navInfoBtn0','navInfoBtn','navInfoBtn2','navInfoBtn3','navInfoBtn4'].forEach(id => document.getElementById(id)?.addEventListener('click', showInfoScreen));
    
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('closeShareModal').addEventListener('click', closeShareModal);
    document.getElementById('closeExportModal').addEventListener('click', closeExportModal);
    document.getElementById('closeAiModal').addEventListener('click', closeAiModal);
    document.getElementById('closeStatsModal').addEventListener('click', () => closeModalById('statsModal'));
    document.getElementById('closeWheelModal').addEventListener('click', () => closeModalById('wheelModal'));
    document.getElementById('closeSettingsModal').addEventListener('click', () => closeModalById('wishlistSettingsModal'));
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('cancelSettingsBtn').addEventListener('click', () => closeModalById('wishlistSettingsModal'));
    
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);
    document.getElementById('generateGammaBtn').addEventListener('click', generateGammaPowerPoint);
    document.getElementById('generatePowerPoint').addEventListener('change', (e) => {
        document.getElementById('generateGammaBtn').style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Export Buttons
    document.getElementById('exportTextBtn').addEventListener('click', exportAsText);
    document.getElementById('exportJsonBtn').addEventListener('click', exportAsJson);
    document.getElementById('printBtn').addEventListener('click', printWishlist);
    
    // AI
    document.getElementById('generateAiSuggestionsBtn').addEventListener('click', generateAiSuggestions);
    document.getElementById('spinWheelBtn').addEventListener('click', spinWheel);
    document.getElementById('wheelConfirmYes').addEventListener('click', () => {
        const box = document.getElementById('wheelConfirm');
        if (!selectedWheelItem) return;
        if (isReadOnly && typeof markAsGifted === 'function' && selectedWheelItem.index >= 0) {
            markAsGifted(selectedWheelItem.index);
        } else {
            const i = wishes.findIndex(w => w.id === selectedWheelItem.id);
            if (i >= 0) {
                if (!Array.isArray(wishes[i].giftedBy)) wishes[i].giftedBy = [];
                const who = currentUser?.name || currentUser?.email || 'Ich';
                if (!wishes[i].giftedBy.includes(who)) wishes[i].giftedBy.push(who);
                renderWishes();
                saveUserData();
                showToast(`Du schenkst: ${selectedWheelItem.name}`, 'success');
            }
        }
        if (box) box.style.display = 'none';
    });
    document.getElementById('wheelConfirmNo').addEventListener('click', () => {
        const box = document.getElementById('wheelConfirm');
        if (box) box.style.display = 'none';
        selectedWheelItem = null;
    });
    
    // Form Submit
    document.getElementById('wishForm').addEventListener('submit', handleWishSubmit);
    document.getElementById('accountSettingsForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEmail = document.getElementById('accountEmail').value.trim().toLowerCase();
        const newPassword = document.getElementById('accountPassword').value.trim();
        const newName = document.getElementById('accountName').value.trim();
        const newBirthday = document.getElementById('accountBirthday').value;
        const notifications = document.getElementById('accountEmailNotifications').checked;
        const defaultOccasion = document.getElementById('accountDefaultOccasion').value;
        if (!currentUser) return;
        const oldKey = `user_${currentUser.email}`;
        const data = localStorage.getItem(oldKey);
        if (data) {
            const obj = JSON.parse(data);
            obj.user.email = newEmail;
            if (newName) obj.user.name = newName;
            if (newBirthday) obj.user.birthday = newBirthday;
            obj.user.notifications = !!notifications;
            obj.user.defaultOccasion = defaultOccasion;
            if (newPassword) obj.user.password = newPassword;
            localStorage.setItem(`user_${newEmail}`, JSON.stringify(obj));
            if (newEmail !== currentUser.email) localStorage.removeItem(oldKey);
            currentUser = { ...currentUser, email: newEmail, name: newName || currentUser.name };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showToast('Account aktualisiert', 'success');
            if (wishlistSettings) { wishlistSettings.occasion = defaultOccasion; updateBackgroundImage(); }
        }
    });
    document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteAccount);
    document.getElementById('proCodeForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('proCode').value.trim();
        if (code === 'pro25') {
            localStorage.setItem('isPro', 'true');
            showToast('Pro aktiviert', 'success');
            renderProTable();
            renderProProjectTable();
            sessionStorage.setItem('activeTheme', 'christmas');
            applyGlobalTheme('christmas');
            updateBackgroundImage();
        } else {
            showToast('Code falsch', 'error');
        }
    });
    
    // Priorität Slider
    document.getElementById('wishPriority').addEventListener('input', (e) => {
        document.getElementById('priorityValue').textContent = e.target.value;
    });
    
    // Gruppen-Geschenk Checkbox
    document.getElementById('wishGroupGift').addEventListener('change', (e) => {
        document.getElementById('groupGiftDetails').style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Bildvorschau
    document.getElementById('wishImageFile').addEventListener('change', (e) => {
        showImagePreview(e.target.files[0]);
    });
    // Direkte Preis-Erkennung
    setupPriceDetectListeners();
    
    document.getElementById('wishImage').addEventListener('input', (e) => {
        if (e.target.value && !document.getElementById('wishImageFile').files[0]) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.value}" alt="Vorschau" loading="lazy" decoding="async" onerror="this.parentElement.classList.remove('show')">`;
            preview.classList.add('show');
        } else if (!e.target.value && !document.getElementById('wishImageFile').files[0]) {
            document.getElementById('imagePreview').classList.remove('show');
            document.getElementById('imagePreview').innerHTML = '';
        }
    });
    
    // Suche
    document.getElementById('searchInput').addEventListener('input', applyFiltersAndSort);
    
    // Sortierung
    document.getElementById('sortSelect').addEventListener('change', applyFiltersAndSort);
    
    // Kategorie-Filter
    document.getElementById('categoryFilter').addEventListener('change', applyFiltersAndSort);
    
    // Modal schließen bei Klick außerhalb
    window.addEventListener('click', (e) => {
        const modals = ['wishModal', 'shareModal', 'exportModal', 'aiModal', 'statsModal', 'wishlistSettingsModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (e.target === modal) {
                closeModalById(modalId);
            }
        });
    });
    
    // ESC-Taste zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = ['wishModal', 'shareModal', 'exportModal', 'aiModal', 'statsModal', 'wishlistSettingsModal'];
            modals.forEach(modalId => {
                closeModalById(modalId);
            });
        }
    });
    // Scroll-to-Top Button
    const topBtn = document.getElementById('scrollTopBtn');
    if (topBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) topBtn.classList.add('show'); else topBtn.classList.remove('show');
        });
        topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.sidebar-toggle');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (btn) {
            const aside = btn.closest('.right-sidebar');
            if (aside) {
                const open = aside.classList.toggle('open');
                if (backdrop) backdrop.classList.toggle('show', open);
            }
        }
        if (backdrop && e.target === backdrop) {
            document.querySelectorAll('.right-sidebar.open').forEach(a => a.classList.remove('open'));
            backdrop.classList.remove('show');
        }
    });
    try { const t = sessionStorage.getItem('activeTheme'); if (t) applyGlobalTheme(t); } catch {}
    // Kontaktformular
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const msg = document.getElementById('contactMessage').value.trim();
            const statusEl = document.getElementById('contactStatus');
            statusEl.textContent = '';
            if (!name || !email || !msg) { statusEl.textContent = 'Bitte alle Felder ausfüllen.'; return; }
            const subject = `Kontaktanfrage von ${name}`;
            const safeMsg = msg.replace(/</g,'&lt;');
            const html = `<p><strong>Von:</strong> ${name} (${email})</p><p>${safeMsg}</p>`;
            const text = `Von: ${name} (${email})\n\n${msg}`;
            const ok = await sendEmail({ to: 'antonmunzig@gmail.com', subject, html, text, replyTo: email });
            showToast(ok ? 'Nachricht gesendet' : 'Versand fehlgeschlagen', ok ? 'success' : 'error');
            if (ok) contactForm.reset();
        });
    }

    // API‑Key Anzeige
    const display = document.getElementById('apiKeyDisplay');
    const copyBtn = document.getElementById('copyApiKeyBtn');
    const pubKey = localStorage.getItem('publicApiKey') || 'Hiii';
    if (display) display.textContent = pubKey.replace(/.(?=.{3})/g, '•');
    copyBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(pubKey).then(() => showToast('API‑Key kopiert', 'success')).catch(() => showToast('Kopieren fehlgeschlagen', 'error'));
    });
}
async function fetchPriceFromUrl(url) {
    let html = null;
    let res = await fetch(url).catch(() => null);
    if (res && res.ok) {
        html = await res.text();
    }
    if (!html) {
        const clean = url.replace(/^https?:\/\//, '');
        const proxyUrl = `https://r.jina.ai/http://${clean}`;
        res = await fetch(proxyUrl).catch(() => null);
        if (!res || !res.ok) throw new Error('Preis konnte nicht geladen werden');
        html = await res.text();
    }
    // Einfache Extraktion: €-Preis oder Meta/JSON-Anhaltspunkte
    const euroMatch = html.match(/(?:€|EUR)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i);
    if (euroMatch) {
        let num = euroMatch[1].replace(/\./g, '').replace(',', '.');
        return parseFloat(num);
    }
    const jsonPriceMatch = html.match(/\"price\"\s*:\s*\"?([0-9]+(?:\.[0-9]{2})?)\"?/i);
    if (jsonPriceMatch) return parseFloat(jsonPriceMatch[1]);
    throw new Error('Kein Preis gefunden');
}

let priceDetectTimer = null;
function setupPriceDetectListeners() {
    const urlInput = document.getElementById('wishProductUrl');
    const priceInput = document.getElementById('wishPrice');
    const info = document.getElementById('detectedPriceInfo');
    if (!urlInput || !priceInput || !info) return;
    const tryDetect = async () => {
        const url = urlInput.value.trim();
        if (!url) { priceInput.readOnly = false; info.textContent = ''; return; }
        info.textContent = 'Preis wird erkannt…';
        priceInput.readOnly = true;
        try {
            const p = await fetchPriceFromUrl(url);
            if (isFinite(p)) {
                priceInput.value = p.toFixed(2);
                info.textContent = `Preis erkannt: ${p.toFixed(2)} €`;
            } else {
                throw new Error('Unerwarteter Preis');
            }
        } catch {
            priceInput.readOnly = false;
            info.textContent = 'Preis nicht erkannt – bitte manuell eintragen';
        }
    };
    urlInput.addEventListener('input', () => {
        clearTimeout(priceDetectTimer);
        priceDetectTimer = setTimeout(tryDetect, 500);
    });
    urlInput.addEventListener('blur', tryDetect);
}

async function checkPriceForWish(wish) {
    if (!wish.priceUrl) return; 
    try {
        const p = await fetchPriceFromUrl(wish.priceUrl);
        wish.trackedPrice = p;
        wish.lastPriceCheck = new Date().toISOString();
        if (typeof wish.price === 'number' && p < wish.price) {
            wish.discountPercent = Math.round((1 - (p / wish.price)) * 100);
        } else {
            wish.discountPercent = 0;
        }
        // Frage den Inhaber bei starkem Rabatt
        if (!isReadOnly && wish.discountPercent >= 10) {
            const take = confirm(`Für "${wish.name}" gibt es evtl. günstiger (${p.toFixed(2)} €). Möchtest du den Preis anpassen?`);
            if (take) {
                wish.price = p;
            }
        }
    } catch (err) {
        // CORS/Fehler: stiller Fallback
    }
}

async function checkAllPrices() {
    for (let i = 0; i < wishes.length; i++) {
        const w = wishes[i];
        if (w.priceUrl) {
            await checkPriceForWish(w);
        }
    }
    // Preise in Event und geteilten Daten persistieren
    const evIdx = events.findIndex(e => e.id === currentEventId);
    if (evIdx >= 0) {
        events[evIdx].wishes = wishes;
        saveUserData();
        updateSharedPricesForCurrentEvent();
        renderWishes();
    }
}

function scheduleDailyPriceCheck() {
    try {
        const now = new Date();
        const next = new Date(now);
        next.setHours(24,0,0,0); // nächster Mitternacht
        const ms = next - now;
        setTimeout(() => {
            checkAllPrices();
            setInterval(checkAllPrices, 24 * 60 * 60 * 1000);
        }, Math.max(1000, ms));
    } catch {}
}

function updateSharedPricesForCurrentEvent() {
    const ev = events.find(e => e.id === currentEventId);
    if (!ev || !ev.shareId) return;
    const sharedData = localStorage.getItem(`shared_${ev.shareId}`);
    const payload = {
        eventId: ev.id,
        name: ev.name,
        occasion: ev.occasion,
        date: ev.date,
        wishes: ev.wishes,
        backgroundImage: ev.backgroundImage || null
    };
    localStorage.setItem(`shared_${ev.shareId}`, JSON.stringify(sharedData ? { ...JSON.parse(sharedData), ...payload } : payload));
}

function initCookieBanner() {
    const cookieBanner = document.getElementById('cookieBanner');
    const openCookieSettings = document.getElementById('openCookieSettings');
    const acceptCookiesBtn = document.getElementById('acceptCookiesBtn');
    const rejectCookiesBtn = document.getElementById('rejectCookiesBtn');
    const footerCookieLink = document.getElementById('footerCookieLink');
    const closeCookieSettingsModal = document.getElementById('closeCookieSettingsModal');
    const cookieSettingsModal = document.getElementById('cookieSettingsModal');
    const saveCookieSettingsBtn = document.getElementById('saveCookieSettingsBtn');
    const cancelCookieSettings = document.getElementById('cancelCookieSettings');
    const analyticsBox = document.getElementById('cookieAnalytics');
    const marketingBox = document.getElementById('cookieMarketing');
    if (!cookieBanner) return;
    function openCookieModal() { cookieSettingsModal.classList.add('show'); }
    function closeCookieModal() { cookieSettingsModal.classList.remove('show'); }
    function getConsent() { try { return JSON.parse(localStorage.getItem('antons_cookies_consent') || 'null'); } catch { return null; } }
    function setConsent(c) { localStorage.setItem('antons_cookies_consent', JSON.stringify(c)); cookieBanner.classList.remove('show'); }
    const existingConsent = getConsent();
    if (!existingConsent) cookieBanner.classList.add('show');
    if (existingConsent) {
        if (analyticsBox) analyticsBox.checked = !!existingConsent.analytics;
        if (marketingBox) marketingBox.checked = !!existingConsent.marketing;
    }
    if (openCookieSettings) openCookieSettings.addEventListener('click', openCookieModal);
    if (acceptCookiesBtn) acceptCookiesBtn.addEventListener('click', () => setConsent({ necessary: true, analytics: true, marketing: true, ts: Date.now() }));
    if (rejectCookiesBtn) rejectCookiesBtn.addEventListener('click', () => setConsent({ necessary: true, analytics: false, marketing: false, ts: Date.now() }));
    if (footerCookieLink) footerCookieLink.addEventListener('click', openCookieModal);
    if (closeCookieSettingsModal) closeCookieSettingsModal.addEventListener('click', closeCookieModal);
    if (cancelCookieSettings) cancelCookieSettings.addEventListener('click', closeCookieModal);
    if (saveCookieSettingsBtn) saveCookieSettingsBtn.addEventListener('click', () => {
        const analytics = analyticsBox && analyticsBox.checked;
        const marketing = marketingBox && marketingBox.checked;
        setConsent({ necessary: true, analytics, marketing, ts: Date.now() });
        closeCookieModal();
    });
}

// Konto vollständig löschen
function deleteAccount() {
    if (!currentUser) return;
    const ok = confirm('Willst du dein Konto und alle Daten wirklich löschen? Dies kann nicht rückgängig gemacht werden.');
    if (!ok) return;
    try {
        const emailKey = `user_${currentUser.email}`;
        const userDataStr = localStorage.getItem(emailKey);
        if (userDataStr) {
            const data = JSON.parse(userDataStr);
            const evs = Array.isArray(data.events) ? data.events : [];
            evs.forEach(ev => { if (ev.shareId) localStorage.removeItem(`shared_${ev.shareId}`); });
        }
        localStorage.removeItem(emailKey);
        localStorage.removeItem('currentUser');
        localStorage.clear();
    } catch {}
    currentUser = null;
    events = [];
    wishes = [];
    currentEventId = null;
    wishlistSettings = null;
    showAuth();
    showToast('Konto gelöscht', 'success');
}
function setCanonicalLink() {
    const el = document.querySelector('link[rel="canonical"]');
    const base = localStorage.getItem('appBaseUrl') || 'https://wunschzettel-a.netlify.app/';
    if (el) el.href = base;
}
