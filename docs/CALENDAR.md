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

## Lecture des réservations

`calendar-vanilla.js` essaie dans l'ordre :

1. **API Google Calendar v3 en direct** (`API_KEY` en haut du fichier) : un événement
   ajouté dans l'agenda apparaît immédiatement sur le site. Seuls id et dates sont demandés
   (`fields=items(id,start,end,transparency)`), les titres ne sont jamais envoyés.
2. **`calendar-data.json`**, régénéré chaque heure par `.github/workflows/update-calendar.yml`
   depuis le flux iCal public (titres remplacés par « Réservé » : `node tests/check-scripts.js`
   échoue sinon).
3. Flux iCal via proxy CORS (dev local), puis cache `localStorage`.

**Confidentialité :** partager l'agenda en « Voir uniquement les infos de disponibilité
(masquer les détails) » pour que ni l'API ni le flux iCal public n'exposent les noms des clients.

### Clé API

La clé est visible dans la page (site statique, comme Esenca Sport). GitHub la signale
dans « Secret scanning » : fermer l'alerte en « Won't fix » **après** avoir vérifié la
restriction. Dans Google Cloud Console > APIs & Services > Identifiants :

- Restriction d'application : **Référents HTTP** → `campingduwignet.com/*`, `www.campingduwignet.com/*`
- Restriction d'API : **Google Calendar API** uniquement

Sans clé (`API_KEY = ''`) ou si l'API échoue, le site retombe sur `calendar-data.json`.

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
