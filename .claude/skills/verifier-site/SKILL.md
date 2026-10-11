---
name: verifier-site
description: Vérifie le site Camping du Wignet avec la suite de tests (liens, HTML, prix, avis, CSP, scripts, navigateur). À utiliser après TOUTE modification du site (HTML, CSS, JS, images, prix, avis, calendrier), avant chaque commit ou push, quand on demande « teste le site », « vérifie », « est-ce que tout marche », et pour ajouter un test quand une info est dupliquée à plusieurs endroits.
---

# Vérifier le site

Site statique sans build. Tests en Node.js dans `tests/`, détails dans `docs/TESTS.md`.

## 1. Après chaque modification

```bash
node tests/run-all.js
```

- `✓` partout → OK pour commit/push.
- `✗` → corriger **la cause** (pas le test), relancer jusqu'au vert. Ne jamais pousser sur `main` avec un `✗`.
- `⚠` → problème connu listé dans `docs/TESTS.md` : le signaler à l'utilisateur s'il touche la modification en cours, sinon ignorer.

Pendant un travail rapide, `node tests/run-all.js --static` (~1 s) puis la suite complète avant le commit.

## 2. Vérifier visuellement une modification d'affichage

```bash
SCREENSHOTS=<scratchpad>/captures node tests/smoke-browser.js
```

Puis lire les PNG (`index-desktop.png`, `index-mobile.png`, …) avec l'outil Read.
Pour comparer avant/après : `git stash`, captures dans `avant/`, `git stash pop`, captures dans `apres/`.

Dans une session cloud, Tailwind et cdnjs sont bloqués : les pages s'affichent sans style
(le test le signale « CDN injoignables »). Le rendu réel est vérifié par GitHub Actions
(artifact `captures-ecran`). Ne pas tenter de contourner le proxy.

## 3. Choisir le test ciblé selon la modification

| Modification | Test |
|--------------|------|
| Prix, saisons, réductions | `node tests/check-prices.js` |
| Note / nombre d'avis | `node tests/check-reviews.js` |
| Image ajoutée / renommée, lien | `node tests/check-links.js` |
| Structure HTML, nouvelle section | `node tests/check-html.js` |
| Nouveau CDN, nouvelle API (`fetch`) | `node tests/check-csp.js` (+ ajouter le domaine dans la CSP de `index.html`) |
| JS, `calendar-data.json` | `node tests/check-scripts.js` puis `node tests/smoke-browser.js` |
| Calendrier, formulaire, mobile | `node tests/smoke-browser.js` |

## 4. Ajouter un test

Quand une information apparaît à plusieurs endroits, ou qu'un bug a été corrigé :
1. Créer `tests/check-<sujet>.js` en utilisant `tests/lib.js` (`PAGES`, `read`, `exists`, `createReporter` → `fail` / `warn` / `done`). Il est pris automatiquement par `run-all.js` et la CI.
2. Le casser volontairement sur une copie (dossier scratchpad) pour prouver qu'il détecte l'erreur.
3. Documenter : une ligne dans le tableau de `docs/TESTS.md` et dans la section Tests de `CLAUDE.md`.

## 5. Avant de pousser

- [ ] `node tests/run-all.js` → `✓ N/N tests OK`
- [ ] Après le push : le workflow « Tests » de GitHub Actions est vert (statique + navigateur).
- [ ] Le dossier `camping/` est une ancienne copie : seul `camping/index.html` est encore tenu à jour pour les avis.
