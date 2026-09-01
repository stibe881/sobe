// Barrierefreiheits-Prüflauf für die Auslieferung: axe-core gegen
// WCAG 2.1 A/AA und WCAG 2.2 AA über repräsentative Seiten. Bricht
// mit Fehlercode ab, sobald eine Seite einen Verstoss hat – ein
// Rückschritt soll die Veröffentlichung stoppen, nicht live gehen.
//
// Aufruf:  node a11y-pruefung.js [basis-url]
// Vorher:  npm install (in diesem Ordner) und ein Webserver auf der
//          statischen Webseite, z. B.
//          cd ../statisch && python3 -m http.server 8189
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASIS = process.argv[2] || 'http://127.0.0.1:8189';
const AXE = fs.readFileSync(
  path.join(__dirname, 'node_modules/axe-core/axe.min.js'), 'utf-8');

// Ein Vertreter jedes Seitentyps; dazu die beiden selbst gebauten
// Seiten (Erklärung, 404), die kein WordPress-Export je erneuert.
const SEITEN = [
  '/', '/angebot/', '/angebot/sehen/', '/angebot/verhalten-plus/',
  '/kompetenzen/', '/ueber-uns/organisation/', '/aufnahme/',
  '/jobs/', '/medien/', '/kontakt/', '/shop/',
  '/produkt/kinderbuch-beno-und-flecki/',
  '/mitarbeiter/stefan-gross/', '/skilager-in-arosa/',
  '/impressum/', '/datenschutzerklaerung/',
  '/barrierefreiheit/', '/suche/', '/404.html',
];

(async () => {
  // Lokal steht der Browser unter /opt/pw-browsers, in der CI dort,
  // wo «playwright install» ihn hinlegt.
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let verstoesse = 0;

  for (const pfad of SEITEN) {
    const antwort = await page.goto(BASIS + pfad, { waitUntil: 'networkidle', timeout: 30000 })
      .catch(() => null);
    if (!antwort || (antwort.status() >= 400 && pfad !== '/404.html')) {
      console.log(`FEHLER ${pfad}: Seite lädt nicht (${antwort ? antwort.status() : 'timeout'})`);
      verstoesse++;
      continue;
    }
    await page.waitForTimeout(400);
    await page.evaluate(AXE);
    const resultat = await page.evaluate(async () => await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      resultTypes: ['violations'],
    }));
    if (resultat.violations.length === 0) {
      console.log(`ok      ${pfad}`);
    } else {
      for (const v of resultat.violations) {
        verstoesse++;
        console.log(`VERSTOSS ${pfad}: [${v.impact}] ${v.id} – ${v.help} (${v.nodes.length} Element(e))`);
        for (const n of v.nodes.slice(0, 3)) {
          console.log(`         ${n.html.replace(/\s+/g, ' ').slice(0, 140)}`);
        }
      }
    }
  }
  await browser.close();

  if (verstoesse > 0) {
    console.log(`\n${verstoesse} Verstoss/Verstösse – Veröffentlichung stoppen.`);
    process.exit(1);
  }
  console.log('\nAlle Seiten ohne Verstoss gegen WCAG 2.1/2.2 AA (automatisiert prüfbar).');
})();
