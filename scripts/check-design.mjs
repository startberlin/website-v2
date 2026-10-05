import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const tokenPath = 'src/styles/tokens.css';
const violations = [];
const definitions = new Set();
const references = [];
let checked = 0;

async function sourceFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const groups = await Promise.all(entries.map(async (entry) => {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) return sourceFiles(file);
		return /\.(astro|css|tsx)$/.test(file) ? [file] : [];
	}));
	return groups.flat();
}

function location(file, source, offset) {
	return `${path.relative(root, file)}:${source.slice(0, offset).split('\n').length}`;
}

for (const file of await sourceFiles(path.join(root, 'src'))) {
	const source = await readFile(file, 'utf8');
	const relative = path.relative(root, file);
	// Include custom properties passed in Astro's inline style attributes.
	for (const match of source.matchAll(/(--[\w-]+)\s*:/g)) definitions.add(match[1]);
	const regions = file.endsWith('.css')
		? [{ css: source, offset: 0 }]
		: [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
			.map((match) => ({ css: match[1], offset: match.index + match[0].indexOf('>') + 1 }));
	for (const { css, offset } of regions) {
		checked++;
		// Preserve comment length so reported line numbers remain correct.
		const clean = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
		for (const match of clean.matchAll(/var\(\s*(--[\w-]+)/g)) {
			references.push({ token: match[1], at: location(file, source, offset + match.index) });
		}
		if (relative === tokenPath) continue;
		for (const match of clean.matchAll(/([\w-]+)\s*:\s*([^;{}]+)(?=;|})/g)) {
			const [, property, rawValue] = match;
			const value = rawValue.trim();
			const at = location(file, source, offset + match.index);
			if (/#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(value)) {
				violations.push(`${at} - raw colour in ${property}; use a semantic token from ${tokenPath}`);
			}
			if (['font-size', 'font-family', 'font-weight', 'border-radius'].includes(property)
				&& !/^(var\(--[\w-]+\)|inherit|0)$/.test(value)) {
				violations.push(`${at} - ${property}: ${value}; use a documented token`);
			}
			if (property === 'transition' && /\ball\b/.test(value)) {
				violations.push(`${at} - transition: all; list the properties that change`);
			}
		}
	}
}

for (const { token, at } of references) {
	if (!definitions.has(token)) violations.push(`${at} - undefined CSS token ${token}`);
}

if (violations.length) {
	console.error(violations.join('\n'));
	process.exitCode = 1;
} else {
	console.log(`Design check passed: ${checked} stylesheets/blocks, ${definitions.size} defined custom properties.`);
}
