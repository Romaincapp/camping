# Camping du Wignet

Site de réservation pour le camping privatif à Olloy-sur-Viroin, Viroinval (Ardennes belges).

## 🏕️ À propos

Site web vitrine et système de réservation pour un terrain de camping privatif de 3200m² offrant :
- Location exclusive du terrain (jusqu'à 20 personnes)
- Équipements confortables (cuisine, douche chaude, sanitaires)
- Stages de survie et formations bushcraft
- Espaces naturels préservés avec vue sur le lac

**Site web :** [campingduwignet.com](https://campingduwignet.com)

## ✨ Fonctionnalités

### Réservation
- 📅 Calendrier interactif avec disponibilités en temps réel
- 🌍 Support multilingue (Français, Anglais, Néerlandais, Allemand)
- 💶 Calcul automatique des prix avec réductions
- ✉️ Formulaire de demande de réservation

### Interface
- 🎨 Design moderne et responsive (mobile, tablette, desktop)
- 🖼️ Galerie photos interactive avec lightbox
- ⚡ Animations fluides (GSAP)
- 🔍 Optimisé SEO avec données structurées

### Tarification
- **Haute saison** (1er avril - 1er novembre) : 19€/adulte, 13€/enfant par nuit
- **Basse saison** : 19€ premier adulte, 10€/personne additionnelle
- **Réductions** :
  - 5% pour 2-3 nuits
  - 10% pour 4+ nuits
  - Tarifs de groupe à partir de 6 personnes
  - Jusqu'à 40% en basse saison

## 🛠️ Technologies

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** + **Tailwind CSS** - Styling moderne et responsive
- **JavaScript Vanilla** - Pas de framework lourd

### Bibliothèques
- [GSAP 3.12](https://gsap.com/) - Animations professionnelles
- [Swiper 8.4.5](https://swiperjs.com/) - Carrousel d'images
- [GLightbox 3.2.0](https://biati-digital.github.io/glightbox/) - Galerie lightbox
- Vanilla Calendar - Système de réservation personnalisé

### Services tiers
- **Google Calendar API** - Gestion des disponibilités
- **Google Analytics** - Statistiques de visite
- **Google AdSense** - Monétisation

## 📁 Structure du projet

```
camping/
├── index.html                 # Page principale
├── privacy-policy.html        # Politique de confidentialité
├── main.js                    # JavaScript principal (431 lignes)
├── calendar-vanilla.js        # Calendrier et réservations
├── css.css                    # Styles principaux (387 lignes)
├── CalendarStyles.css         # Styles du calendrier
├── CNAME                      # Configuration DNS
└── images/                    # Assets (logos, photos, galerie)
```

## 🚀 Installation et développement

### Prérequis
Aucune installation npm requise - projet 100% statique !

### Développement local

1. Cloner le repository :
```bash
git clone https://github.com/Romaincapp/camping.git
cd camping
```

2. Lancer un serveur local :
   - **Option 1 :** VSCode Live Server (port 5501)
   - **Option 2 :** Python
     ```bash
     python -m http.server 8000
     ```
   - **Option 3 :** Node.js
     ```bash
     npx serve
     ```

3. Ouvrir dans le navigateur :
   - Live Server : `http://localhost:5501`
   - Python : `http://localhost:8000`

### Déploiement

Le site est déployé via **GitHub Pages** :
- Push vers la branche `main`
- Déploiement automatique sur `campingduwignet.com`

## 🎯 Sections principales

1. **Hero** - Bannière d'accueil avec animations flottantes
2. **Certifications** - Badge Campspace (4.93/5, 81 avis)
3. **Galerie** - Carrousel de 12+ photos
4. **Caractéristiques** - 4 cartes mettant en avant :
   - Privatisation du terrain
   - Équipements confortables
   - Cuisine équipée
   - Livret d'accueil numérique
5. **Stages de survie** - Formations bushcraft et team building
6. **Offres promotionnelles** - Deals et réductions

## 📋 Équipements

- Terrain privatif clôturé de 3200m²
- Cuisine équipée 12m² (gazinière, frigo, congélateur)
- Douche chaude extérieure
- Toilettes
- Foyer autorisé (zone dédiée)
- Hamacs et transats
- Eau potable et électricité
- Tri des déchets

## 📜 Règles

- Maximum 20 personnes par réservation
- Calme après 22h00 (respect de la nature)
- Pas de fêtes/musique
- Chiens non acceptés
- Tri des déchets obligatoire
- Évacuation des déchets sous votre responsabilité

## 🔧 Configuration

### Google Calendar API
La clé API est configurée dans [calendar-vanilla.js](calendar-vanilla.js). Pour la modifier :
```javascript
const API_KEY = 'VOTRE_CLE_API';
const CALENDAR_ID = 'VOTRE_CALENDAR_ID';
```

### Google Analytics
ID de suivi : `G-EMBJ7KJYTL` (configuré dans [index.html](index.html))

### Google AdSense
Publisher ID : `ca-pub-1285064157217246`

## 📊 Performances

- ✅ Images avec lazy loading
- ✅ CDN pour les bibliothèques
- ✅ Chargement asynchrone des scripts
- ✅ Optimisations SEO (Schema.org, Open Graph, Twitter Cards)

## 🌐 SEO

- Meta descriptions et keywords
- Données structurées Schema.org (type Campground)
- Open Graph pour Facebook
- Twitter Cards
- URLs canoniques
- Sitemap-ready

## 📝 Historique des commits récents

- `2ef09fd` - ardennes
- `5f5f805` - pub liens
- `cc55fd0` - pub
- `7523063` - adsense (monétisation)
- `64571db` - survie (stages de survie)

## 📞 Contact

Les réservations se font via le formulaire du calendrier sur le site.
Un suivi WhatsApp est effectué après soumission du formulaire.

## 📄 Licence

Projet privé - Camping du Wignet © 2025

---

**Développé avec ❤️ pour offrir une expérience de camping unique dans les Ardennes belges**
