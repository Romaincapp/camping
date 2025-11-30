# Camping du Wignet - Documentation

Site de réservation pour camping privatif à Olloy-sur-Viroin (Ardennes belges).

## Infos clés

- **Type :** Site statique single-page (pas de backend)
- **Domaine :** campingduwignet.com
- **Hébergement :** GitHub Pages (branch main)
- **Pas de build :** Dépendances via CDN

## Stack

```
HTML5 + CSS3 + Tailwind (CDN) + JavaScript Vanilla
CDN: GSAP 3.12, Swiper 8.4.5, GLightbox 3.2.0
Services: Google Calendar (iCal public), Analytics GA4, AdSense
```

## Structure

```
camping/
├── index.html              # Page principale
├── privacy-policy.html     # Politique confidentialité
├── main.js                 # Animations GSAP, Swiper, GLightbox
├── calendar-vanilla.js     # Calendrier (iCal), prix, réservation
├── css.css                 # Styles principaux
├── CalendarStyles.css      # Styles calendrier
├── .gitignore              # Fichiers ignorés par git
├── CNAME                   # DNS
├── images/                 # Assets
└── docs/                   # Documentation détaillée
```

## Calendrier

Le calendrier utilise le **flux iCal public** de Google Calendar (pas d'API key nécessaire).

**Prérequis :** Le calendrier Google doit être public (Paramètres > Rendre accessible au public)

**Modifier l'ID du calendrier :** `calendar-vanilla.js` ligne ~181
```javascript
const CALENDAR_ID = 'votre-email@gmail.com';
```

## Tâches courantes

**Modifier les prix :** `calendar-vanilla.js` ~ligne 50
```javascript
const PRICES = {
    highSeason: { adult: 19, child: 13 },
    lowSeason: { firstAdult: 19, additional: 10 }
}
```

**Ajouter image galerie :** `index.html` section `.gallery-swiper`
```html
<div class="swiper-slide">
    <img src="images/NOM.jpg" alt="Description" class="gallery-item" loading="lazy">
</div>
```

**Changer couleurs :** `css.css` début
```css
:root {
    --primary-color: #2c5f2d;
    --secondary-color: #f4a460;
}
```

## Tests avant déploiement

- [ ] Calendrier s'affiche et dates réservées marquées
- [ ] Sélection dates + calcul prix OK
- [ ] Formulaire validation OK
- [ ] Responsive mobile/tablette/desktop
- [ ] Pas d'erreurs console

## Déploiement

```bash
git add . && git commit -m "Description" && git push origin main
```

---

Voir [docs/](docs/) pour documentation détaillée.
