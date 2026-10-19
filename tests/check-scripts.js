#!/usr/bin/env node
// Vérifie que les fichiers JavaScript du site n'ont pas d'erreur de syntaxe
// et que calendar-data.json (mis à jour chaque heure par GitHub Actions) est valide :
// JSON lisible, date "updated", événements avec début < fin et identifiants uniques.
// Usage : node tests/check-scripts.js

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, read, createReporter } = require('./lib');

const report = createReporter('scripts');

// 1. Syntaxe JS (fichiers à la racine, chargés par les pages)
const scripts = fs.readdirSync(ROOT).filter(f => f.endsWith('.js'));
for (const file of scripts) {
    try {
        execFileSync(process.execPath, ['--check', path.join(ROOT, file)], { stdio: 'pipe' });
    } catch (e) {
        report.fail(file, `erreur de syntaxe\n${e.stderr.toString().trim()}`);
    }
}

// 1b. Syntaxe des <script> inline des pages
for (const page of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
    const html = read(page);
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)) {
        try { new Function(m[1]); } catch (e) {
            report.fail(`${page}:${html.slice(0, m.index).split('\n').length}`, `script inline invalide (${e.message})`);
        }
    }
}

// 2. Données du calendrier
let data;
try {
    data = JSON.parse(read('calendar-data.json'));
} catch (e) {
    report.fail('calendar-data.json', `JSON invalide (${e.message})`);
}
if (data) {
    if (isNaN(Date.parse(data.updated))) report.fail('calendar-data.json', `"updated" invalide : ${data.updated}`);
    if (!Array.isArray(data.events)) {
        report.fail('calendar-data.json', '"events" doit être une liste');
    } else {
        const ids = new Set();
        data.events.forEach((e, i) => {
            const where = `calendar-data.json événement n°${i + 1}`;
            const start = Date.parse(e.start);
            const end = Date.parse(e.end);
            if (isNaN(start) || isNaN(end)) report.fail(where, `dates invalides (${e.start} → ${e.end})`);
            else if (end <= start) report.fail(where, `fin avant le début (${e.start} → ${e.end})`);
            if (!e.id) report.fail(where, 'id manquant');
            else if (ids.has(e.id)) report.fail(where, `id dupliqué : ${e.id}`);
            ids.add(e.id);
            if (e.title !== 'Réservé') report.fail(where, `titre « ${e.title} » publié : calendar-data.json est public, update-calendar.yml doit mettre « Réservé »`);
        });
    }
    const ageDays = (Date.now() - Date.parse(data.updated)) / 86400000;
    if (ageDays > 2) report.warn('calendar-data.json', `pas mis à jour depuis ${Math.floor(ageDays)} jours — vérifier le workflow update-calendar.yml`);
}

report.done(`Scripts OK : ${scripts.join(', ')} + scripts inline ; calendar-data.json : ${data ? data.events.length : 0} réservations`);
