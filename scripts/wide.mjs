import { chromium } from 'playwright';
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch();           // real GPU-less but 60fps, settles properly
const c = await b.newContext({ viewport: { width: 2380, height: 1230 } });
const p = await c.newPage();
await p.goto('http://localhost:3399/?nointro=1', { waitUntil: 'networkidle' });
await wait(3000);
for (const [i, name] of [[2,'alaari'],[3,'adire'],[4,'sanyan'],[5,'tuntun']]) {
  await p.evaluate(n => { const t = document.querySelector('.track').children[n];
    window.scrollTo(0, t.offsetTop + t.offsetHeight*0.4 - window.innerHeight*0.5); }, i);
  await wait(6000);
  // does any cloth pixel sit on top of the copy?
  const r = await p.evaluate(() => {
    const el = document.querySelector('.card .prose');
    const b = el.getBoundingClientRect();
    return { left: Math.round(b.left), right: Math.round(b.right), w: window.innerWidth,
             pct: Math.round(b.left / window.innerWidth * 100) };
  });
  console.log(name, JSON.stringify(r));
  await p.screenshot({ path: `/Users/sheyi/WebstormProjects/ala-film/wide_${name}.png` });
}
await b.close();
