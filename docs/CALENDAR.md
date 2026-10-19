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

## Mise à jour du site (calendar-data.json)

Le site ne lit pas Google Agenda directement : il charge `calendar-data.json`, généré par
`.github/workflows/update-calendar.yml` à partir du flux iCal public.

- **Toutes les heures** (cron), en filet de sécurité.
- **Instantané (~1-2 min)** : le script Google Apps Script `docs/apps-script-calendrier.gs`
  lance le workflow à chaque modification de l'agenda.
- **Confidentialité** : les titres des événements (noms des clients) ne sont jamais publiés,
  chaque réservation devient « Réservé ». `node tests/check-scripts.js` échoue sinon.
  Dans Google Agenda, partager l'agenda en « Voir uniquement les infos de disponibilité »
  pour que le flux iCal public ne montre pas non plus les noms.

### Mise à jour instantanée : installation (une fois)

1. **Jeton GitHub** : github.com > Settings > Developer settings > Fine-grained tokens > Generate.
   Repository access : uniquement `romaincapp/camping`. Permissions : **Actions : Read and write**
   (rien d'autre). Choisir une expiration longue et noter la date de renouvellement.
2. **Projet Apps Script** : https://script.google.com > Nouveau projet, nom « Calendrier site ».
   Remplacer le contenu par celui de `docs/apps-script-calendrier.gs`.
3. **Jeton dans le projet** : Paramètres du projet (roue dentée) > Propriétés du script >
   ajouter `GITHUB_TOKEN` = le jeton de l'étape 1.
4. **Déclencheur** : dans l'éditeur, choisir la fonction `installer` > Exécuter, puis accepter
   les autorisations (agenda + requêtes externes).
5. **Test** : ajouter un événement dans l'agenda, puis vérifier sur GitHub > Actions qu'un
   « Update Calendar Data » démarre, et le site 1 à 2 minutes après.

En cas d'erreur : script.google.com > Exécutions (journal de `onCalendarChange`).
Jeton expiré → en recréer un et remplacer la propriété `GITHUB_TOKEN`.

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
