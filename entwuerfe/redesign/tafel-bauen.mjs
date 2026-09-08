import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

// Reihenfolge der acht Seiten, in jeder Richtung identisch
const seiten = ['Startseite','Angebot','Angebot Sehen','Aufnahme','Gemeinden & Kanton','Aktuell','Beitrag','Über uns'];
const reihen = [
  { n: 1, files: ['Duett','Duett-Angebote','Duett-Angebot','Duett-Aufnahme','Duett-Behoerden','Duett-Aktuell','Duett-Beitrag','Duett-Ueberuns'] },
  { n: 2, files: ['Mosaik','Mosaik-Angebote','Mosaik-Angebot','Mosaik-Aufnahme','Mosaik-Behoerden','Mosaik-Aktuell','Mosaik-Beitrag','Mosaik-Ueberuns'] },
  { n: 3, files: ['Nacht','Nacht-Angebote','Nacht-Angebot','Nacht-Aufnahme','Nacht-Behoerden','Nacht-Aktuell','Nacht-Beitrag','Nacht-Ueberuns'] },
  { n: 4, files: ['Horizont','Horizont-Angebote','Horizont-Angebot','Horizont-Aufnahme','Horizont-Behoerden','Horizont-Aktuell','Horizont-Beitrag','Horizont-Ueberuns'] },
  { n: 5, files: ['Panorama','Panorama-Angebote','Panorama-Angebot','Panorama-Aufnahme','Panorama-Behoerden','Panorama-Aktuell','Panorama-Beitrag','Panorama-Ueberuns'] },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const hoehen = {};
for (const r of reihen) for (const f of r.files) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`file:///home/user/sobe/entwuerfe/redesign/${f}.dc.html`);
  await p.waitForTimeout(350);
  const h = await p.evaluate(() => document.querySelector('x-dc > div').getBoundingClientRect().height);
  const fehlend = await p.evaluate(() => [...document.querySelectorAll('img')].filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src')));
  hoehen[f] = Math.ceil(h / 10) * 10;
  console.log(f, hoehen[f], fehlend.length ? 'FEHLENDE BILDER: ' + fehlend.join(',') : '', errs.join(';'));
  await p.close();
}
await b.close();

const artboards = [];
let y = 0;
const reihenY = [];
for (const r of reihen) {
  reihenY.push(y);
  let max = 0;
  r.files.forEach((f, i) => {
    const h = hoehen[f];
    max = Math.max(max, h);
    artboards.push({ file: f + '.dc.html', title: `${r.n} · ${seiten[i]}`, x: i * 1420, y, w: 1280, h });
  });
  y += max + 420;
}

const thesen = [
  "1 · Duett\n\nMotivation: Geteilter Bildschirm – links steht das Haus als petrolfarbene Halbseite mit grosser Aussage und Navigation fest, rechts fliesst der Inhalt. Ruhig, geführt, wie eine moderne digitale Broschüre.\n\nPreis: Die linke Hälfte bindet Platz; auf dem Handy wird sie zum Kopfbereich über dem Inhalt.",
  "2 · Mosaik\n\nMotivation: Baukasten-Layout wie eine moderne App – abgerundete Kacheln bündeln je ein Anliegen, schwebende Pillen-Navigation, weiche Schatten. Wirkt frisch, aufgeräumt und sehr heutig.\n\nPreis: Kacheln verleiten zu Häppchen – lange Inhalte brauchen redaktionelle Disziplin. Die Ordnung steckt in Grösse und Lage der Kacheln und geht verloren, sobald sie untereinander stehen.",
  "3 · Nachtmodus\n\nMotivation: Dunkler, kontrastreicher Auftritt mit leuchtendem Gelb – hebt sich von allen Schul-Webseiten ab, modern wie eine Streaming-Plattform; die Fotos leuchten auf dunklem Grund.\n\nPreis: Ungewohnt mutig für eine soziale Institution; die Kontraste sind eingeplant, müssen aber konsequent gepflegt werden.",
  "4 · Horizont (unsere Empfehlung)\n\nMotivation: Weicher Farbverlauf in den Hausfarben als grosse abgerundete Bühne, schwebende Karten mit sanften Schatten, getönte Bänder – die wärmste, freundlichste der modernen Richtungen. Im Gerüst bewusst gewöhnlich: Was man sieht, ist auch die Reihenfolge im Quelltext, und die Seite hält starke Vergrösserung aus. Neue Inhalte fügen sich als weitere Karte in ein bestehendes Band.\n\nPreis: Braucht Sorgfalt, damit es leicht bleibt und nicht überladen wirkt.",
  "5 · Panorama\n\nMotivation: Jede Seite beginnt mit einem grossen Foto und schwebendem Glas-Kopf (Milchglas-Effekt) – Bildwelt zuerst, modern wie aktuelle Kultur- und Hotelwebseiten; Emotion trägt die Inhalte.\n\nPreis: Braucht laufend gute Fotos; der Text beginnt erst nach dem Bild.",
];
const annotations = [
  { id: 'einleitung', x: -560, y: 0, w: 470, text: "Fünf Richtungen für das Redesign von sonnenberg-baar.ch – jede als eigene Reihe mit denselben acht Seiten: Startseite, Angebot, Angebot Sehen, Aufnahme, Gemeinden & Kanton, Aktuell, Beitrag, Über uns. So lassen sich die Richtungen Seite für Seite direkt vergleichen.\n\nGemeinsame Basis: die echten Sonnenberg-Farben (Petrol, Nachtblau, Gelb), das echte Logo, echte Fotos und Texte, ein Menü mit 4–5 Punkten statt heute 8+.\n\nDie Zettel am Reihenanfang nennen Motivation und Preis jeder Richtung. Die Richtungen lassen sich auch mischen." },
  ...thesen.map((text, i) => ({ id: `these-${i + 1}`, x: 0, y: reihenY[i] - 280, w: 420, text })),
];

writeFileSync('/home/user/sobe/entwuerfe/redesign/canvas.json', JSON.stringify({ artboards, annotations, launch: { view: 'canvas' } }, null, 2) + '\n');
console.log('canvas.json geschrieben,', artboards.length, 'Tafeln, Gesamthöhe', y - 420);
