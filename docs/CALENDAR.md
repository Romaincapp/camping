# Système de réservation (calendar-vanilla.js)

## État global

```javascript
const calendarState = {
    currentDate: new Date(),
    selectedStartDate: null,
    selectedEndDate: null,
    bookedDates: [],
    isHighSeason: boolean,
    totalPrice: 0,
    discount: 0
}
```

## Flux iCal Google Calendar

Le calendrier utilise le flux iCal public de Google Calendar (pas d'API key).

```javascript
// ID du calendrier (doit être public)
const CALENDAR_ID = 'romainfrancedumoulin@gmail.com';

// URL du flux iCal
const icalUrl = `https://calendar.google.com/calendar/ical/${CALENDAR_ID}/public/basic.ics`;

// Proxy CORS pour contourner les restrictions navigateur
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(icalUrl)}`;
```

**fetchGoogleCalendarEvents()** :
- Récupère le flux iCal via proxy CORS
- Parse le format iCal (VEVENT, DTSTART, DTEND)
- Timeout 5 secondes
- Fallback données démo si erreur

## Règles métier

- Check-in : 14:00
- Check-out : 12:00
- Séjour min : 1 nuit
- Capacité max : 20 personnes
- Réservations jusqu'à 12 mois

## Calcul des prix

**Saisons :**
```javascript
// Haute saison : 1er avril au 1er novembre
const HIGH_SEASON = { start: '04-01', end: '11-01' }
const PRICES = {
    highSeason: { adult: 19, child: 13 },
    lowSeason: { firstAdult: 19, additional: 10 }
}
```

**Réductions :**
```javascript
function calculateDiscount(nights, guests) {
    let discount = 0
    if (nights >= 4) discount += 0.10      // 10%
    else if (nights >= 2) discount += 0.05  // 5%
    if (guests >= 6) discount += 0.05       // 5% groupe
    return Math.min(discount, 0.40)         // Max 40%
}
```

## Flow utilisateur

1. Calendrier se charge → iCal récupère dates réservées
2. Sélection check-in → jours disponibles affichés
3. Sélection check-out → prix calculé
4. Formulaire (nom, email, téléphone, personnes)
5. Soumission via FormSpree

## Fonctions principales

- `fetchGoogleCalendarEvents()` - Charge réservations (iCal)
- `parseICalEvents()` - Parse le format iCal
- `parseICalDate()` - Convertit dates iCal → Date JS
- `calculatePrice()` - Calcul dynamique prix
- `renderCalendar()` - Génère grille calendrier
- `validateForm()` - Validation champs
