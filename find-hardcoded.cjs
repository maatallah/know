const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
const hardcodedPattern = />\s*([A-Z][a-zA-Z0-9,\.\-\'\"\?\! ]{2,})\s*</g;
const placeholderPattern = /placeholder=['"]([^'"]+[a-zA-Z]{3,}[^'"]+)['"]/g;
const titlePattern = /title=['"]([^'"]+[a-zA-Z]{3,}[^'"]+)['"]/g;

let totalFound = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = [];

    // Find JSX text nodes
    let m;
    while ((m = hardcodedPattern.exec(content)) !== null) {
        if (!m[1].startsWith('{') && !m[1].includes('{t(') && !m[1].includes('{tc(')) {
            matches.push(`TEXT: ${m[1].trim()}`);
        }
    }

    // Find placeholders
    while ((m = placeholderPattern.exec(content)) !== null) {
        if (!m[1].startsWith('{')) {
            matches.push(`PLACEHOLDER: ${m[1]}`);
        }
    }

    // Find titles
    while ((m = titlePattern.exec(content)) !== null) {
        if (!m[1].startsWith('{')) {
            matches.push(`TITLE: ${m[1]}`);
        }
    }
    
    // Find window.confirm
    const confirmPattern = /window\.confirm\(['"](.*?)['"]\)/g;
    while ((m = confirmPattern.exec(content)) !== null) {
        matches.push(`CONFIRM: ${m[1]}`);
    }

    // Find alerts
    const alertPattern = /alert\(['"](.*?)['"]\)/g;
    while ((m = alertPattern.exec(content)) !== null) {
        matches.push(`ALERT: ${m[1]}`);
    }

    if (matches.length > 0) {
        console.log(`\n\n=== ${file.replace(__dirname, '')} ===`);
        matches.forEach(match => console.log(`  - ${match}`));
        totalFound += matches.length;
    }
});

console.log(`\n\nTotal hardcoded potentials found: ${totalFound}`);
