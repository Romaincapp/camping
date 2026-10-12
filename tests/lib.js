// Petits utilitaires partagés par les tests (aucune dépendance npm).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Pages publiées à la racine du site (camping/index.html n'est qu'une redirection vers l'accueil).
const PAGES = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function exists(file) {
    return fs.existsSync(path.join(ROOT, file));
}

// Compteur d'erreurs + affichage homogène.
function createReporter(name) {
    let errors = 0;
    return {
        fail(where, msg) {
            console.error(`✗ ${where} : ${msg}`);
            errors++;
        },
        // Problème connu qui demande une décision humaine : affiché, mais ne fait pas échouer le test.
        warn(where, msg) {
            console.log(`⚠ ${where} : ${msg}`);
        },
        done(successMsg) {
            if (errors) {
                console.error(`\n${errors} erreur(s) — ${name}.`);
                process.exit(1);
            }
            console.log(`✓ ${successMsg}`);
        }
    };
}

// Numéro de ligne d'un index dans un texte (pour des messages utiles).
function lineOf(text, index) {
    return text.slice(0, index).split('\n').length;
}

module.exports = { ROOT, PAGES, read, exists, createReporter, lineOf };
