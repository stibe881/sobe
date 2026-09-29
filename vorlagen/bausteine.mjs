// Wandelt die Inhalts-Bausteine in HTML. Jede Art hat genau eine Funktion –
// wer eine neue Art braucht, ergänzt hier eine und im Redaktionssystem das
// passende Formular.

export const schuetzen = (wert) => String(wert ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const datumLang = (iso) => {
  const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
    'August', 'September', 'Oktober', 'November', 'Dezember'];
  const [j, m, t] = iso.split('-').map(Number);
  return `${t}. ${monate[m - 1]} ${j}`;
};

const spalte = (b) => `s${b.spalten || 6}`;
const farbe = (b) => (b.farbe ? ` ${b.farbe}` : '');

const verweis = (l, e) => {
  if (l.nurText) return `<span class="fliess">${schuetzen(l.titel)}</span>`;
  if (!l.pfad) return `<span class="fliess" title="Noch nicht hinterlegt">${schuetzen(l.titel)}</span>`;
  return `<a href="${schuetzen(l.pfad)}">${schuetzen(l.titel)}</a>`;
};

const arten = {
  held: (b) => `<div class="kachel petrol ${spalte(b)}">
        ${b.marke ? `<p class="marke">${b.markeZiel ? `<a href="${schuetzen(b.markeZiel)}">${schuetzen(b.marke)}</a>` : schuetzen(b.marke)}</p>` : ''}
        <h1 class="held"${b.marke ? ' style="margin-top: 8px;"' : ''}>${schuetzen(b.titel)}</h1>
        ${b.text ? `<p class="fliess" style="margin-top: 12px; font-size: 18px;">${schuetzen(b.text)}</p>` : ''}
        ${b.knopf ? `<p style="margin-top: 20px;"><a class="knopf gelb" href="${schuetzen(b.knopf.pfad)}">${schuetzen(b.knopf.titel)}</a></p>` : ''}
      </div>`,

  bild: (b) => `<div class="kachel bild ${spalte(b)}"><img src="/bilder/${schuetzen(b.quelle)}" alt="${schuetzen(b.alt)}" loading="lazy"></div>`,

  kachel: (b, hilfe) => {
    const titel = b.ziel ? `<a href="${schuetzen(b.ziel)}">${schuetzen(b.titel)}</a>` : schuetzen(b.titel);
    return `<div class="kachel ${spalte(b)}${farbe(b)}${b.ziel ? ' klickbar' : ''}"${b.ziel ? ` data-ziel="${schuetzen(b.ziel)}"` : ''}>
        <h2>${titel}</h2>
        ${b.text ? `<p class="fliess" style="margin-top: 8px;">${schuetzen(b.text)}</p>` : ''}
        ${b.links?.length ? `<div class="liste">${b.links.map((l) => verweis(l, hilfe)).join('')}</div>` : ''}
      </div>`;
  },

  text: (b) => `<div class="kachel ${spalte(b)}${farbe(b)}">
        ${b.titel ? `<h2>${schuetzen(b.titel)}</h2>` : ''}
        ${b.marke ? `<p class="marke" style="margin-top: 6px; font-size: 12.5px;">${schuetzen(b.marke)}</p>` : ''}
        ${(b.absaetze || []).map((a) => `<p class="fliess" style="margin-top: 12px;">${schuetzen(a)}</p>`).join('')}
      </div>`,

  schritt: (b) => `<div class="kachel ${spalte(b)}">
        <p class="nummer">${schuetzen(b.nummer)}</p>
        <h2 style="margin-top: 6px;">${schuetzen(b.titel)}</h2>
        <p class="fliess" style="margin-top: 8px;">${schuetzen(b.text)}</p>
      </div>`,

  person: (b, { einstellungen }) => `<div class="kachel ${spalte(b)}">
        <h2>${schuetzen(b.titel)}</h2>
        <p style="margin-top: 10px; font-weight: 700;">${schuetzen(b.name)}</p>
        <p class="fliess" style="margin-top: 4px;"><a href="mailto:${schuetzen(b.mail)}">${schuetzen(b.mail)}</a> · <a href="tel:${schuetzen(einstellungen.telefonWahl)}">${schuetzen(einstellungen.telefon)}</a></p>
      </div>`,

  dokumente: (b) => `<div class="kachel ${spalte(b)}">
        <h2>${schuetzen(b.titel)}</h2>
        <div style="margin-top: 8px;">${(b.eintraege || []).map((d) => `
          <div class="reihe"><div class="inhalt">${d.datei ? `<a href="/dateien/${schuetzen(d.datei)}">${schuetzen(d.titel)}</a>` : `<span class="fliess">${schuetzen(d.titel)}</span>`}</div><div class="datum" style="width: auto; text-align: right;">PDF</div></div>`).join('')}
        </div>
      </div>`,

  aufruf: (b) => `<div class="kachel ${spalte(b)}${farbe(b)}">
        <div class="paar" style="justify-content: space-between;">
          <h2 class="gross" style="max-width: 34ch;">${schuetzen(b.titel)}</h2>
          ${b.knopf ? `<a class="knopf" href="${schuetzen(b.knopf.pfad)}">${schuetzen(b.knopf.titel)}</a>` : ''}
        </div>
        ${b.text ? `<p class="fliess" style="margin-top: 12px;">${schuetzen(b.text)}</p>` : ''}
        ${b.zweitlink ? `<p style="margin-top: 12px;"><a href="${schuetzen(b.zweitlink.pfad)}">${schuetzen(b.zweitlink.titel)}</a></p>` : ''}
      </div>`,

  kontakt: (b, { einstellungen }) => {
    const mail = b.intake ? einstellungen.mailIntake : einstellungen.mail;
    const dunkel = b.farbe === 'gelb' ? ' style="color: var(--nacht);"' : '';
    return `<div class="kachel ${spalte(b)}${farbe(b)}">
        <h2>${schuetzen(b.titel)}</h2>
        ${b.text ? `<p style="margin-top: 8px;">${schuetzen(b.text)}</p>` : ''}
        <p class="tel" style="margin-top: 10px;"><a href="tel:${schuetzen(einstellungen.telefonWahl)}"${dunkel}>${schuetzen(einstellungen.telefon)}</a></p>
        <p style="margin-top: 4px;"><a href="mailto:${schuetzen(mail)}"${dunkel}>${schuetzen(mail)}</a></p>
        ${b.adresse ? `<p style="margin-top: 8px;">${schuetzen(einstellungen.adresse)}</p>` : ''}
      </div>`;
  },

  beitraege: (b, { beitraege }) => {
    const liste = b.alle ? beitraege : beitraege.slice(0, b.anzahl || 3);
    if (b.alle) {
      const [erster, ...rest] = liste;
      return `<div class="kachel bild s3" style="display: flex; flex-direction: column; padding: 0;">
        ${erster.bild ? `<img src="/bilder/${schuetzen(erster.bild)}" alt="${schuetzen(erster.bildAlt)}" style="height: 220px; min-height: 0;" loading="lazy">` : ''}
        <div style="padding: 22px 26px 26px;">
          <p class="marke" style="font-size: 12.5px;">${datumLang(erster.datum)}</p>
          <h2 style="margin-top: 6px;"><a href="/aktuell/${schuetzen(erster.kennung)}/">${schuetzen(erster.titel)}</a></h2>
        </div>
      </div>
      <div class="kachel s3">
        ${rest.map((p) => `<div class="reihe"><div class="datum">${datumLang(p.datum)}</div><div class="inhalt"><a href="/aktuell/${schuetzen(p.kennung)}/">${schuetzen(p.titel)}</a></div></div>`).join('')}
      </div>`;
    }
    return `<div class="kachel ${spalte(b)}">
        <div class="paar" style="justify-content: space-between;">
          <h2>${schuetzen(b.titel)}</h2>
          ${b.mehr ? `<a href="${schuetzen(b.mehr.pfad)}">${schuetzen(b.mehr.titel)}</a>` : ''}
        </div>
        <div style="margin-top: 10px;">${liste.map((p) => `
          <div class="reihe"><div class="datum">${datumLang(p.datum)}</div><div class="inhalt"><a href="/aktuell/${schuetzen(p.kennung)}/">${schuetzen(p.titel)}</a></div></div>`).join('')}
        </div>
      </div>`;
  },

  stellen: (b, { stellen }) => {
    const bereiche = [...new Set(stellen.map((s) => s.bereich).filter(Boolean))];
    const entwurf = stellen.some((s) => s.entwurf === true || s.entwurf === 'true');
    return `<div class="kachel ${spalte(b)}">
        <div class="paar" style="justify-content: space-between; align-items: baseline;">
          <h2>${schuetzen(b.titel)}</h2>
          <p class="marke" id="anzahl" aria-live="polite"></p>
        </div>
        <div class="filterzeile">
          <button type="button" class="filter" data-bereich="alle" aria-pressed="false">Alle</button>
          ${bereiche.map((x) => `<button type="button" class="filter" data-bereich="${schuetzen(x)}" aria-pressed="false">${schuetzen(x)}</button>`).join('')}
        </div>
        <div style="margin-top: 6px;">${stellen.map((s) => `
          <div class="reihe stelle" data-bereich="${schuetzen(s.bereich || 'alle')}">
            <div class="inhalt">
              ${s.bereich ? `<p class="marke" style="font-size: 12px;">${schuetzen(s.bereich)}</p>` : ''}
              <span style="font-size: 18px; font-weight: 700;"><a href="/jobs/${schuetzen(s.kennung)}/">${schuetzen(s.titel)}</a></span>
            </div>
            <div class="datum" style="width: auto; text-align: right; min-width: 140px;">${schuetzen([s.pensum, s.eintritt && 'Eintritt ' + s.eintritt].filter(Boolean).join(' · '))}</div>
          </div>`).join('')}
        </div>
        <p id="leer" class="fliess" style="margin-top: 14px;" hidden>In diesem Bereich ist zurzeit keine Stelle ausgeschrieben.</p>
        ${entwurf ? '<p class="hinweis">Einzelne Ausschreibungen sind noch als Entwurf hinterlegt.</p>' : ''}
      </div>`;
  },

  rohtext: (b) => `<div class="kachel ${spalte(b)}${farbe(b)}">
        ${b.marke ? `<p class="marke">${schuetzen(b.marke)}</p>` : ''}
        ${b.titel ? `<h1 class="gross" style="margin-top: 8px;">${schuetzen(b.titel)}</h1>` : ''}
        <div class="lauftext">${b.html || ''}</div>
      </div>`,

  hinweis: (b) => `<div class="kachel ${spalte(b)}"><p class="hinweis" style="margin: 0;">${schuetzen(b.text)}</p></div>`,
};

export function baustein(b, hilfe) {
  const bauen = arten[b.art];
  if (!bauen) throw new Error(`Unbekannte Baustein-Art: ${b.art}`);
  return bauen(b, hilfe);
}

export { datumLang };
