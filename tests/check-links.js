#!/usr/bin/env node
// Vérifie que chaque fichier local référencé par une page (images, CSS, JS, pages)
// existe, que les ancres internes (#id) pointent vers un id présent,
// et qu'aucun id n'est dupliqué.
// Usage : node tests/check-links.js

const path = require('path');
const { PAGES, read, exists, createReporter, lineOf } = require('./lib');

const report = createReporter('liens');
let checked = 0;

for (const page of PAGES) {
    const html = read(page);
    const ids = new Set();

    for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
        if (ids.has(m[1])) report.fail(`${page}:${lineOf(html, m.index)}`, `id "${m[1]}" dupliqué`);
        ids.add(m[1]);
    }

    const refs = [];
    for (const m of html.matchAll(/\s(src|href|srcset|poster)="([^"]*)"/g)) {
        // srcset : "a.jpg 900w, b.jpg 1600w" → chaque fichier séparément
        const urls = m[1] === 'srcset' ? m[2].split(',').map(c => c.trim().split(/\s+/)[0]) : [m[2]];
        for (const url of urls) refs.push({ url, index: m.index });
    }

    for (const ref of refs) {
        const url = ref.url.trim();
        const where = `${page}:${lineOf(html, ref.index)}`;
        if (!url) { report.fail(where, 'attribut src/href vide'); continue; }
        if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(url)) continue;

        if (url.startsWith('#')) {
            if (url.length > 1 && !ids.has(url.slice(1)) && !html.includes(`id="${url.slice(1)}"`)) {
                report.fail(where, `ancre "${url}" sans id correspondant`);
            }
            checked++;
            continue;
        }

        const file = decodeURI(url.split(/[?#]/)[0]).replace(/^\//, '');
        if (!exists(path.normalize(file))) report.fail(where, `fichier introuvable : ${file}`);
        checked++;
    }
}

report.done(`Liens OK : ${checked} références locales vérifiées dans ${PAGES.length} pages`);
