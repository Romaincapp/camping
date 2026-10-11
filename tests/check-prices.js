#!/usr/bin/env node
// Vérifie que les tarifs sont identiques aux 3 endroits où ils apparaissent :
// 1. la grille « Tarifs » de index.html,
// 2. le texte d'aide sous le formulaire (calendar-vanilla.js, « Prix haute saison ... »),
// 3. le calcul réel : fonction nightlyRawPrice() + plafond Math.min(..., 200) dans calendar-vanilla.js.
// Vérifie aussi les réductions annoncées et la période de haute saison.
// Usage : node tests/check-prices.js

const vm = require('vm');
const { read, createReporter } = require('./lib');

const report = createReporter('prix');
const html = read('index.html');
const js = read('calendar-vanilla.js');

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const num = s => (s === undefined ? NaN : Number(s));

// --- 1. Grille tarifaire de la page ---
const highBlock = (html.match(/Haute saison \(([^)]*)\)\s*:\s*<\/p>([\s\S]*?)<\/ul>/) || []);
const lowBlock = (html.match(/Basse saison\s*:\s*<\/p>([\s\S]*?)<\/ul>/) || []);
if (!highBlock.length || !lowBlock.length) {
    report.fail('index.html', 'grille « Haute saison (...) » / « Basse saison » introuvable');
    report.done('');
}
const page = {
    period: highBlock[1],
    high: {
        firstAdult: num((highBlock[2].match(/Premier adulte\s*:\s*(\d+)\s*€/) || [])[1]),
        nextAdult: num((highBlock[2].match(/Adultes suivants\s*:\s*(\d+)\s*€/) || [])[1]),
        child: num((highBlock[2].match(/Enfant\s*:\s*(\d+)\s*€/) || [])[1]),
        cap: num((highBlock[2].match(/Plafond\s*:\s*(\d+)\s*€/) || [])[1])
    },
    low: {
        adult: num((lowBlock[1].match(/Adulte\s*:\s*(\d+)\s*€/) || [])[1]),
        child: num((lowBlock[1].match(/Enfant\s*:\s*(\d+)\s*€/) || [])[1]),
        cap: num((lowBlock[1].match(/Plafond\s*:\s*(\d+)\s*€/) || [])[1])
    }
};
for (const [season, values] of Object.entries({ haute: page.high, basse: page.low })) {
    for (const [k, v] of Object.entries(values)) {
        if (!Number.isFinite(v)) report.fail('index.html', `tarif ${season} saison « ${k} » illisible`);
    }
}

// --- 2. Texte d'aide sous le formulaire ---
const helpHigh = js.match(/Prix haute saison \(([^)]*)\):\s*(\d+)€ \(1er adulte\), (\d+)€ \(suivants\), (\d+)€\/enfant - max (\d+)€\/nuit/);
const helpLow = js.match(/Prix basse saison:\s*(\d+)€\/adulte, (\d+)€\/enfant - max (\d+)€\/nuit/);
if (!helpHigh || !helpLow) {
    report.fail('calendar-vanilla.js', 'texte « Prix haute/basse saison ... » introuvable ou format modifié');
} else {
    const help = {
        period: helpHigh[1],
        high: { firstAdult: num(helpHigh[2]), nextAdult: num(helpHigh[3]), child: num(helpHigh[4]), cap: num(helpHigh[5]) },
        low: { adult: num(helpLow[1]), child: num(helpLow[2]), cap: num(helpLow[3]) }
    };
    if (help.period !== page.period) report.fail('calendar-vanilla.js', `période haute saison « ${help.period} » ≠ page « ${page.period} »`);
    for (const season of ['high', 'low']) {
        for (const [k, v] of Object.entries(page[season])) {
            if (help[season][k] !== v) report.fail('calendar-vanilla.js', `texte d'aide ${season === 'high' ? 'haute' : 'basse'} saison « ${k} » = ${help[season][k]} €, page = ${v} €`);
        }
    }
}

// --- 3. Calcul réel ---
const fnSource = (js.match(/function nightlyRawPrice\([^)]*\)\s*\{[\s\S]*?\n {2}\}/) || [])[0];
if (!fnSource) {
    report.fail('calendar-vanilla.js', 'fonction nightlyRawPrice() introuvable');
} else {
    const price = vm.runInNewContext(`(${fnSource})`);
    const checks = [
        ['1 adulte haute saison', price(1, 0, true), page.high.firstAdult],
        ['adulte suivant haute saison', price(2, 0, true) - price(1, 0, true), page.high.nextAdult],
        ['enfant haute saison', price(1, 1, true) - price(1, 0, true), page.high.child],
        ['adulte basse saison', price(1, 0, false), page.low.adult],
        ['enfant basse saison', price(1, 1, false) - price(1, 0, false), page.low.child]
    ];
    for (const [label, computed, shown] of checks) {
        if (computed !== shown) report.fail('calendar-vanilla.js', `calcul ${label} = ${computed} €, page = ${shown} €`);
    }
}

const caps = [...js.matchAll(/Math\.min\([^;]*?,\s*(\d+)\)/g)].map(m => num(m[1]));
if (!caps.length) report.fail('calendar-vanilla.js', 'plafond Math.min(..., N) introuvable');
for (const cap of new Set(caps)) {
    if (cap !== page.high.cap || cap !== page.low.cap) report.fail('calendar-vanilla.js', `plafond calculé ${cap} €, page = ${page.high.cap} € / ${page.low.cap} €`);
}

// --- Réductions annoncées dans le code vs appliquées ---
if (!/nights >= 4\)\s*\{\s*stayFactor = 0\.90;\s*stayReason = 'Réduction 10%/.test(js)) {
    report.fail('calendar-vanilla.js', 'réduction 4 nuits : facteur 0.90 et libellé « 10% » ne correspondent plus');
}
if (!/nights >= 2\)\s*\{\s*stayFactor = 0\.95;\s*stayReason = 'Réduction 5%/.test(js)) {
    report.fail('calendar-vanilla.js', 'réduction 2-3 nuits : facteur 0.95 et libellé « 5% » ne correspondent plus');
}

// --- Période de haute saison : texte vs condition getMonth() ---
const season = js.match(/isHighSeason = start\.getMonth\(\) >= (\d+) && start\.getMonth\(\) <= (\d+)/);
const period = (page.period || '').toLowerCase().match(/1er (\S+) - 1er (\S+)/);
if (!season || !period) {
    report.fail('calendar-vanilla.js', 'condition de haute saison ou période affichée illisible');
} else {
    const firstMonth = MONTHS.indexOf(period[1]);
    const lastMonth = MONTHS.indexOf(period[2]) - 1; // « jusqu'au 1er novembre » = dernier mois complet : octobre
    const [jsFirst, jsLast] = [num(season[1]), num(season[2])];
    if (jsFirst !== firstMonth) report.fail('calendar-vanilla.js', `haute saison commence en ${MONTHS[jsFirst]} dans le calcul, ${period[1]} sur la page`);
    if (jsLast !== lastMonth) {
        report.fail('calendar-vanilla.js', `haute saison calculée jusqu'à fin ${MONTHS[jsLast]}, page « jusqu'au 1er ${period[2]} » `
            + `(dès le 1er ${period[2]} : basse saison). Attendu : getMonth() <= ${lastMonth}.`);
    }
}

report.done(`Prix cohérents : haute ${page.high.firstAdult}/${page.high.nextAdult}/${page.high.child} €, `
    + `basse ${page.low.adult}/${page.low.child} €, plafond ${page.high.cap} €/nuit (page, texte d'aide, calcul)`);
