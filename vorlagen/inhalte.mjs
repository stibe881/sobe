// Liest die redaktionellen Inhalte aus quelle/ – dieselben Dateien, die das
// Redaktionssystem bearbeitet.
//
// Zwei Formate kommen vor: Neue Einträge sind .md mit einfachem Vorspann
// («---», Zeilen der Form «schlüssel: wert»). Die aus WordPress übernommenen
// Einträge sind .html mit JSON-Vorspann («---json»). Beide werden hier
// gelesen, damit kein Beitrag verloren geht.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export function vorspannLesen(text) {
  let treffer = text.match(/^---json\s*\n([\s\S]*?)\n---\s*\n?/);
  if (treffer) {
    let daten = {};
    try { daten = JSON.parse(treffer[1]); } catch { /* unbrauchbarer Vorspann */ }
    return { daten, rumpf: text.slice(treffer[0].length), ausWordpress: true };
  }
  treffer = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (treffer) {
    const daten = {};
    for (const zeile of treffer[1].split('\n')) {
      const paar = zeile.match(/^([A-Za-zäöü_]+):\s*(.*)$/);
      if (!paar) continue;
      let wert = paar[2].trim().replace(/^"(.*)"$/, '$1');
      if (/^\[.*\]$/.test(wert)) {
        try { wert = JSON.parse(wert); } catch { /* bleibt Text */ }
      }
      daten[paar[1]] = wert;
    }
    return { daten, rumpf: text.slice(treffer[0].length), ausWordpress: false };
  }
  return { daten: {}, rumpf: text, ausWordpress: false };
}

const alsListe = (wert) => {
  if (Array.isArray(wert)) return wert;
  if (typeof wert === 'string' && wert.trim()) return wert.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
};

export async function sammlungLesen(wurzel, ordner) {
  const verzeichnis = path.join(wurzel, 'quelle', ordner);
  if (!existsSync(verzeichnis)) return [];
  const dateien = (await readdir(verzeichnis))
    .filter((d) => d.endsWith('.md') || d.endsWith('.html'));

  const eintraege = [];
  for (const datei of dateien) {
    const text = await readFile(path.join(verzeichnis, datei), 'utf8');
    const { daten, rumpf, ausWordpress } = vorspannLesen(text);
    eintraege.push({
      kennung: datei.replace(/\.(md|html)$/, ''),
      datei,
      markdown: datei.endsWith('.md'),
      ausWordpress,
      rumpf: rumpf.trim(),
      ...daten,
      kategorien: alsListe(daten.kategorien),
      reihenfolge: Number(daten.reihenfolge ?? 0),
    });
  }
  return eintraege;
}

// Sehr kleiner Markdown-Umsetzer: Absätze, Listen, Fett, Kursiv, Verweise.
// Mehr braucht die Redaktion in einem Beitragstext nicht, und so bleibt das
// Projekt ohne Fremdpakete.
export function markdownZuHtml(text) {
  const schuetzen = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => schuetzen(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  const teile = [];
  let liste = null;
  for (const block of text.split(/\n\s*\n/)) {
    const zeilen = block.split('\n').map((z) => z.trim()).filter(Boolean);
    if (!zeilen.length) continue;
    if (zeilen.every((z) => /^[-*]\s+/.test(z))) {
      teile.push('<ul>' + zeilen.map((z) => `<li>${inline(z.replace(/^[-*]\s+/, ''))}</li>`).join('') + '</ul>');
      continue;
    }
    const ueberschrift = zeilen[0].match(/^(#{2,3})\s+(.*)$/);
    if (ueberschrift && zeilen.length === 1) {
      const stufe = ueberschrift[1].length;
      teile.push(`<h${stufe}>${inline(ueberschrift[2])}</h${stufe}>`);
      continue;
    }
    teile.push(`<p>${inline(zeilen.join(' '))}</p>`);
  }
  return teile.join('\n');
}

// Aus dem WordPress-Markup bleibt nur der lesbare Teil: Absätze, Listen,
// Überschriften, Verweise. Die Fusion-Gerüste fallen weg – im neuen Auftritt
// würden sie nur stören.
export function wordpressAufraeumen(html) {
  const erlaubt = [];
  const regel = /<(p|h2|h3|h4|ul|ol|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let treffer;
  while ((treffer = regel.exec(html))) {
    const marke = treffer[1].toLowerCase();
    if (marke === 'li') continue; // kommt über die Liste mit
    const inhalt = treffer[2]
      .replace(/<(?!\/?(a|strong|em|b|i|br|li|ul|ol)\b)[^>]*>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!inhalt || inhalt === '&nbsp;') continue;
    erlaubt.push(`<${marke}>${inhalt}</${marke}>`);
  }
  return erlaubt.join('\n');
}
