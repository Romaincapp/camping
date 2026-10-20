# Déploiement et maintenance

## GitHub Pages

```bash
git add .
git commit -m "Description"
git push origin main
```

Déploiement automatique depuis `main`.

**DNS :** Fichier `CNAME` → `campingduwignet.com`

## Développement local

**VSCode Live Server :**
1. Extension "Live Server"
2. Clic droit `index.html` → "Open with Live Server"
3. http://localhost:5501

**Python :**
```bash
python -m http.server 8000
```

## Sécurité

1. **Clé API exposée** - Restrictions activées côté Google Cloud Console
2. **Formulaire** - Pas de backend, données non stockées

## Maintenance

**Bibliothèques CDN :**
- GSAP 3.12
- (Swiper retiré : la galerie utilise le défilement natif)
- GLightbox 3.2.0

**Google Calendar API :**
- Vérifier quotas
- Monitoring erreurs

**Images :**
- Optimiser taille
- Envisager WebP

**Avis Campspace :**
- Mettre à jour la note et le nombre d'avis dans `index.html` (JSON-LD + blocs mobile et desktop)
- Lancer `node tests/check-reviews.js` avant de pousser

## Tests

```bash
node tests/run-all.js
```

Détail de chaque test, problèmes connus et ajout d'un test : voir [TESTS.md](TESTS.md).

Les tests tournent automatiquement sur GitHub (onglet **Actions**, workflow « Tests ») à chaque push et pull request. Une croix rouge = ne pas fusionner, corriger d'abord.

## Bugs connus

1. **Calendar API timeout** - Parfois >5s, fallback affiché
2. **iOS keyboard** - Peut cacher champs formulaire
3. **Dates passées** - Validation client uniquement

## Git

```bash
git status                        # État
git log --oneline -5              # Derniers commits
git checkout -b feature/nom       # Nouvelle feature
git checkout main                 # Retour main
git restore .                     # Annuler modifs
```
