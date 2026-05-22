const ORIGIN = 'https://portal.incorpus.in';
const app = await fetch(ORIGIN + '/static/js/app.b01d8da3f1fad6d81a5f.js').then((r) => r.text());

// Find client DID portal route
const routes = [...app.matchAll(/path:"([^"]*did[^"]*)"/gi)].map((m) => m[1]);
console.log('did routes:', [...new Set(routes)].slice(0, 30));

// Find chunk for mydid / buy did
let idx = 0;
while ((idx = app.indexOf('clientFreeDids', idx + 1)) !== -1) {
  console.log('\nclientFreeDids @', idx);
  console.log(app.slice(idx - 200, idx + 400).replace(/\s+/g, ' '));
}

idx = 0;
while ((idx = app.indexOf('search_local', idx + 1)) !== -1 && idx < 800000) {
  const snip = app.slice(idx - 100, idx + 200);
  if (snip.includes('getEndpoint') || snip.includes('did_api')) {
    console.log('\nsearch_local @', idx, ':', snip.replace(/\s+/g, ' '));
  }
}
