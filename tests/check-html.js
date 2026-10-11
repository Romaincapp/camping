#!/usr/bin/env node
// Vérifie les bases de chaque page : doctype, langue, encodage, viewport,
// titre, meta description, JSON-LD valide, images avec alt,
// scripts/CSS CDN versionnés avec "integrity", balises principales équilibrées.
// Usage : node tests/check-html.js

const { PAGES, read, createReporter, lineOf } = require('./lib');

const report = createReporter('HTML');

// CDN qui ne peuvent pas avoir de hash fixe (contenu généré à la volée).
const NO_SRI = ['cdn.tailwindcss.com', 'googletagmanager.com', 'googlesyndication.com', 'fonts.googleapis.com'];
const BALANCED_TAGS = ['html', 'head', 'body', 'div', 'section', 'main', 'footer', 'header', 'nav', 'form', 'ul', 'script'];

for (const page of PAGES) {
    const html = read(page);
    const fail = (msg, index) => report.fail(index === undefined ? page : `${page}:${lineOf(html, index)}`, msg);

    if (!/^\s*<!DOCTYPE html>/i.test(html)) fail('<!DOCTYPE html> manquant en début de fichier');
    if (!/<html[^>]*\slang="fr"/i.test(html)) fail('<html lang="fr"> manquant');
    if (!/<meta\s+charset="utf-8"/i.test(html)) fail('<meta charset="UTF-8"> manquant');
    if (!/<meta\s+name="viewport"/i.test(html)) fail('<meta name="viewport"> manquant (responsive)');

    const title = html.match(/<title>([^<]*)<\/title>/i);
    if (!title || !title[1].trim()) fail('<title> manquant ou vide');
    if ((html.match(/<title>/gi) || []).length > 1) fail('plusieurs <title>');

    const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    if (!desc || desc[1].trim().length < 50) fail('meta description manquante ou trop courte (< 50 caractères)');

    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        try { JSON.parse(m[1]); } catch (e) { fail(`JSON-LD invalide (${e.message})`, m.index); }
    }

    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
        if (!/\salt="[^"]+"/i.test(m[0])) fail(`image sans texte alt : ${m[0].slice(0, 80)}`, m.index);
    }

    for (const m of html.matchAll(/<(script|link)\b[^>]*\s(?:src|href)="(https:\/\/[^"]+)"[^>]*>/gi)) {
        const [tag, , url] = m;
        if (/^<link/i.test(tag) && !/rel="stylesheet"/i.test(tag)) continue;
        if (NO_SRI.some(host => url.includes(host))) continue;
        if (!/\sintegrity="sha(256|384|512)-/.test(tag)) fail(`ressource CDN sans attribut integrity : ${url}`, m.index);
        if (!/\/\d+\.\d+(\.\d+)?\//.test(url)) fail(`ressource CDN sans version figée : ${url}`, m.index);
    }

    // Comptage des balises ouvrantes/fermantes (hors commentaires et contenu des scripts).
    const stripped = html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2');
    for (const tag of BALANCED_TAGS) {
        const open = (stripped.match(new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi')) || []).length;
        const close = (stripped.match(new RegExp(`</${tag}\\s*>`, 'gi')) || []).length;
        if (open !== close) fail(`<${tag}> : ${open} ouverture(s) pour ${close} fermeture(s)`);
    }
}

report.done(`HTML OK : ${PAGES.length} pages (${PAGES.join(', ')})`);
