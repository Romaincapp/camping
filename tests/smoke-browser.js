#!/usr/bin/env node
// Test de fumée dans un vrai navigateur (Chromium via Playwright) :
// - chaque page se charge sans erreur JavaScript venant de nos fichiers,
// - le calendrier s'affiche avec des jours et des dates réservées,
// - sélectionner 2 nuits affiche « 2 » nuits et un prix > 0 €,
// - pas de défilement horizontal en largeur mobile (375 px),
// - un autre site ne peut pas afficher index.html dans une iframe (anti-clickjacking).
// Les requêtes Analytics / AdSense sont bloquées. Si un CDN est injoignable
// (réseau restreint), les erreurs qui en découlent sont signalées mais ignorées.
//
// Usage : node tests/smoke-browser.js
// Sans Playwright installé, le test est sauté (sauf si REQUIRE_BROWSER=1).
// SCREENSHOTS=dossier : enregistre une capture desktop + mobile de chaque page.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ROOT, PAGES, createReporter } = require('./lib');

function loadPlaywright() {
    try { return require('playwright'); } catch (e) { /* essai suivant */ }
    try {
        const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
        return require(path.join(globalRoot, 'playwright'));
    } catch (e) { return null; }
}

const playwright = loadPlaywright();
if (!playwright) {
    const msg = 'Playwright introuvable — test navigateur sauté (npm i -g playwright && npx playwright install chromium)';
    if (process.env.REQUIRE_BROWSER === '1') { console.error(`✗ ${msg}`); process.exit(1); }
    console.log(`- ${msg}`);
    process.exit(0);
}

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function startServer() {
    const server = http.createServer((req, res) => {
        const urlPath = decodeURIComponent(req.url.split('?')[0]);
        const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
        if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404); res.end('404'); return;
        }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const BLOCKED = /googletagmanager|google-analytics|googlesyndication|adtrafficquality|doubleclick|ipapi\.co|formspree/;

async function launch() {
    const options = { headless: true };
    const preinstalled = '/opt/pw-browsers/chromium';
    try { return await playwright.chromium.launch(options); } catch (e) {
        if (fs.existsSync(preinstalled)) return playwright.chromium.launch({ ...options, executablePath: preinstalled });
        throw e;
    }
}

(async () => {
    const report = createReporter('test navigateur');
    const server = await startServer();
    const base = `http://127.0.0.1:${server.address().port}/`;
    const browser = await launch();
    const shotsDir = process.env.SCREENSHOTS;
    if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
    const cdnFailures = new Set();

    async function openPage(file, viewport) {
        const context = await browser.newContext({ viewport, locale: 'fr-BE' });
        const page = await context.newPage();
        const errors = [];
        // Réponse vide plutôt qu'un blocage, pour ne pas générer d'erreurs console artificielles.
        await page.route('**/*', route => (BLOCKED.test(route.request().url())
            ? route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
            : route.continue()));
        page.on('requestfailed', req => {
            const url = req.url();
            if (url.startsWith(base)) errors.push(`ressource locale en échec : ${url.slice(base.length)}`);
            else if (!BLOCKED.test(url)) cdnFailures.add(new URL(url).host);
        });
        page.on('response', resp => {
            if (resp.url().startsWith(base) && resp.status() >= 400) errors.push(`HTTP ${resp.status()} : ${resp.url().slice(base.length)}`);
        });
        page.on('pageerror', err => errors.push(`erreur JS : ${err.message}`));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(`console.error : ${msg.text()}`); });
        await page.goto(base + file, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        return { page, context, errors };
    }

    // Erreurs dues à un CDN injoignable (ex. "gsap is not defined") : non bloquantes dans ce cas.
    const CDN_SYMPTOMS = /gsap|ScrollTrigger|Swiper|GLightbox|tailwind|net::ERR|Failed to load resource/i;
    // Problèmes connus qui demandent une décision du propriétaire : avertissement, pas d'échec.
    const KNOWN_ISSUES = [];
    let ignored = 0;
    const warned = new Set();
    function reportErrors(where, errors) {
        for (const e of errors) {
            const known = KNOWN_ISSUES.find(([re]) => re.test(e));
            if (known) { if (!warned.has(known[1])) report.warn(where.split(' ')[0], known[1]); warned.add(known[1]); }
            else if (cdnFailures.size && CDN_SYMPTOMS.test(e)) ignored++;
            else report.fail(where, e.length > 300 ? e.slice(0, 300) + '…' : e);
        }
    }

    // 1. Chaque page, desktop et mobile
    for (const file of PAGES) {
        for (const [label, viewport] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 375, height: 812 }]]) {
            const { page, context, errors } = await openPage(file, viewport);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            if (label === 'mobile' && overflow > 1) report.fail(`${file} (mobile)`, `défilement horizontal de ${overflow}px`);
            if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${file.replace('.html', '')}-${label}.png`), fullPage: true });
            reportErrors(`${file} (${label})`, errors);
            await context.close();
        }
    }

    // 2. Calendrier + calcul du prix
    const { page, context, errors } = await openPage('index.html', { width: 1366, height: 900 });
    try {
        await page.waitForSelector('.calendar-day', { timeout: 10000 });
        const booked = await page.evaluate(() => fetch('calendar-data.json').then(r => r.json()).then(d => d.events.length));
        if (!booked) report.fail('calendrier', 'calendar-data.json ne contient aucune réservation');

        // Aller 2 mois plus loin, puis choisir 3 jours libres consécutifs (= 2 nuits).
        for (let i = 0; i < 2; i++) {
            await page.click('#next-month-btn');
            await page.waitForTimeout(100);
        }
        let start = -1;
        for (let attempt = 0; attempt < 6 && start < 0; attempt++) {
            start = await page.$$eval('.calendar-day', days => {
                const free = days.map(d => !d.querySelector('.bg-red-500') && !d.className.includes('cursor-not-allowed'));
                for (let i = 0; i + 2 < free.length; i++) if (free[i] && free[i + 1] && free[i + 2]) return i;
                return -1;
            });
            if (start < 0) await page.click('#next-month-btn');
        }
        if (start < 0) {
            report.fail('calendrier', 'aucune période de 2 nuits libres trouvée sur 6 mois');
        } else {
            await page.locator('.calendar-day').nth(start).click();
            await page.locator('.calendar-day').nth(start + 2).click();
            await page.waitForTimeout(200);
            const nights = (await page.textContent('#numberOfNights') || '').trim();
            const priceText = (await page.textContent('#totalPrice') || '').replace(/\s+/g, ' ').trim();
            const prices = (priceText.match(/\d+/g) || []).map(Number);
            if (nights !== '2') report.fail('calendrier', `2 nuits sélectionnées, affiché : "${nights}"`);
            if (!prices.length || Math.min(...prices) <= 0) report.fail('calendrier', `prix total invalide : "${priceText}"`);
            else console.log(`  calendrier : 2 nuits → ${priceText}`);
        }
    } catch (e) {
        report.fail('calendrier', e.message.split('\n')[0]);
    }
    reportErrors('index.html (calendrier)', errors);
    await context.close();

    // 3. Anti-clickjacking : un autre site ne doit pas pouvoir afficher index.html dans une iframe.
    const evil = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<iframe src="${base}index.html" width="800" height="600"></iframe>`);
    });
    await new Promise(resolve => evil.listen(0, '127.0.0.1', resolve));
    {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.route(/^https:/, route => route.abort());
        // "localhost" ≠ "127.0.0.1" : origine différente du site testé.
        await page.goto(`http://localhost:${evil.address().port}/`, { waitUntil: 'load' }).catch(() => {});
        await page.waitForTimeout(1000);
        const framed = page.frames().find(f => f !== page.mainFrame() && f.url().startsWith(base));
        const shown = framed && await framed.evaluate(() => getComputedStyle(document.documentElement).display !== 'none').catch(() => false);
        if (shown) report.fail('index.html', 'la page s\'affiche dans l\'iframe d\'un autre site (protection anti-clickjacking absente)');
        else console.log(`  anti-iframe : ${page.url().startsWith(base) ? 'le site sort de l\'iframe' : 'page masquée dans l\'iframe'}`);
        await context.close();
    }
    evil.close();

    await browser.close();
    server.close();
    if (cdnFailures.size) {
        console.log(`  ⚠ CDN injoignables ici : ${[...cdnFailures].join(', ')} — ${ignored} erreur(s) qui en découlent ignorées,`);
        console.log('    rendu et animations non vérifiés (ils le sont sur GitHub Actions).');
    }
    report.done(`Navigateur OK : ${PAGES.length} pages desktop + mobile, calendrier et prix fonctionnels`);
})().catch(e => { console.error(`✗ ${e.message}`); process.exit(1); });
