// Fotografiert jede Entwurfsseite in Handy-Breite (390 px).
// Die Tafeln sind fest auf 1280 px gebaut; ein eingespritzter Umbau
// stapelt sie einspaltig und verkleinert Titel, Bilder und Abstände –
// so entsteht eine ehrliche Vorschau der mobilen Ansicht.
import { chromium } from 'playwright';

const alle = ['Duett','Duett-Angebote','Duett-Angebot','Duett-Aufnahme','Duett-Behoerden','Duett-Aktuell','Duett-Beitrag','Duett-Ueberuns','Mosaik','Mosaik-Angebote','Mosaik-Angebot','Mosaik-Aufnahme','Mosaik-Behoerden','Mosaik-Aktuell','Mosaik-Beitrag','Mosaik-Ueberuns','Nacht','Nacht-Angebote','Nacht-Angebot','Nacht-Aufnahme','Nacht-Behoerden','Nacht-Aktuell','Nacht-Beitrag','Nacht-Ueberuns','Horizont','Horizont-Angebote','Horizont-Angebot','Horizont-Aufnahme','Horizont-Behoerden','Horizont-Aktuell','Horizont-Beitrag','Horizont-Ueberuns','Panorama','Panorama-Angebote','Panorama-Angebot','Panorama-Aufnahme','Panorama-Behoerden','Panorama-Aktuell','Panorama-Beitrag','Panorama-Ueberuns'];
const files = process.argv.length > 2 ? process.argv.slice(2) : alle;
const OUT = '/tmp/claude-0/-home-user-Homepilot-Pro-neu/07679825-d258-5935-bd72-4876c5f47f1c/scratchpad/shots-mobil';

const umbau = () => {
  const stil = document.createElement('style');
  stil.textContent = `
    * { box-sizing: border-box !important; }
    x-dc > div { width: 390px !important; min-height: 0 !important; }
    [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
    [style*="grid-column"] { grid-column: auto !important; }
    img { max-width: 100% !important; }
  `;
  document.head.appendChild(stil);

  // Die Kopfnavigation wird zum Burger-Menü – sechs Menüpunkte nebeneinander
  // passen nie ehrlich in 390 Punkte («Über uns» brach mitten im Wort um).
  // Die stehende Menüliste im Duett-Kopf bleibt: Sie liest sich wie ein
  // geöffnetes Menü und bricht nicht.
  for (const nav of document.querySelectorAll('nav')) {
    if (getComputedStyle(nav).flexDirection === 'column') continue;
    for (const kind of [...nav.children]) kind.style.display = 'none';
    const burger = document.createElement('span');
    burger.textContent = '☰';
    burger.style.cssText = 'font-size: 24px; line-height: 1; color: inherit;';
    nav.appendChild(burger);
  }

  const px = (v) => parseFloat(v) || 0;
  for (const el of document.querySelectorAll('[style]')) {
    const s = el.style;
    const fs = px(s.fontSize);
    if (fs >= 40) s.fontSize = Math.round(fs * 0.55) + 'px';
    else if (fs >= 26) s.fontSize = Math.round(fs * 0.78) + 'px';
    if (el.tagName !== 'IMG' && s.width.endsWith('px') && px(s.width) >= 120) s.width = 'auto';
    if (el.tagName === 'IMG' && px(s.height) >= 180) s.height = Math.round(px(s.height) * 0.5) + 'px';
    for (const eigenschaft of ['padding', 'margin', 'gap', 'columnGap', 'left', 'right', 'bottom']) {
      const wert = s[eigenschaft];
      if (wert && /px/.test(wert)) {
        s[eigenschaft] = wert.replace(/(\d+(?:\.\d+)?)px/g, (t) => Math.min(parseFloat(t), 20) + 'px');
      }
    }
  }
  // Auch Masse aus Klassen (z. B. die Duett-Halbseite, Kachel-Polster) einfangen:
  for (const el of document.querySelectorAll('body *')) {
    const c = getComputedStyle(el);
    if (c.display === 'grid') el.style.gridTemplateColumns = '1fr';
    if (c.gridColumnStart.includes('span') || c.gridColumnEnd.includes('span')) el.style.gridColumn = 'auto';
    if (parseFloat(c.width) > 396 && c.position !== 'absolute') {
      el.style.maxWidth = '100%';
      if (c.flexShrink === '0') { el.style.width = '100%'; el.style.flex = 'none'; }
    }
    if (parseFloat(c.paddingLeft) > 24) el.style.paddingLeft = '18px';
    if (parseFloat(c.paddingRight) > 24) el.style.paddingRight = '18px';
    if (parseFloat(c.paddingTop) > 44) el.style.paddingTop = '28px';
    if (parseFloat(c.paddingBottom) > 44) el.style.paddingBottom = '28px';
    if (parseFloat(c.columnGap) > 20) el.style.columnGap = '14px';
  }
  // Zu breite Zeilen stapeln: reine Text-Leisten dürfen umbrechen, alles andere wird zur Spalte.
  for (let runde = 0; runde < 3; runde++) {
    for (const el of document.querySelectorAll('[style]')) {
      const c = getComputedStyle(el);
      if (c.display !== 'flex' || c.flexDirection !== 'row') continue;
      if (el.scrollWidth <= 396 && el.getBoundingClientRect().width <= 396) continue;
      const nurInline = [...el.children].every((k) => ['SPAN', 'A', 'IMG', 'NAV'].includes(k.tagName));
      if (nurInline) el.style.flexWrap = 'wrap';
      else { el.style.flexDirection = 'column'; el.style.alignItems = 'flex-start'; }
    }
  }
  // Letzte Korrektur: ragt danach noch etwas spürbar hinaus (die Mosaik-Kacheln
  // streifen die Kante nur um ~4 Punkte, das bleibt unsichtbar), wird die
  // nächste Flex-Zeile darüber gestapelt – z. B. die gequetschte
  // Beschreibungsspalte neben einem breiten Angebotstitel.
  for (const el of document.querySelectorAll('body *')) {
    if (el.getBoundingClientRect().right <= 402) continue;
    let z = el;
    while (z && z !== document.body) {
      const c = getComputedStyle(z);
      if (c.display === 'flex' && c.flexDirection === 'row') {
        z.style.flexDirection = 'column';
        z.style.alignItems = 'flex-start';
        break;
      }
      z = z.parentElement;
    }
  }
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const f of files) {
  const p = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
  await p.goto(`file:///home/user/sobe/entwuerfe/redesign/${f}.dc.html`);
  await p.waitForTimeout(300);
  await p.evaluate(umbau);
  await p.waitForTimeout(200);
  const breit = await p.evaluate(() => {
    const treffer = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > 398) treffer.push(el.tagName + '/' + (el.className || '') + ' ' + (el.getAttribute('style') || '').slice(0, 80) + ' b=' + Math.round(r.width));
    }
    return treffer.slice(0, 6);
  });
  console.log(f, breit.length ? 'UEBERLAUF:\n  ' + breit.join('\n  ') : 'ok');
  await p.screenshot({ path: `${OUT}/${f}.png`, fullPage: true });
  await p.close();
}
await b.close();
