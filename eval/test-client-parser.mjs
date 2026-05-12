// Test harness for extractJDMetadata (client-side JD parser).
// Slices the function body out of app/app.js, eval()s it in a clean scope,
// and runs it against the Clio fixture.
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const appSrc   = fs.readFileSync(path.join(repoRoot, 'app/app.js'), 'utf8');
const fixture  = fs.readFileSync(path.join(repoRoot, 'eval/jds/12-clio-senior-product-designer.txt'), 'utf8');

// Locate the function — start at "function extractJDMetadata", read until the
// matching closing brace at column 4 (function is indented 4 spaces inside an IIFE).
const startMarker = '    function extractJDMetadata(jd_raw, jd_clean) {';
const startIdx = appSrc.indexOf(startMarker);
if (startIdx < 0) { console.error('could not find extractJDMetadata start'); process.exit(2); }
// Find the matching "\n    }\n" that closes the function definition.
const after = appSrc.slice(startIdx);
const endRel = after.indexOf('\n    }\n');
if (endRel < 0) { console.error('could not find extractJDMetadata end'); process.exit(2); }
const fnSrc = after.slice(0, endRel + '\n    }'.length);

// Provide tiny shims for free identifiers the function may reference. Inspection
// of the function body shows it only depends on `normaliseLocation` — fall back
// to identity if missing.
const harness = `
  const normaliseLocation = (s) => s;
  ${fnSrc}
  module.exports = extractJDMetadata;
`;

// Eval in a CommonJS-ish context.
const mod = { exports: {} };
new Function('module', harness)(mod);
const extractJDMetadata = mod.exports;

const out = extractJDMetadata(fixture, fixture);
console.log(JSON.stringify(out, null, 2));
