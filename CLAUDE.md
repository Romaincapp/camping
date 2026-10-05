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
├── tests/check-reviews.js  # Test : cohérence note / nombre d'avis
├── .github/workflows/      # tests.yml (tests auto) + update-calendar.yml
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

**Mettre à jour la note et le nombre d'avis (Campspace) :** `index.html` + copie `camping/index.html`, 3 endroits par fichier à changer ensemble :
1. JSON-LD (~ligne 112) : `"ratingValue": "4.92"` et `"reviewCount": "102"`
2. Bloc avis mobile (~ligne 206 / 228) : `4.92` et `102 avis vérifiés`
3. Bloc avis desktop (~ligne 279 / 283) : `4.92` et `102 avis vérifiés`

Puis **obligatoirement** lancer le test : `node tests/check-reviews.js` (doit afficher ✓).

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

**Tests automatiques** (à lancer après chaque modification, aussi exécutés par GitHub Actions via `.github/workflows/tests.yml` à chaque push et pull request) :
```bash
node tests/check-reviews.js   # note/avis identiques partout + JSON-LD valide
```
Ne pas fusionner dans `main` si un test échoue. Toute nouvelle modification « à plusieurs endroits » doit venir avec un test dans `tests/` et une ligne ici.

**Vérifications manuelles :**
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
