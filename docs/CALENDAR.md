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

## API Google Calendar

```javascript
const API_KEY = 'AIzaSyDw53DSWL1Bl8vF3CbJnUgPnFY6m_l_bT4'
const CALENDAR_ID = 'cc45e8e77ac2e7ac5cf1cac59e7b82a76f44919cba92ed2bdb3ea2f9b9398833@group.calendar.google.com'
```

**loadGoogleCalendarEvents()** :
- Timeout 5 secondes
- Fallback données démo si erreur
- Parse événements → dates réservées

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

1. Calendrier se charge → API récupère dates réservées
2. Sélection check-in → jours disponibles affichés
3. Sélection check-out → prix calculé
4. Formulaire (nom, email, téléphone, personnes)
5. Soumission (pas de backend actuellement)

## Fonctions principales

- `loadGoogleCalendarEvents()` - Charge réservations
- `calculatePrice()` - Calcul dynamique prix
- `renderCalendar()` - Génère grille calendrier
- `validateForm()` - Validation champs
