#!/usr/bin/env node
// Lance tous les tests du site, dans l'ordre, et résume.
// Usage : node tests/run-all.js            (tout, navigateur compris si Playwright est installé)
//         node tests/run-all.js --static   (sans le test navigateur, ~1 s)

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const staticOnly = process.argv.includes('--static');
const tests = fs.readdirSync(__dirname).filter(f => /^check-.*\.js$/.test(f)).sort();
if (!staticOnly) tests.push('smoke-browser.js');

const failed = [];
for (const test of tests) {
    console.log(`\n▶ ${test}`);
    try {
        execFileSync(process.execPath, [path.join(__dirname, test)], { stdio: 'inherit' });
    } catch (e) {
        failed.push(test);
    }
}

console.log('\n' + '─'.repeat(50));
if (failed.length) {
    console.error(`✗ ${failed.length}/${tests.length} test(s) en échec : ${failed.join(', ')}`);
    process.exit(1);
}
console.log(`✓ ${tests.length}/${tests.length} tests OK`);
