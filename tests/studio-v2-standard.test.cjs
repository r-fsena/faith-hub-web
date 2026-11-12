const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const moduleObject = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/studioNavigation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: moduleObject, exports: moduleObject.exports, URL });
const { canonicalStudioUrl, STUDIO_VERSION } = moduleObject.exports;
test('Studio has only the standard v2 version', () => assert.equal(STUDIO_VERSION, 'v2'));
test('old version links retain destination and campaign while dropping the version selector', () => {
  for (const version of ['v1', 'v2', 'unknown']) {
    const url = canonicalStudioUrl(`https://studio.faithhubs.com/?studio=${version}&tab=membros&utm_source=lp#cadastro`);
    assert.equal(url.searchParams.has('studio'), false); assert.equal(url.searchParams.get('tab'), 'membros'); assert.equal(url.searchParams.get('utm_source'), 'lp'); assert.equal(url.hash, '#cadastro');
  }
});
test('public proposals and PWA preview parameters survive normalization', () => {
  const url = canonicalStudioUrl('https://studio.faithhubs.com/?studio=v1&proposta=example-token&pwa_preview=1&organization_id=org-example');
  assert.equal(url.searchParams.get('proposta'), 'example-token'); assert.equal(url.searchParams.get('pwa_preview'), '1'); assert.equal(url.searchParams.get('organization_id'), 'org-example');
});
test('normalization is idempotent and does not add version parameters to new links', () => {
  const first = canonicalStudioUrl('https://studio.faithhubs.com/?tab=dashboard');
  assert.equal(canonicalStudioUrl(first.href).href, first.href); assert.equal(first.searchParams.has('studio'), false);
});
