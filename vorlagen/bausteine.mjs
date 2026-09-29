// Wandelt die Inhalts-Bausteine in HTML. Jede Art hat genau eine Funktion –
// wer eine neue Art braucht, ergänzt hier eine und im Redaktionssystem das
// passende Formular.

import { datumLang, pfadFuer } from './sprache.mjs';

export const schuetzen = (wert) => String(wert ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');


const spalte = (b) => `s${b.spalten || 6}`;
const farbe = (b) => (b.farbe ? ` ${b.farbe}` : '');

const verweis = (l, hilfe) => {
  const t = hilfe?.t || ((x) => x);
  if (l.nurText) return `<span class="fliess">${schuetzen(l.titel)}</span>`;
  if (!l.pfad) return `<span class="fliess" title="${schuetzen(t('Noch nicht hinterlegt'))}">${schuetzen(l.titel)}</span>`;
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

  beitraege: (b, hilfe) => {
    const { beitraege, sprache } = hilfe;
    const zu = (k) => pfadFuer(`/aktuell/${k}/`, sprache);
    const liste = b.alle ? beitraege : beitraege.slice(0, b.anzahl || 3);
    if (b.alle) {
      const [erster, ...rest] = liste;
      return `<div class="kachel bild s3" style="display: flex; flex-direction: column; padding: 0;">
        ${erster.bild ? `<img src="/bilder/${schuetzen(erster.bild)}" alt="${schuetzen(erster.bildAlt)}" style="height: 220px; min-height: 0;" loading="lazy">` : ''}
        <div style="padding: 22px 26px 26px;">
          <p class="marke" style="font-size: 12.5px;">${datumLang(erster.datum, sprache)}</p>
          <h2 style="margin-top: 6px;"><a href="${schuetzen(zu(erster.kennung))}">${schuetzen(erster.titel)}</a></h2>
        </div>
      </div>
      <div class="kachel s3">
        ${rest.map((p) => `<div class="reihe"><div class="datum">${datumLang(p.datum, sprache)}</div><div class="inhalt"><a href="${schuetzen(zu(p.kennung))}">${schuetzen(p.titel)}</a></div></div>`).join('')}
      </div>`;
    }
    return `<div class="kachel ${spalte(b)}">
        <div class="paar" style="justify-content: space-between;">
          <h2>${schuetzen(b.titel)}</h2>
          ${b.mehr ? `<a href="${schuetzen(b.mehr.pfad)}">${schuetzen(b.mehr.titel)}</a>` : ''}
        </div>
        <div style="margin-top: 10px;">${liste.map((p) => `
          <div class="reihe"><div class="datum">${datumLang(p.datum, sprache)}</div><div class="inhalt"><a href="${schuetzen(zu(p.kennung))}">${schuetzen(p.titel)}</a></div></div>`).join('')}
        </div>
      </div>`;
  },

  stellen: (b, hilfe) => {
    const { stellen, t, sprache } = hilfe;
    const bereiche = [...new Set(stellen.map((s) => s.bereich).filter(Boolean))];
    const entwurf = stellen.some((s) => s.entwurf === true || s.entwurf === 'true');
    return `<div class="kachel ${spalte(b)}">
        <div class="paar" style="justify-content: space-between; align-items: baseline;">
          <h2>${schuetzen(b.titel)}</h2>
          <p class="marke" id="anzahl" aria-live="polite"></p>
        </div>
        <div class="filterzeile">
          <button type="button" class="filter" data-bereich="alle" aria-pressed="false">${schuetzen(t('Alle'))}</button>
          ${bereiche.map((x) => `<button type="button" class="filter" data-bereich="${schuetzen(x)}" aria-pressed="false">${schuetzen(x)}</button>`).join('')}
        </div>
        <div style="margin-top: 6px;">${stellen.map((s) => `
          <div class="reihe stelle" data-bereich="${schuetzen(s.bereich || 'alle')}">
            <div class="inhalt">
              ${s.bereich ? `<p class="marke" style="font-size: 12px;">${schuetzen(s.bereich)}</p>` : ''}
              <span style="font-size: 18px; font-weight: 700;"><a href="${schuetzen(pfadFuer(`/jobs/${s.kennung}/`, sprache))}">${schuetzen(s.titel)}</a></span>
            </div>
            <div class="datum" style="width: auto; text-align: right; min-width: 140px;">${schuetzen([s.pensum, s.eintritt && t('Eintritt') + ' ' + s.eintritt].filter(Boolean).join(' · '))}</div>
          </div>`).join('')}
        </div>
        <p id="leer" class="fliess" style="margin-top: 14px;" hidden>${schuetzen(t('In diesem Bereich ist zurzeit keine Stelle ausgeschrieben.'))}</p>
        ${entwurf ? `<p class="hinweis">${schuetzen(t('Einzelne Ausschreibungen sind noch als Entwurf hinterlegt.'))}</p>` : ''}
      </div>`;
  },

  rohtext: (b) => `<div class="kachel ${spalte(b)}${farbe(b)}">
        ${b.marke ? `<p class="marke">${schuetzen(b.marke)}</p>` : ''}
        ${b.titel ? `<h1 class="gross" style="margin-top: 8px;">${schuetzen(b.titel)}</h1>` : ''}
        <div class="lauftext">${b.html || ''}</div>
      </div>`,

  // ------------------------------------------------------------------ Shop
  //
  // Preise werden hier nur angezeigt. Gerechnet wird beim Bestellen auf dem
  // Server, aus den Produktdateien – was der Browser schickt, ist ein Wunsch,
  // keine Rechnung. Sonst könnte jemand den Preis im Warenkorb ändern.
  produkte: (b, hilfe) => {
    const { produkte, t, sprache, geld } = hilfe;
    const sichtbar = produkte.filter((p) => !p.entwurf);
    const kategorien = [...new Set(sichtbar.map((p) => p.kategorie).filter(Boolean))];
    if (!sichtbar.length) {
      return `<div class="kachel ${spalte(b)}">
        <h2>${schuetzen(b.titel || t('Shop'))}</h2>
        <p class="fliess" style="margin-top: 10px;">${schuetzen(t('Zurzeit ist nichts im Angebot.'))}</p>
      </div>`;
    }
    return `<div class="kachel ${spalte(b)}">
        <div class="paar" style="justify-content: space-between; align-items: baseline;">
          <h2>${schuetzen(b.titel || t('Shop'))}</h2>
          <p class="marke" id="anzahl-produkte" aria-live="polite"></p>
        </div>
        ${kategorien.length > 1 ? `<div class="filterzeile">
          <button type="button" class="filter" data-kategorie="alle" aria-pressed="false">${schuetzen(t('Alle'))}</button>
          ${kategorien.map((k) => `<button type="button" class="filter" data-kategorie="${schuetzen(k)}" aria-pressed="false">${schuetzen(k)}</button>`).join('')}
        </div>` : ''}
        <div class="regal">${sichtbar.map((p) => `
          <a class="ware" href="${schuetzen(pfadFuer(`/shop/${p.kennung}/`, sprache))}" data-kategorie="${schuetzen(p.kategorie || '')}">
            ${p.bild ? `<img src="${schuetzen(p.bild.charAt(0) === '/' ? p.bild : '/bilder/' + p.bild)}" alt="${schuetzen(p.bildAlt || '')}" loading="lazy">`
              : '<span class="warebildlos" aria-hidden="true"></span>'}
            <span class="waretext">
              <span class="warename">${schuetzen(p.titel)}</span>
              ${p.kurz ? `<span class="warekurz">${schuetzen(p.kurz)}</span>` : ''}
              <span class="warepreis">${schuetzen(geld(p.preis))}</span>
              ${p.lager === 0 ? `<span class="wareaus">${schuetzen(t('Zurzeit nicht lieferbar'))}</span>` : ''}
            </span>
          </a>`).join('')}
        </div>
        <p id="regal-leer" class="fliess" style="margin-top: 14px;" hidden>${schuetzen(t('In dieser Kategorie ist zurzeit nichts im Angebot.'))}</p>
      </div>`;
  },

  produkt: (b, hilfe) => {
    const { t, geld, shop } = hilfe;
    const p = b.produkt;
    const aus = p.lager === 0;
    return `<div class="kachel ${spalte(b)} produktkachel">
        ${p.kategorie ? `<p class="marke">${schuetzen(p.kategorie)}</p>` : ''}
        <h1 class="gross" style="margin-top: 8px;">${schuetzen(p.titel)}</h1>
        ${p.kurz ? `<p class="fliess" style="margin-top: 10px;">${schuetzen(p.kurz)}</p>` : ''}
        <p class="produktpreis">${schuetzen(geld(p.preis))}</p>
        <form class="inwarenkorb" data-kennung="${schuetzen(p.kennung)}"${aus ? ' data-aus="ja"' : ''}>
          ${p.varianten?.length ? `<p class="feld">
            <label for="variante">${schuetzen(t('Ausführung'))}</label>
            <select id="variante" name="variante">${p.varianten.map((v) => `<option value="${schuetzen(v)}">${schuetzen(v)}</option>`).join('')}</select>
          </p>` : ''}
          <p class="feld" style="max-width: 130px;">
            <label for="anzahl">${schuetzen(t('Anzahl'))}</label>
            <input id="anzahl" name="anzahl" type="number" min="1" step="1" value="1"${
              p.lager > 0 ? ` max="${p.lager}"` : ''} inputmode="numeric">
          </p>
          ${aus
            ? `<p class="hinweis" style="margin: 0;">${schuetzen(t('Zurzeit nicht lieferbar'))}</p>`
            : `<button class="knopf spende" type="submit">${schuetzen(t('In den Warenkorb'))}</button>`}
          <p class="fliess kleinerhinweis" id="gelegt" hidden>${schuetzen(t('Ist im Warenkorb.'))}</p>
        </form>
        ${p.lager > 0 && p.lager <= 5 ? `<p class="hinweis">${schuetzen(t('Nur noch wenige an Lager'))}: ${p.lager}</p>` : ''}
        <div class="lauftext">${b.html || ''}</div>
        ${shop.hinweis ? `<p class="hinweis">${schuetzen(shop.hinweis)}</p>` : ''}
      </div>`;
  },

  warenkorb: (b, hilfe) => {
    const { t, shop, einstellungen, sprache } = hilfe;
    const zahlung = shop.zahlungsarten.map((z, i) => `
            <label class="wahlkarte schmal">
              <input type="radio" name="zahlung" value="${schuetzen(z.kennung)}"${i === 0 ? ' checked' : ''}>
              <span class="wahltext"><span class="wahlname">${schuetzen(t(z.titel))}</span>
                ${z.hinweis ? `<span class="wahlhilfe">${schuetzen(t(z.hinweis))}</span>` : ''}</span>
            </label>`).join('');
    const feld = (name, beschriftung, typ = 'text', breit = false, pflicht = false) => `
            <p class="feld${breit ? ' breit' : ''}">
              <label for="k-${name}">${schuetzen(t(beschriftung))}${pflicht ? ' <span class="pflicht" aria-hidden="true">*</span>' : ''}</label>
              <input id="k-${name}" name="${name}" type="${typ}" autocomplete="${
                { vorname: 'given-name', name: 'family-name', strasse: 'street-address',
                  plz: 'postal-code', ort: 'address-level2', mail: 'email', telefon: 'tel' }[name] || 'off'
              }"${pflicht ? ' required' : ''}>
            </p>`;

    return `<div class="kachel ${spalte(b)} korbkachel">
        <form id="kasse" class="spende">
          <fieldset class="schrittfeld">
            <legend><span class="schrittzahl">1</span> ${schuetzen(t('Ihre Bestellung'))}</legend>
            <div id="korbliste"></div>
            <p id="korbleer" class="fliess" style="margin-top: 12px;">${schuetzen(t('Ihr Warenkorb ist leer.'))}
              <a href="${schuetzen(pfadFuer('/shop/', sprache))}">${schuetzen(t('Zum Shop'))}</a></p>
            <table class="korbsumme" id="korbsumme" hidden>
              <tbody>
                <tr><th scope="row">${schuetzen(t('Zwischensumme'))}</th><td id="summe-waren"></td></tr>
                <tr><th scope="row">${schuetzen(t('Versand'))}</th><td id="summe-versand"></td></tr>
                <tr class="gesamt"><th scope="row">${schuetzen(t('Gesamt'))}</th><td id="summe-gesamt"></td></tr>
              </tbody>
            </table>
          </fieldset>

          <fieldset class="schrittfeld" id="kasse-rest" hidden>
            <legend><span class="schrittzahl">2</span> ${schuetzen(t('Lieferung'))}</legend>
            <div class="wahlreihe">
              <label class="wahlkarte schmal">
                <input type="radio" name="versandart" value="versand" checked>
                <span class="wahltext"><span class="wahlname">${schuetzen(t('Versand'))}</span>
                  <span class="wahlhilfe">${schuetzen(t('Pauschale'))} ${schuetzen(hilfe.geld(shop.versandkosten))}${
                    shop.versandfreiAb ? `, ${schuetzen(t('ab'))} ${schuetzen(hilfe.geld(shop.versandfreiAb))} ${schuetzen(t('versandkostenfrei'))}` : ''}</span></span>
              </label>
              ${shop.abholung ? `<label class="wahlkarte schmal">
                <input type="radio" name="versandart" value="abholung">
                <span class="wahltext"><span class="wahlname">${schuetzen(t('Abholung'))}</span>
                  <span class="wahlhilfe">${schuetzen(shop.abholort || '')}</span></span>
              </label>` : ''}
            </div>
          </fieldset>

          <fieldset class="schrittfeld" id="kasse-zahlung" hidden>
            <legend><span class="schrittzahl">3</span> ${schuetzen(t('Zahlung'))}</legend>
            <div class="wahlreihe">${zahlung}</div>
          </fieldset>

          <fieldset class="schrittfeld" id="kasse-angaben" hidden>
            <legend><span class="schrittzahl">4</span> ${schuetzen(t('Ihre Angaben'))}</legend>
            <div class="felder">
              ${feld('vorname', 'Vorname', 'text', false, true)}
              ${feld('name', 'Name', 'text', false, true)}
              ${feld('strasse', 'Strasse und Nummer', 'text', true, true)}
              ${feld('plz', 'PLZ', 'text', false, true)}
              ${feld('ort', 'Ort', 'text', false, true)}
              ${feld('mail', 'E-Mail', 'email', false, true)}
              ${feld('telefon', 'Telefon')}
            </div>
            <p class="feld">
              <label for="k-bemerkung">${schuetzen(t('Bemerkung'))}</label>
              <textarea id="k-bemerkung" name="bemerkung" rows="3"></textarea>
            </p>
          </fieldset>

          <div class="abschluss" id="kasse-abschluss" hidden>
            <p class="summe" id="kassenlage" role="status" aria-live="polite"></p>
            <button class="knopf spende" type="submit">${schuetzen(t('Bestellung abschicken'))}</button>
            <p class="hinweis" style="flex-basis: 100%; margin: 0;">${schuetzen(t('Es wird nichts online bezahlt. Wir bestätigen Ihre Bestellung von Hand per E-Mail.'))} ${schuetzen(einstellungen.mail)}</p>
          </div>
        </form>
        <div id="bestaetigung" hidden></div>
      </div>`;
  },

  hinweis: (b) => `<div class="kachel ${spalte(b)}"><p class="hinweis" style="margin: 0;">${schuetzen(b.text)}</p></div>`,

  // Das Spendenformular. Drei Schritte auf einer Seite, der Betrag zuoberst:
  // Wer spenden will, hat den Entschluss schon gefasst und soll nicht erst
  // durch Formularseiten wandern.
  //
  // Es ist ein echtes <form>. Ohne JavaScript bleibt jedes Feld bedienbar,
  // nur die laufende Zusammenfassung fehlt. Die Vorlage, an der sich diese
  // Seite orientiert, schreibt von sich selbst, sie sei «leider nicht
  // barrierefrei» – für ein Kompetenzzentrum für Sehen wäre das der falsche
  // Massstab. Darum: echte Beschriftungen, Gruppen mit <fieldset>/<legend>,
  // alles mit der Tastatur erreichbar.
  spende: (b, hilfe) => {
    const { einstellungen, t } = hilfe;
    const s = einstellungen.spenden;
    const eingerichtet = Boolean(s.zahlungsziel);

    // Beide Betragsgruppen tragen denselben Feldnamen – für den Browser sind
    // sie damit EINE Gruppe. Stünde in beiden ein «checked», gewänne das
    // zweite und die sichtbare Gruppe stünde leer da. Darum ist die
    // monatliche Gruppe im Markup abgeschaltet; das Skript tauscht.
    // Ohne Skript bleibt so die einmalige Gruppe bedienbar.
    const betragsfeld = (wert, art, i) => `
            <label class="betrag">
              <input type="radio" name="betrag" value="${wert}" data-art="${art}"${
                art === 'monatlich' ? ' disabled' : i === 1 ? ' checked' : ''}>
              <span class="betragzahl">${wert}</span>
            </label>`;

    const zweck = (z, i) => `
          <label class="wahlkarte">
            <input type="radio" name="zweck" value="${schuetzen(z.kennung)}"${i === 0 ? ' checked' : ''}>
            <span class="wahltext"><span class="wahlname">${schuetzen(z.titel)}</span>
              <span class="wahlhilfe">${schuetzen(z.text || '')}</span></span>
          </label>`;

    const art = (z, i) => `
          <label class="wahlkarte schmal">
            <input type="radio" name="zahlungsart" value="${schuetzen(z.kennung)}"${i === 0 ? ' checked' : ''}>
            <span class="wahltext"><span class="wahlname">${schuetzen(z.titel)}</span>
              ${z.hinweis ? `<span class="wahlhilfe">${schuetzen(z.hinweis)}</span>` : ''}</span>
          </label>`;

    const feld = (name, beschriftung, typ = 'text', breit = false, pflicht = false) => `
            <p class="feld${breit ? ' breit' : ''}">
              <label for="f-${name}">${schuetzen(t(beschriftung))}${pflicht ? ' <span class="pflicht" aria-hidden="true">*</span>' : ''}</label>
              <input id="f-${name}" name="${name}" type="${typ}" autocomplete="${
                { vorname: 'given-name', name: 'family-name', strasse: 'street-address',
                  plz: 'postal-code', ort: 'address-level2', mail: 'email' }[name] || 'off'
              }"${pflicht ? ' required' : ''}>
            </p>`;

    return `<div class="kachel ${spalte(b)} spendenkachel">
      <form id="spendenform" class="spende" method="${eingerichtet ? 'get' : 'post'}"${
        eingerichtet ? ` action="${schuetzen(s.zahlungsziel)}"` : ''}>

        <fieldset class="schrittfeld">
          <legend><span class="schrittzahl">1</span> ${schuetzen(t('Ihr Beitrag'))}</legend>

          <div class="umschalter" role="radiogroup" aria-label="${schuetzen(t('Wie oft'))}">
            <label><input type="radio" name="intervall" value="einmalig" checked><span>${schuetzen(t('Einmalig'))}</span></label>
            <label><input type="radio" name="intervall" value="monatlich"><span>${schuetzen(t('Monatlich'))}</span></label>
          </div>

          <div class="betraege" id="betraege-einmalig">
            ${s.betraegeEinmalig.map((w, i) => betragsfeld(w, 'einmalig', i)).join('')}
            <label class="betrag frei">
              <input type="radio" name="betrag" value="frei" data-art="einmalig">
              <span class="betragzahl">${schuetzen(t('Anderer'))}</span>
            </label>
          </div>
          <div class="betraege" id="betraege-monatlich" hidden>
            ${s.betraegeMonatlich.map((w, i) => betragsfeld(w, 'monatlich', i)).join('')}
            <label class="betrag frei">
              <input type="radio" name="betrag" value="frei" data-art="monatlich" disabled>
              <span class="betragzahl">${schuetzen(t('Anderer'))}</span>
            </label>
          </div>

          <!-- Ohne «hidden» im Markup: Fällt das Skript aus, sind Feld und
               Kontoangaben sichtbar statt für immer verborgen. Das Skript
               blendet sie beim Laden aus und bei Bedarf wieder ein. -->
          <p class="feld freibetrag" id="freibetrag">
            <label for="f-eigenerbetrag">${schuetzen(t('Eigener Betrag in Franken'))}</label>
            <input id="f-eigenerbetrag" name="eigenerbetrag" type="number" min="1" step="1" inputmode="numeric">
          </p>
        </fieldset>

        <fieldset class="schrittfeld">
          <legend><span class="schrittzahl">2</span> ${schuetzen(t('Wofür'))}</legend>
          <div class="wahlreihe">${s.zwecke.map(zweck).join('')}</div>
        </fieldset>

        <fieldset class="schrittfeld">
          <legend><span class="schrittzahl">3</span> ${schuetzen(t('Zahlungsart'))}</legend>
          <div class="wahlreihe">${s.zahlungsarten.map(art).join('')}</div>

          <div class="kontoangaben" id="kontoangaben">
            <p class="marke">${schuetzen(t('Unser Spendenkonto'))}</p>
            <p><strong>${schuetzen(s.konto.inhaber)}</strong></p>
            <p class="iban">${schuetzen(s.konto.iban)}</p>
            <p class="fliess">${schuetzen(s.konto.bank)}</p>
          </div>
        </fieldset>

        <fieldset class="schrittfeld">
          <legend><span class="schrittzahl">4</span> ${schuetzen(t('Ihre Angaben'))}</legend>
          <p class="fliess kleinerhinweis">${schuetzen(t('Für die Spendenbescheinigung. Wenn Sie keine brauchen, genügt die E-Mail-Adresse.'))}</p>
          <div class="felder">
            ${feld('vorname', 'Vorname')}
            ${feld('name', 'Name')}
            ${feld('strasse', 'Strasse und Nummer', 'text', true)}
            ${feld('plz', 'PLZ')}
            ${feld('ort', 'Ort')}
            ${feld('mail', 'E-Mail', 'email', true, true)}
          </div>
          <p class="haken">
            <label><input type="checkbox" name="bescheinigung" value="ja"> ${schuetzen(t('Ich möchte eine Spendenbescheinigung'))}</label>
          </p>
          <p class="haken">
            <label><input type="checkbox" name="anonym" value="ja"> ${schuetzen(t('Meine Spende soll nicht öffentlich genannt werden'))}</label>
          </p>
        </fieldset>

        <div class="abschluss">
          <p class="summe" id="spendensumme" role="status" aria-live="polite">${schuetzen(t('Ihre Spende'))}: <strong>CHF 50</strong> ${schuetzen(t('einmalig'))}</p>
          ${eingerichtet
            ? `<button class="knopf spende" type="submit">${schuetzen(t('Weiter zur Zahlung'))}</button>`
            : `<p class="hinweis" id="nochkeinweg">${schuetzen(t('Die Online-Zahlung ist noch nicht eingerichtet – es fehlt der Vertrag mit einem Zahlungsdienstleister. Bis dahin führt der Weg über eine Überweisung oder über'))} <a href="mailto:${schuetzen(einstellungen.mail)}">${schuetzen(einstellungen.mail)}</a>.</p>
             <a class="knopf spende" id="spendenmail" href="mailto:${schuetzen(einstellungen.mail)}">${schuetzen(t('Spende per E-Mail anmelden'))}</a>`}
        </div>
      </form>
    </div>`;
  },
};

export function baustein(b, hilfe) {
  const bauen = arten[b.art];
  if (!bauen) throw new Error(`Unbekannte Baustein-Art: ${b.art}`);
  return bauen(b, hilfe);
}

