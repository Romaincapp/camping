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
Services: Google Calendar (API v3 + iCal public), Analytics GA4, AdSense
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
├── tests/                  # Tests auto (voir docs/TESTS.md), lancer : node tests/run-all.js
├── .claude/skills/         # verifier-site : procédure de test à suivre après chaque modif
├── .github/workflows/      # tests.yml (tests auto) + update-calendar.yml
├── .gitignore              # Fichiers ignorés par git
├── CNAME                   # DNS
├── images/                 # Assets
└── docs/                   # Documentation détaillée
```

## Calendrier

Le calendrier lit Google Calendar via l'**API Calendar v3** (clé restreinte au domaine) et, en secours, le **flux iCal public**.

**Prérequis :** Le calendrier Google doit être public (Paramètres > Rendre accessible au public)

**Modifier l'ID du calendrier :** `calendar-vanilla.js` ligne ~181
```javascript
const CALENDAR_ID = 'votre-email@gmail.com';
```

**Lecture :** en direct via l'API Google Calendar (`API_KEY` restreinte au domaine, en haut de `calendar-vanilla.js`), sinon `calendar-data.json` régénéré chaque heure par `update-calendar.yml`. Les titres (noms des clients) ne sont jamais publiés : « Réservé » partout. Détails : `docs/CALENDAR.md`.

## Tâches courantes

**Modifier les prix :** 3 endroits à changer ensemble, puis `node tests/check-prices.js` :
1. `index.html` : grille « Tarifs 2026 » (Haute saison / Basse saison)
2. `calendar-vanilla.js` : fonction `nightlyRawPrice()` (calcul réel) + `Math.min(..., 200)` (plafond)
3. `calendar-vanilla.js` : texte d'aide « Prix haute saison (...) / Prix basse saison » sous le formulaire

**Mettre à jour la note et le nombre d'avis (Campspace) :** `index.html`, 3 endroits à changer ensemble :
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

**Après chaque modification, suivre le skill `verifier-site`** (`.claude/skills/verifier-site/SKILL.md`) et lancer :
```bash
node tests/run-all.js            # tous les tests (~10 s)
node tests/run-all.js --static   # rapide, sans navigateur (~1 s)
```

| Test | Vérifie |
|------|---------|
| `check-links.js` | fichiers référencés existants, ancres `#id`, pas d'id dupliqué |
| `check-html.js` | balises de base, SEO, JSON-LD, `alt`, SRI des CDN, balises équilibrées |
| `check-prices.js` | prix identiques : grille de la page / texte d'aide / calcul JS |
| `check-reviews.js` | note/avis identiques partout + JSON-LD valide |
| `check-csp.js` | la CSP autorise tous les CDN et domaines appelés en JS |
| `check-scripts.js` | syntaxe JS + `calendar-data.json` valide et à jour |
| `smoke-browser.js` | Chromium : pages sans erreur JS, mobile sans débordement, calendrier + prix 2 nuits, anti-iframe |

Aussi exécutés par GitHub Actions (`.github/workflows/tests.yml`) à chaque push et pull request.
`✗` = ne pas fusionner dans `main`. `⚠` = problème connu à trancher, listé dans `docs/TESTS.md`.
Toute nouvelle information « à plusieurs endroits » doit venir avec un test dans `tests/` et une ligne ici.

**Vérifications manuelles restantes :**
- [ ] Envoi réel du formulaire (Formspree)
- [ ] Rendu visuel tablette

## Déploiement

```bash
git add . && git commit -m "Description" && git push origin main
```

---

Voir [docs/](docs/) pour documentation détaillée.
