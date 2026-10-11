#!/usr/bin/env node
// Vérifie que la Content-Security-Policy de chaque page autorise bien
// les domaines utilisés : scripts et CSS externes de la page, et domaines
// appelés en JavaScript (fetch) par les scripts du site.
// Sans ça, ajouter un CDN ou une API casse le site en silence (bloqué par le navigateur).
// Usage : node tests/check-csp.js

const fs = require('fs');
const { ROOT, PAGES, read, createReporter } = require('./lib');

const report = createReporter('CSP');

function parseCsp(html) {
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/i);
    if (!m) return null;
    const csp = {};
    for (const part of m[1].split(';')) {
        const [name, ...values] = part.trim().split(/\s+/);
        if (name) csp[name] = values;
    }
    return csp;
}

function allowed(csp, directive, url) {
    const sources = csp[directive] || csp['default-src'] || [];
    const { origin, host } = new URL(url);
    return sources.some(s => s === origin || s === host || s === 'https:'
        || (s.includes('*.') && host.endsWith(s.split('*.')[1])));
}

let checked = 0;
for (const page of PAGES) {
    const html = read(page);
    const csp = parseCsp(html);
    if (!csp) continue; // page sans CSP : rien à vérifier

    for (const m of html.matchAll(/<script\b[^>]*\bsrc="(https:\/\/[^"]+)"/gi)) {
        if (!allowed(csp, 'script-src', m[1])) report.fail(page, `script-src n'autorise pas ${new URL(m[1]).origin}`);
        checked++;
    }
    for (const m of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="(https:\/\/[^"]+)"|<link\b[^>]*href="(https:\/\/[^"]+)"[^>]*rel="stylesheet"/gi)) {
        const url = m[1] || m[2];
        if (!allowed(csp, 'style-src', url)) report.fail(page, `style-src n'autorise pas ${new URL(url).origin}`);
        checked++;
    }
    // Scripts locaux chargés par la page : leurs URL https doivent être dans connect-src.
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="(?!https?:)([^"]+)"/gi)) {
        const file = m[1].split('?')[0];
        if (!fs.existsSync(`${ROOT}/${file}`)) continue;
        for (const u of read(file).matchAll(/https:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}/g)) {
            if (!allowed(csp, 'connect-src', u[0])) report.fail(`${page} → ${file}`, `connect-src n'autorise pas ${u[0]}`);
            checked++;
        }
    }
}

report.done(`CSP OK : ${checked} ressources externes autorisées`);
