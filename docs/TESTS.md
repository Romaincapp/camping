# Tests du site

Tests automatiques en Node.js, **sans dépendance npm** (sauf Playwright pour le test navigateur).
Ils tournent en local et sur GitHub Actions (workflow « Tests ») à chaque push et pull request.

## Lancer les tests

```bash
node tests/run-all.js            # tout (~10 s), navigateur compris si Playwright est installé
node tests/run-all.js --static   # tests rapides seulement (~1 s), sans navigateur
node tests/check-prices.js       # un test précis
SCREENSHOTS=captures node tests/smoke-browser.js   # + captures desktop/mobile de chaque page
```

Résultat : `✓` = OK, `✗` = erreur (le test échoue), `⚠` = problème connu à trancher (n'échoue pas).

## Ce que vérifie chaque test

| Test | Vérifie | Quand il casse typiquement |
|------|---------|----------------------------|
| `check-links.js` | Chaque image / CSS / JS / page référencé existe (y compris chaque fichier d'un `srcset`, ex. versions mobiles `images/m/`) ; chaque ancre `#id` a son `id` ; pas d'`id` dupliqué | Image renommée ou supprimée, faute dans un nom de fichier |
| `check-html.js` | Doctype, `lang="fr"`, charset, viewport, `<title>`, meta description ; JSON-LD valide ; `alt` sur les images ; CDN avec `integrity` et version figée ; balises `div`/`section`/`body`… équilibrées | Copier-coller d'un bloc HTML incomplet, oubli d'un `</div>` |
| `check-prices.js` | Tarifs identiques entre la grille « Tarifs » de `index.html`, le texte d'aide du formulaire et le calcul `nightlyRawPrice()` de `calendar-vanilla.js` ; plafond 200 €/nuit ; réductions 5 % / 10 % ; période haute saison | Prix changé à un seul endroit |
| `check-reviews.js` | Note et nombre d'avis identiques dans le JSON-LD et les blocs mobile et desktop | Avis mis à jour à un seul endroit |
| `check-csp.js` | La Content-Security-Policy autorise chaque CDN et chaque domaine appelé par les scripts | Nouveau CDN ou nouvelle API ajouté sans mettre à jour la CSP → bloqué en silence par le navigateur |
| `check-scripts.js` | Pas d'erreur de syntaxe dans `main.js`, `calendar-vanilla.js` et les `<script>` inline ; `calendar-data.json` valide (dates, ids uniques, mis à jour récemment) | Faute de frappe dans le JS, workflow calendrier en panne |
| `smoke-browser.js` | Dans Chromium : chaque page sans erreur JS, en desktop et mobile ; pas de défilement horizontal à 375 px ; carrousel photos mobile (photo plus étroite que l'écran, aimantation, un point par photo, compteur qui suit) ; le calendrier s'affiche ; sélectionner 2 nuits affiche « 2 » nuits et un prix > 0 € ; un autre site ne peut pas afficher la page dans une iframe | Bug JS, calendrier cassé, mise en page mobile trop large, carrousel mobile cassé, script anti-iframe retiré |

Le test navigateur bloque Google Analytics / AdSense / Formspree (rien n'est envoyé).
Si les CDN (Tailwind, cdnjs) sont injoignables — cas des sessions Claude Code dans le cloud —
les erreurs qui en découlent sont ignorées et signalées ; le rendu complet est alors vérifié par GitHub Actions
(les captures d'écran y sont téléchargeables dans l'onglet **Actions → run → Artifacts → captures-ecran**).

Installer Playwright en local (une fois) : `npm i -g playwright && npx playwright install chromium`.

## Problèmes connus (avertissements ⚠)

Aucun pour l'instant. Pour en signaler un sans bloquer la CI : `report.warn(...)` dans un test `check-*`,
ou une entrée dans `KNOWN_ISSUES` de `smoke-browser.js`, avec une ligne ici :

| Avertissement | Décision à prendre |
|---------------|--------------------|

Une fois tranché, retirer l'avertissement correspondant (`report.warn` dans `check-prices.js`, `KNOWN_ISSUES` dans `smoke-browser.js`).

## Ajouter un test

1. Créer `tests/check-QUELQUECHOSE.js` (il est lancé automatiquement par `run-all.js` et la CI).
2. Utiliser `tests/lib.js` : `PAGES`, `read()`, `exists()`, `createReporter()` (`fail` / `warn` / `done`).
3. Messages en français, avec le fichier et la ligne quand c'est possible.
4. Vérifier que le test **échoue** quand on casse volontairement ce qu'il protège, puis qu'il repasse.
5. Ajouter une ligne dans le tableau ci-dessus.

Règle : toute information répétée à plusieurs endroits (prix, avis, dates…) doit avoir un test de cohérence.
