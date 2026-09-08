// Erzeugt praesentation.pdf aus praesentation.html.
//
// Zwei Fallstricke, die je einen Anlauf gekostet haben:
// - Die Google-Schriften im <link> laufen im Sandbox-Netz ins Leere und
//   halten den Seitenaufbau offen; darum werden externe Anfragen gesperrt.
//   Die Ersatzschriften der CSS-Kette (Georgia, Segoe UI) genügen.
// - Die Galeriebilder tragen loading="lazy". Ohne erzwungenes Laden landen
//   nur die sichtbaren acht von 96 Aufnahmen im PDF.
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const seite = await browser.newPage({ viewport: { width: 1100, height: 1400 } });

await seite.route('**', (route) => {
  const url = route.request().url();
  (url.startsWith('file:') || url.startsWith('data:')) ? route.continue() : route.abort();
});

await seite.goto('file:///home/user/sobe/entwuerfe/redesign/praesentation.html', {
  waitUntil: 'domcontentloaded', timeout: 60000,
});

const geladen = await seite.evaluate(async () => {
  const bilder = [...document.images];
  for (const bild of bilder) bild.loading = 'eager';
  await Promise.all(bilder.map((b) => (b.complete ? Promise.resolve() : b.decode().catch(() => {}))));
  return bilder.filter((b) => b.naturalWidth > 0).length + ' / ' + bilder.length;
});

await seite.emulateMedia({ media: 'print' });
await seite.waitForTimeout(1500);
await seite.pdf({
  path: '/home/user/sobe/entwuerfe/redesign/praesentation.pdf',
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
console.log('Bilder geladen:', geladen, '– praesentation.pdf geschrieben');
