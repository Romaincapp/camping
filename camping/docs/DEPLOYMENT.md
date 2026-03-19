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
- Swiper 8.4.5 (v11 disponible)
- GLightbox 3.2.0

**Google Calendar API :**
- Vérifier quotas
- Monitoring erreurs

**Images :**
- Optimiser taille
- Envisager WebP

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
