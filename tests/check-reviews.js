#!/usr/bin/env node
// Vérifie que la note et le nombre d'avis sont identiques partout dans la page :
// données structurées Google (JSON-LD) + blocs avis mobile et desktop.
// Usage : node tests/check-reviews.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = ['index.html', 'camping/index.html'];
const EXPECTED_BLOCKS = 2; // mobile + desktop

let errors = 0;

function fail(file, msg) {
    console.error(`✗ ${file} : ${msg}`);
    errors++;
}

function findAggregateRating(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.aggregateRating) return node.aggregateRating;
    for (const value of Object.values(node)) {
        const found = findAggregateRating(value);
        if (found) return found;
    }
    return null;
}

function checkFile(file) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) return;
    const html = fs.readFileSync(fullPath, 'utf8');

    // 1. Données structurées (JSON-LD)
    let rating = null;
    const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const [, json] of ldBlocks) {
        try {
            rating = findAggregateRating(JSON.parse(json)) || rating;
        } catch (e) {
            fail(file, `JSON-LD invalide (${e.message})`);
            return;
        }
    }
    if (!rating) {
        fail(file, 'aggregateRating introuvable dans le JSON-LD');
        return;
    }

    const ldValue = rating.ratingValue;
    const ldCount = rating.reviewCount;

    if (!/^\d\.\d{1,2}$/.test(ldValue) || Number(ldValue) < 1 || Number(ldValue) > 5) {
        fail(file, `ratingValue "${ldValue}" invalide (attendu : nombre entre 1 et 5, ex. "4.92")`);
    }
    if (!/^[1-9]\d*$/.test(ldCount)) {
        fail(file, `reviewCount "${ldCount}" invalide (attendu : entier positif, ex. "102")`);
    }

    // 2. Blocs affichés aux visiteurs
    const shownValues = [...html.matchAll(/>\s*(\d[.,]\d+)\s*<\/span>\s*<span[^>]*>\s*\/5\s*</g)].map(m => m[1]);
    const shownCounts = [...html.matchAll(/(\d+)\s+avis vérifiés/g)].map(m => m[1]);

    if (shownValues.length !== EXPECTED_BLOCKS) {
        fail(file, `${shownValues.length} note(s) affichée(s) trouvée(s), ${EXPECTED_BLOCKS} attendue(s)`);
    }
    if (shownCounts.length !== EXPECTED_BLOCKS) {
        fail(file, `${shownCounts.length} "N avis vérifiés" trouvé(s), ${EXPECTED_BLOCKS} attendu(s)`);
    }
    shownValues.forEach((v, i) => {
        if (v !== ldValue) fail(file, `note affichée n°${i + 1} = ${v}, JSON-LD = ${ldValue}`);
    });
    shownCounts.forEach((c, i) => {
        if (c !== ldCount) fail(file, `nombre d'avis affiché n°${i + 1} = ${c}, JSON-LD = ${ldCount}`);
    });

    return { value: ldValue, count: ldCount };
}

const results = {};
for (const file of FILES) {
    const result = checkFile(file);
    if (result) results[file] = result;
}

// 3. Les copies doivent avoir les mêmes chiffres
const [first, ...others] = Object.entries(results);
for (const [file, r] of others) {
    if (r.value !== first[1].value || r.count !== first[1].count) {
        fail(file, `${r.value} / ${r.count} avis, alors que ${first[0]} a ${first[1].value} / ${first[1].count} avis`);
    }
}

if (errors) {
    console.error(`\n${errors} erreur(s) dans les avis.`);
    process.exit(1);
}
console.log(`✓ Avis cohérents : ${first[1].value}/5 pour ${first[1].count} avis (${Object.keys(results).join(', ')})`);
