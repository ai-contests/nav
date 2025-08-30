const { ModelScopeScraper } = require('../dist/scrapers/ModelScopeScraper');
const fakeConfig = { name: 'modelscope', baseUrl: 'https://modelscope.cn', selectors: {}, debugExtraction: false, delay: 0, contestListUrl: '', maxRetries: 1 };
const s = new ModelScopeScraper(fakeConfig);
console.log('parse ISO:', s.parseModelScopeDate('2025-09-21 14:59'));
console.log('parse chinese:', s.parseModelScopeDate('2024年12月02日'));
console.log('parse bad:', s.parseModelScopeDate('not a date'));
