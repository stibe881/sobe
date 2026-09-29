/* Redaktion des SONNENBERG.
   Ohne Fremdpakete, ohne Bündler – die Datei wird so ausgeliefert, wie sie
   hier steht. Sie spricht dieselbe Schnittstelle, die früher zur GitHub-API
   ging; der Server bildet sie jetzt selbst ab.

   Aufbau: links eine Leiste mit Bereichen, rechts der Inhalt. Jeder Bereich
   ist ein Eintrag in BEREICHE mit einer Funktion, die den Arbeitsbereich
   füllt. Neue Bereiche kommen dort dazu, sonst nirgends. */
(function () {
'use strict';

var API = '/api/contents/';

/* ============================================================ Kleinhelfer */
var $ = function (s) { return document.querySelector(s); };

function leeren(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

function neu(tag, eigenschaften, kinder) {
  var el = document.createElement(tag);
  if (eigenschaften) {
    Object.keys(eigenschaften).forEach(function (k) {
      if (k === 'text') el.textContent = eigenschaften[k];
      else if (k === 'html') el.innerHTML = eigenschaften[k];
      else if (k === 'klasse') el.className = eigenschaften[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), eigenschaften[k]);
      else if (eigenschaften[k] === true) el.setAttribute(k, '');
      else if (eigenschaften[k] != null && eigenschaften[k] !== false) el.setAttribute(k, eigenschaften[k]);
    });
  }
  (kinder || []).forEach(function (k) {
    if (k == null) return;
    el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
  });
  return el;
}

function meldung(text, art) {
  var kasten = $('#meldung');
  leeren(kasten);
  if (!text) return;
  kasten.appendChild(neu('div', { klasse: art || '', text: text }));
  if (art === 'ok') setTimeout(function () { if (kasten.textContent === text) leeren(kasten); }, 6000);
}

function slugify(text) {
  return String(text).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

function datumDeutsch(iso) {
  if (!iso) return '';
  var teile = String(iso).slice(0, 10).split('-');
  if (teile.length !== 3) return String(iso);
  return Number(teile[2]) + '. ' + ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][Number(teile[1]) - 1]
    + ' ' + teile[0];
}

/* Umlaute überleben btoa nur als Bytes – darum der Umweg über UTF-8. */
function b64codieren(text) {
  var bytes = new TextEncoder().encode(text);
  var bin = '';
  for (var i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
function b64lesen(b64) {
  var bin = atob(String(b64).replace(/\s/g, ''));
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function htmlSichern(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bildPfad(p) {
  if (!p) return '';
  if (/^https?:/.test(p)) return p;
  if (p.charAt(0) === '/') return p;
  return '/bilder/' + p;
}

/* ================================================================== API */
async function api(pfad, optionen) {
  optionen = optionen || {};
  var kopf = { 'x-redaktion': 'ja' };
  Object.keys(optionen.headers || {}).forEach(function (k) { kopf[k] = optionen.headers[k]; });
  var antwort = await fetch(API + pfad, Object.assign({}, optionen, { headers: kopf }));
  if (antwort.status === 401) { anmeldungZeigen(); throw new Error('Nicht angemeldet'); }
  if (!antwort.ok) {
    var details = '';
    try { details = (await antwort.json()).fehler || ''; } catch (e) { /* egal */ }
    throw new Error('Der Server antwortet mit ' + antwort.status + (details ? ' – ' + details : ''));
  }
  return antwort.status === 204 ? null : antwort.json();
}

async function jsonLesen(pfad) {
  var a = await api(pfad);
  return { daten: JSON.parse(b64lesen(a.content)), sha: a.sha, pfad: pfad };
}

async function jsonSchreiben(akte, nachricht) {
  var text = JSON.stringify(akte.daten, null, 2) + '\n';
  var e = await api(akte.pfad, {
    method: 'PUT',
    body: JSON.stringify({ message: nachricht, content: b64codieren(text), sha: akte.sha }),
  });
  akte.sha = e && e.content ? e.content.sha : akte.sha;
  return akte;
}

async function ordnerLesen(ordner) {
  var eintraege = [];
  try { eintraege = await api(ordner); } catch (e) { return []; }
  var dateien = eintraege.filter(function (e) { return e.type === 'file'; });
  return Promise.all(dateien.map(async function (e) {
    var a = await api(e.path);
    var roh = b64lesen(a.content);
    var zerlegt = frontmatterLesen(roh);
    return { name: e.name, pfad: e.path, sha: a.sha, daten: zerlegt.daten,
             body: zerlegt.body, alt: zerlegt.alt };
  }));
}

/* ===================================================== Frontmatter lesen */
function yamlWert(w) {
  if (Array.isArray(w)) return '[' + w.map(function (x) { return JSON.stringify(String(x)); }).join(', ') + ']';
  if (typeof w === 'number' || typeof w === 'boolean') return String(w);
  return JSON.stringify(String(w == null ? '' : w));
}

function frontmatterSchreiben(daten, body) {
  var zeilen = ['---'];
  Object.keys(daten).forEach(function (k) { zeilen.push(k + ': ' + yamlWert(daten[k])); });
  zeilen.push('---', '', body || '');
  return zeilen.join('\n');
}

function frontmatterLesen(text) {
  // Zwei Schreibweisen im Bestand: «---json» aus der WordPress-Übernahme
  // und «---» für alles Neue. Die alten sind gesperrt (alt: true), weil ihr
  // Rumpf rohes HTML ist – ein Textfeld würde ihn beim ersten Speichern
  // stillschweigend zerlegen.
  var treffer = /^---json\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text);
  if (treffer) {
    try { return { daten: JSON.parse(treffer[1]), body: treffer[2], alt: true }; }
    catch (e) { return { daten: {}, body: text, alt: true }; }
  }
  treffer = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text);
  if (!treffer) return { daten: {}, body: text, alt: false };
  var daten = {};
  treffer[1].split('\n').forEach(function (zeile) {
    var m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(zeile);
    if (!m) return;
    var roh = m[2].trim();
    var wert;
    if (roh.charAt(0) === '[') { try { wert = JSON.parse(roh); } catch (e) { wert = []; } }
    else if (roh.charAt(0) === '"') { try { wert = JSON.parse(roh); } catch (e) { wert = roh; } }
    else if (roh === 'true' || roh === 'false') wert = roh === 'true';
    else if (roh !== '' && !isNaN(Number(roh))) wert = Number(roh);
    else wert = roh;
    daten[m[1]] = wert;
  });
  return { daten: daten, body: treffer[2], alt: false };
}

/* =============================================== Markdown für die Vorschau */
function mdVorschau(md) {
  if (!md) return '';
  var teile = [];
  String(md).split(/\n{2,}/).forEach(function (block) {
    var sicher = htmlSichern(block.trim());
    if (!sicher) return;
    sicher = sicher
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (g, alt, quelle) {
        return '<img src="' + htmlSichern(bildPfad(quelle)) + '" alt="' + alt + '">';
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    if (/^###\s/.test(sicher)) teile.push('<h3>' + sicher.replace(/^###\s*/, '') + '</h3>');
    else if (/^##\s/.test(sicher)) teile.push('<h2>' + sicher.replace(/^##\s*/, '') + '</h2>');
    else if (/^[-*]\s/.test(sicher)) {
      teile.push('<ul>' + sicher.split('\n').map(function (z) {
        return '<li>' + z.replace(/^[-*]\s*/, '') + '</li>';
      }).join('') + '</ul>');
    } else teile.push('<p>' + sicher.replace(/\n/g, '<br>') + '</p>');
  });
  return teile.join('');
}

/* ====================================================== Formular aus Plan
   Ein einziger Formularbauer für alles, was in den JSON-Dateien steht:
   Menü, Einstellungen, Spenden, die Bausteine der festen Seiten. Ohne ihn
   müsste jede dieser Masken von Hand gebaut werden – und jede neue
   Baustein-Art hier eine weitere.

   Ein Plan ist eine Liste von Feldern:
     { id, name, art, hinweis, optionen, unter, standard, breit }
   Arten: text, mehrzeilig, absaetze, zahl, haken, auswahl, bild,
            zahlenliste, objekt (unter), liste (unter). */
function formularBauen(plan, wert) {
  wert = wert || {};
  var halter = neu('div');
  var leser = {};

  plan.forEach(function (feld) {
    var vorhanden = wert[feld.id];
    var kasten = neu('div', { klasse: 'feld' });

    if (feld.art === 'liste') {
      var liste = neu('div', { klasse: 'unterliste' });
      var zeilen = [];

      var zeileAnlegen = function (eintrag) {
        var unterform = formularBauen(feld.unter, eintrag || {});
        var zeile = neu('div', { klasse: 'unterzeile' });
        var eintragung = { lesen: unterform.lesen, el: zeile };
        var werkzeug = neu('div', { klasse: 'zeile oben' }, [
          neu('button', { type: 'button', klasse: 'klein', text: 'Hoch',
            onclick: function () { verschieben(eintragung, -1); } }),
          neu('button', { type: 'button', klasse: 'klein', text: 'Runter',
            onclick: function () { verschieben(eintragung, 1); } }),
          neu('button', { type: 'button', klasse: 'klein gefahr', text: 'Entfernen',
            onclick: function () {
              zeilen.splice(zeilen.indexOf(eintragung), 1);
              zeile.remove();
            } }),
        ]);
        zeile.appendChild(werkzeug);
        zeile.appendChild(unterform.el);
        zeilen.push(eintragung);
        liste.appendChild(zeile);
        return eintragung;
      };

      var verschieben = function (eintragung, um) {
        var i = zeilen.indexOf(eintragung);
        var j = i + um;
        if (j < 0 || j >= zeilen.length) return;
        zeilen.splice(i, 1);
        zeilen.splice(j, 0, eintragung);
        // Nach dem Umhängen stimmt die Reihenfolge im Dokument wieder mit
        // der im Gedächtnis überein – sonst läuft beides auseinander.
        zeilen.forEach(function (z) { liste.appendChild(z.el); });
      };

      (Array.isArray(vorhanden) ? vorhanden : []).forEach(zeileAnlegen);
      kasten.appendChild(neu('label', { text: feld.name }));
      if (feld.hinweis) kasten.appendChild(neu('p', { klasse: 'still', text: feld.hinweis }));
      kasten.appendChild(liste);
      kasten.appendChild(neu('button', { type: 'button', text: '+ ' + (feld.zufuegen || 'Eintrag hinzufügen'),
        onclick: function () { zeileAnlegen({}); } }));
      leser[feld.id] = function () { return zeilen.map(function (z) { return z.lesen(); }); };

    } else if (feld.art === 'objekt') {
      var unterform2 = formularBauen(feld.unter, vorhanden || {});
      var satz = neu('fieldset', {}, [neu('legend', { text: feld.name })]);
      satz.appendChild(unterform2.el);
      kasten.appendChild(satz);
      leser[feld.id] = function () {
        var w = unterform2.lesen();
        // Ein Knopf ohne Beschriftung ist kein Knopf. Statt einen leeren
        // mitzuschleppen, fällt er ganz weg.
        var leer = Object.keys(w).every(function (k) { return !w[k]; });
        return leer && feld.wegWennLeer ? undefined : w;
      };

    } else if (feld.art === 'haken') {
      var haken = neu('input', { type: 'checkbox' });
      haken.checked = Boolean(vorhanden);
      kasten.appendChild(neu('label', { klasse: 'haken' }, [haken, feld.name]));
      if (feld.hinweis) kasten.appendChild(neu('p', { klasse: 'still', text: feld.hinweis }));
      // Nicht angekreuzt heisst «nicht gesetzt», nicht «false». Sonst
      // füllt sich jede Datei mit Schlüsseln, die nichts aussagen, und
      // ein späterer Unterschied ist zwischen ihnen nicht mehr zu sehen.
      leser[feld.id] = function () { return haken.checked ? true : undefined; };

    } else {
      var beschriftung = neu('label', { text: feld.name });
      if (feld.hinweis) beschriftung.appendChild(neu('span', { klasse: 'hinweis', text: ' – ' + feld.hinweis }));
      kasten.appendChild(beschriftung);
      var eingabe;
      if (feld.art === 'mehrzeilig' || feld.art === 'absaetze') {
        eingabe = neu('textarea', { klasse: 'klein' });
        eingabe.value = feld.art === 'absaetze'
          ? (Array.isArray(vorhanden) ? vorhanden.join('\n\n') : (vorhanden || ''))
          : (vorhanden || '');
      } else if (feld.art === 'auswahl') {
        eingabe = neu('select');
        (feld.leerErlaubt ? [''].concat(feld.optionen) : feld.optionen).forEach(function (o) {
          var wahl = typeof o === 'string' ? { wert: o, text: o } : o;
          var opt = neu('option', { value: wahl.wert, text: wahl.text || '(keine)' });
          if (String(wahl.wert) === String(vorhanden == null ? '' : vorhanden)) opt.selected = true;
          eingabe.appendChild(opt);
        });
      } else {
        eingabe = neu('input', { type: feld.art === 'zahl' ? 'number' : 'text' });
        eingabe.value = vorhanden != null ? (feld.art === 'zahlenliste' && Array.isArray(vorhanden)
          ? vorhanden.join(', ') : vorhanden)
          : (feld.standard != null ? feld.standard : '');
      }
      if (feld.pflicht) eingabe.required = true;
      kasten.appendChild(eingabe);
      if (feld.art === 'bild') kasten.appendChild(bildwaehler(eingabe));

      leser[feld.id] = function () {
        var v = eingabe.value;
        if (feld.art === 'zahl') return v === '' ? undefined : Number(v);
        if (feld.art === 'zahlenliste') {
          return String(v).split(/[,\s]+/).filter(Boolean).map(Number).filter(function (n) { return !isNaN(n); });
        }
        if (feld.art === 'absaetze') {
          return String(v).split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean);
        }
        v = String(v).trim();
        // «leerBehalten» für Felder, deren blosses Vorhandensein etwas
        // bedeutet – etwa das Zahlungsziel: Der leere Schlüssel sagt, dass
        // es diese Einstellung gibt und sie noch aussteht.
        if (v === '') return feld.leerBehalten ? '' : undefined;
        return v;
      };
    }
    halter.appendChild(kasten);
  });

  return {
    el: halter,
    lesen: function () {
      var raus = {};
      Object.keys(leser).forEach(function (k) {
        var w = leser[k]();
        // undefined heisst «nicht gesetzt» und fliegt raus; false und 0
        // sind gültige Werte und bleiben.
        if (w !== undefined && !(Array.isArray(w) && w.length === 0)) raus[k] = w;
      });
      return raus;
    },
  };
}

/* Bildwahl neben einem Textfeld: hochladen und den Pfad eintragen. */
function bildwaehler(zielEingabe) {
  var wahl = neu('input', { type: 'file', accept: 'image/*', style: 'margin-top:.5rem' });
  wahl.addEventListener('change', async function () {
    var datei = wahl.files[0];
    if (!datei) return;
    try {
      var pfad = await bildHochladen(datei);
      zielEingabe.value = pfad;
      zielEingabe.dispatchEvent(new Event('input', { bubbles: true }));
      meldung('Bild hochgeladen.', 'ok');
    } catch (f) { meldung('Bild-Upload fehlgeschlagen: ' + f.message, 'fehler'); }
    wahl.value = '';
  });
  return wahl;
}

async function bildHochladen(datei) {
  var endung = (datei.name.split('.').pop() || 'jpg').toLowerCase();
  var name = Date.now() + '-' + slugify(datei.name.replace(/\.[^.]+$/, '')) + '.' + endung;
  var pfad = 'statisch/wp-content/uploads/redaktion/' + name;
  var bytes = new Uint8Array(await datei.arrayBuffer());
  var bin = '';
  for (var i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  await api(pfad, { method: 'PUT',
    body: JSON.stringify({ message: 'Redaktion: Bild ' + name, content: btoa(bin) }) });
  return '/wp-content/uploads/redaktion/' + name;
}

/* ============================================================ Sammlungen
   Beiträge, Stellen, Team, Textbausteine: je ein Ordner unter quelle/, je
   eine Datei pro Eintrag. Die Felder hier müssen zu dem passen, was
   bauen.mjs liest – steht ein Feld nur hier, erscheint es nirgends. */
var SAMMLUNGEN = {
  news: {
    name: 'Beiträge',
    ordner: 'quelle/news',
    wo: 'Erscheinen auf <a href="/aktuell/" target="_blank" rel="noopener">Aktuell</a>, '
      + 'auf der Startseite und je als eigene Seite. Einträge mit einem Schloss stammen aus '
      + 'der alten Webseite: Ihr Text ist rohes HTML und liesse sich hier nicht ohne Verlust '
      + 'bearbeiten – löschen geht.',
    neuText: 'Neuen Beitrag schreiben',
    felder: [
      { id: 'titel', art: 'text', name: 'Titel', pflicht: true },
      { id: 'datum', art: 'datum', name: 'Datum', pflicht: true },
      { id: 'bild', art: 'bild', name: 'Beitragsbild', hinweis: 'Querformat, mindestens 1200 Pixel breit' },
      { id: 'bildAlt', art: 'text', name: 'Was ist auf dem Bild zu sehen?',
        hinweis: 'Ein Satz für alle, die das Bild nicht sehen' },
      { id: 'kategorien', art: 'mehrfach', name: 'Kategorien',
        optionen: ['aktuelles', 'medien', 'spendenprojekte'],
        beschriftungen: { aktuelles: 'Aktuelles', medien: 'Medien', spendenprojekte: 'Spendenprojekte' } },
      { id: 'body', art: 'lauftext', name: 'Beitragstext', pflicht: true, bilder: true, werkzeuge: true },
    ],
    anzeige: function (d) { return d.titel || '(ohne Titel)'; },
    listenMeta: function (d) { return datumDeutsch(d.datum); },
    etiketten: function (d) { return d.kategorien || []; },
    ansehen: function (datei) { return '/aktuell/' + datei.name.replace(/\.(md|html)$/, '') + '/'; },
    vorschau: 'news',
  },
  stellen: {
    name: 'Offene Stellen',
    ordner: 'quelle/stellen',
    wo: 'Erscheinen auf <a href="/jobs/" target="_blank" rel="noopener">Jobs</a> und je als '
      + 'eigene Seite. Der Bereich steuert den Filter auf der Jobs-Seite. Ein besetztes '
      + 'Inserat einfach löschen.',
    neuText: 'Neues Inserat erfassen',
    felder: [
      { id: 'titel', art: 'text', name: 'Titel', pflicht: true,
        hinweis: 'z. B. «Logopädin/Logopäde 40–100 %»' },
      { id: 'bereich', art: 'text', name: 'Bereich',
        hinweis: 'Gruppiert den Filter auf der Jobs-Seite, z. B. «Sehen» oder «Internat»' },
      { id: 'pensum', art: 'text', name: 'Pensum', hinweis: 'z. B. «40–100 %»' },
      { id: 'eintritt', art: 'text', name: 'Eintritt', hinweis: 'z. B. «nach Vereinbarung»' },
      { id: 'bewerbungslink', art: 'text', name: 'Bewerbungslink',
        hinweis: 'Ohne Angabe führt der Knopf zu einer E-Mail an uns' },
      { id: 'reihenfolge', art: 'zahl', name: 'Reihenfolge', standard: 500,
        hinweis: 'Kleinere Zahl = weiter oben' },
      { id: 'entwurf', art: 'haken', name: 'Noch Entwurf' },
      { id: 'body', art: 'lauftext', name: 'Beschrieb', pflicht: true, werkzeuge: true, bilder: true },
    ],
    anzeige: function (d) { return d.titel || '(ohne Titel)'; },
    listenMeta: function (d) { return [d.pensum, d.eintritt].filter(Boolean).join(' · '); },
    etiketten: function (d) { return [].concat(d.bereich ? [d.bereich] : [], d.entwurf ? ['Entwurf'] : []); },
    ansehen: function (datei) { return '/jobs/' + datei.name.replace(/\.(md|html)$/, '') + '/'; },
    vorschau: 'stelle',
  },
  team: {
    name: 'Team',
    ordner: 'quelle/team',
    wo: 'Die Personen erscheinen auf <a href="/ueber-uns/" target="_blank" rel="noopener">Über uns</a>, '
      + 'gruppiert und innerhalb der Gruppe nach Reihenfolge.',
    neuText: 'Person hinzufügen',
    felder: [
      { id: 'name', art: 'text', name: 'Name', pflicht: true },
      { id: 'funktion', art: 'text', name: 'Funktion', pflicht: true },
      { id: 'gruppe', art: 'auswahl', name: 'Gruppe',
        optionen: ['Geschäftsleitung', 'Stabstellen', 'Angebots- und Fachbereichsleitungen'] },
      { id: 'bild', art: 'bild', name: 'Porträtfoto', hinweis: 'Querformat, ca. 800 × 540 Pixel' },
      { id: 'email', art: 'text', name: 'E-Mail-Adresse' },
      { id: 'reihenfolge', art: 'zahl', name: 'Reihenfolge', standard: 500,
        hinweis: 'Kleinere Zahl = weiter vorne' },
    ],
    anzeige: function (d) { return d.name || '(ohne Name)'; },
    listenMeta: function (d) { return d.funktion || ''; },
    etiketten: function (d) { return d.gruppe ? [d.gruppe] : []; },
    ansehen: function () { return '/ueber-uns/'; },
    vorschau: 'team',
  },
  texte: {
    name: 'Textbausteine',
    ordner: 'quelle/texte',
    wo: 'Einzelne Texte auf festen Seiten – etwa der Hinweis zur Platzsituation auf '
      + '<a href="/aufnahme/" target="_blank" rel="noopener">Aufnahme</a>.',
    neuText: null,
    felder: [
      { id: 'titel', art: 'text', name: 'Bezeichnung' },
      { id: 'body', art: 'lauftext', name: 'Text', pflicht: true, werkzeuge: true },
    ],
    anzeige: function (d) { return d.titel || '(ohne Bezeichnung)'; },
    listenMeta: function () { return ''; },
    etiketten: function () { return []; },
    ansehen: function () { return '/aufnahme/'; },
    vorschau: 'text',
  },
};

/* --------------------------------------------------- Liste einer Sammlung */
async function sammlungZeigen(id) {
  var b = SAMMLUNGEN[id];
  var arbeit = leeren($('#arbeit'));
  arbeit.appendChild(neu('p', { klasse: 'wo', html: b.wo }));

  var kopfzeile = neu('div', { klasse: 'zeile oben' });
  if (b.neuText) {
    kopfzeile.appendChild(neu('button', { klasse: 'primaer', text: '+ ' + b.neuText,
      onclick: function () { eintragEditor(id, null); } }));
  }
  var anzahl = neu('span', { klasse: 'still', text: 'wird geladen …' });
  kopfzeile.appendChild(anzahl);
  arbeit.appendChild(kopfzeile);

  var karte = neu('div', { klasse: 'karte' });
  var liste = neu('ul', { klasse: 'liste' });
  karte.appendChild(liste);
  arbeit.appendChild(karte);

  var dateien = await ordnerLesen(b.ordner);
  dateien.sort(function (x, y) {
    if (id === 'news') return String(y.daten.datum || '').localeCompare(String(x.daten.datum || ''));
    if (x.daten.reihenfolge != null || y.daten.reihenfolge != null) {
      return (x.daten.reihenfolge || 0) - (y.daten.reihenfolge || 0);
    }
    return b.anzeige(x.daten).localeCompare(b.anzeige(y.daten));
  });
  anzahl.textContent = dateien.length === 1 ? '1 Eintrag' : dateien.length + ' Einträge';

  if (!dateien.length) {
    liste.appendChild(neu('li', {}, [neu('span', { klasse: 'still', text: 'Noch nichts erfasst.' })]));
  }
  dateien.forEach(function (datei) {
    var titel = neu('div', { klasse: 'titel' }, [
      neu('strong', { text: (datei.alt ? '🔒 ' : '') + b.anzeige(datei.daten) }),
    ]);
    var meta = neu('span', { klasse: 'still', text: b.listenMeta(datei.daten) });
    b.etiketten(datei.daten).forEach(function (e) {
      meta.appendChild(document.createTextNode(' '));
      meta.appendChild(neu('span', { klasse: 'etikett', text: e }));
    });
    titel.appendChild(meta);

    var zeile = neu('li', {}, [titel,
      neu('a', { klasse: 'knopf', text: 'Ansehen', href: b.ansehen(datei), target: '_blank', rel: 'noopener' }),
    ]);
    if (!datei.alt) {
      zeile.appendChild(neu('button', { text: 'Bearbeiten',
        onclick: function () { eintragEditor(id, datei); } }));
    }
    if (id !== 'texte') {
      zeile.appendChild(neu('button', { klasse: 'gefahr', text: 'Löschen',
        onclick: function () { eintragLoeschen(id, datei); } }));
    }
    liste.appendChild(zeile);
  });
}

/* ------------------------------------------------- Editor eines Eintrags */
function werkzeugleiste(kasten) {
  var leiste = neu('div', { klasse: 'werkzeuge', role: 'toolbar', 'aria-label': 'Textformatierung' });
  [['Fett', function (t) { return '**' + (t || 'fetter Text') + '**'; }],
   ['Kursiv', function (t) { return '*' + (t || 'kursiver Text') + '*'; }],
   ['Zwischentitel', function (t) { return '\n## ' + (t || 'Zwischentitel') + '\n'; }],
   ['Aufzählung', function (t) { return '\n- ' + (t || 'Punkt') + '\n- \n'; }],
   ['Link', function (t) { return '[' + (t || 'Linktext') + '](https://…)'; }],
  ].forEach(function (paar) {
    leiste.appendChild(neu('button', { type: 'button', klasse: 'klein', text: paar[0],
      onclick: function () {
        var von = kasten.selectionStart, bis = kasten.selectionEnd;
        kasten.setRangeText(paar[1](kasten.value.slice(von, bis)), von, bis, 'end');
        kasten.focus();
        kasten.dispatchEvent(new Event('input', { bubbles: true }));
      } }));
  });
  return leiste;
}

function eintragFeld(feld, wert, sammlungId) {
  var halter = neu('div', { klasse: 'feld' });
  var eingabe;
  if (feld.art === 'mehrfach') {
    var satz = neu('fieldset', {}, [neu('legend', { text: feld.name })]);
    feld.optionen.forEach(function (o) {
      var box = neu('input', { type: 'checkbox', value: o, name: 'feld-' + feld.id });
      if ((wert || []).indexOf(o) !== -1) box.checked = true;
      satz.appendChild(neu('label', {}, [box, feld.beschriftungen[o] || o]));
    });
    halter.appendChild(satz);
    return halter;
  }
  if (feld.art === 'haken') {
    var haken = neu('input', { type: 'checkbox', id: 'feld-' + feld.id });
    haken.checked = Boolean(wert);
    halter.appendChild(neu('label', { klasse: 'haken' }, [haken, feld.name]));
    return halter;
  }
  var beschriftung = neu('label', { text: feld.name + (feld.pflicht ? ' *' : ''), for: 'feld-' + feld.id });
  if (feld.hinweis) beschriftung.appendChild(neu('span', { klasse: 'hinweis', text: ' – ' + feld.hinweis }));
  halter.appendChild(beschriftung);

  if (feld.art === 'lauftext') {
    eingabe = neu('textarea');
    eingabe.value = wert || '';
    if (feld.werkzeuge) halter.appendChild(werkzeugleiste(eingabe));
  } else if (feld.art === 'auswahl') {
    eingabe = neu('select');
    feld.optionen.forEach(function (o) {
      var opt = neu('option', { value: o, text: o });
      if (o === wert) opt.selected = true;
      eingabe.appendChild(opt);
    });
  } else {
    eingabe = neu('input', { type: feld.art === 'datum' ? 'date' : feld.art === 'zahl' ? 'number' : 'text' });
    eingabe.value = wert != null ? wert : (feld.standard != null ? feld.standard : '');
  }
  eingabe.id = 'feld-' + feld.id;
  if (feld.pflicht) eingabe.required = true;
  halter.appendChild(eingabe);

  if (feld.art === 'bild') halter.appendChild(bildwaehler(eingabe));
  if (feld.bilder) {
    var wahl = neu('input', { type: 'file', accept: 'image/*', style: 'margin-top:.5rem',
      'aria-label': 'Bild in den Text einfügen' });
    wahl.addEventListener('change', async function () {
      var datei = wahl.files[0];
      if (!datei) return;
      var alt = prompt('Was ist auf dem Bild zu sehen? Ein kurzer Satz für alle, die es nicht sehen.');
      if (alt === null) { wahl.value = ''; return; }
      try {
        var pfad = await bildHochladen(datei);
        var kasten = document.getElementById('feld-body');
        kasten.value = (kasten.value ? kasten.value.replace(/\s+$/, '') + '\n\n' : '')
          + '![' + alt.replace(/[\[\]]/g, '') + '](' + pfad + ')\n';
        kasten.dispatchEvent(new Event('input', { bubbles: true }));
        meldung('Bild hochgeladen und eingefügt.', 'ok');
      } catch (f) { meldung('Bild-Upload fehlgeschlagen: ' + f.message, 'fehler'); }
      wahl.value = '';
    });
    halter.appendChild(wahl);
  }
  return halter;
}

function eintragWerte(sammlungId) {
  var b = SAMMLUNGEN[sammlungId];
  var daten = {};
  var body = '';
  b.felder.forEach(function (feld) {
    var el = document.getElementById('feld-' + feld.id);
    if (feld.art === 'lauftext') { body = el ? el.value : ''; return; }
    if (feld.art === 'mehrfach') {
      daten[feld.id] = Array.prototype.map.call(
        document.querySelectorAll('input[name="feld-' + feld.id + '"]:checked'),
        function (x) { return x.value; });
      return;
    }
    if (feld.art === 'haken') { if (el && el.checked) daten[feld.id] = true; return; }
    if (feld.art === 'zahl') { daten[feld.id] = el ? (parseInt(el.value, 10) || 0) : 0; return; }
    var w = el ? el.value.trim() : '';
    if (w) daten[feld.id] = w;
  });
  return { daten: daten, body: body };
}

function eintragEditor(sammlungId, datei) {
  var b = SAMMLUNGEN[sammlungId];
  var arbeit = leeren($('#arbeit'));
  $('#bereich-titel').textContent = datei ? b.anzeige(datei.daten) : (b.neuText || 'Neu');

  var spalten = neu('div', { klasse: 'zweispaltig' });
  var form = neu('form', { klasse: 'karte' });
  var rechts = neu('div');
  var vorschauKasten = neu('div', { klasse: 'vorschau' });
  var beschriftung = neu('p', { klasse: 'vorschau-titelzeile', text: 'So wird es aussehen' });
  var zusatz = neu('div');
  rechts.append(beschriftung, vorschauKasten, zusatz);
  spalten.append(form, rechts);
  arbeit.appendChild(neu('p', { klasse: 'wo', html: b.wo }));
  arbeit.appendChild(spalten);

  b.felder.forEach(function (feld) {
    var wert = feld.art === 'lauftext' ? (datei ? datei.body : '')
      : (datei ? datei.daten[feld.id] : undefined);
    form.appendChild(eintragFeld(feld, wert, sammlungId));
  });

  form.appendChild(neu('div', { klasse: 'zeile' }, [
    neu('button', { type: 'submit', klasse: 'primaer', text: 'Speichern' }),
    neu('button', { type: 'button', text: 'Zurück ohne Speichern',
      onclick: function () { bereichOeffnen(sammlungId); } }),
  ]));

  function vorschau() {
    var w = eintragWerte(sammlungId);
    var fehlt = function (was) { return '<span class="platzhalter">(' + was + ' folgt)</span>'; };
    leeren(zusatz);
    if (b.vorschau === 'news') {
      beschriftung.textContent = 'So wird die Beitragsseite aussehen';
      vorschauKasten.innerHTML =
        (w.daten.bild ? '<img src="' + htmlSichern(bildPfad(w.daten.bild)) + '" alt="" style="max-width:100%;border-radius:8px;margin-bottom:10px">' : '')
        + '<div class="v-titel">' + (htmlSichern(w.daten.titel) || fehlt('Titel')) + '</div>'
        + '<p class="v-datum">' + datumDeutsch(w.daten.datum) + '</p>'
        + '<div class="v-body">' + (mdVorschau(w.body) || fehlt('Beitragstext')) + '</div>';
    } else if (b.vorschau === 'stelle') {
      beschriftung.textContent = 'So wird die Inserat-Seite aussehen';
      vorschauKasten.innerHTML =
        '<div class="v-titel">' + (htmlSichern(w.daten.titel) || fehlt('Titel')) + '</div>'
        + '<p class="v-datum">' + htmlSichern([w.daten.pensum,
            w.daten.eintritt ? 'Eintritt ' + w.daten.eintritt : '', 'Baar'].filter(Boolean).join(' · ')) + '</p>'
        + '<div class="v-body">' + (mdVorschau(w.body) || fehlt('Beschrieb')) + '</div>';
      zusatz.innerHTML = '<p class="vorschau-titelzeile" style="margin-top:1rem">… und so die Zeile auf der Jobs-Seite</p>'
        + '<div class="v-kachel">' + (w.daten.bereich ? '<p class="still">' + htmlSichern(w.daten.bereich) + '</p>' : '')
        + '<strong>' + (htmlSichern(w.daten.titel) || '(Titel)') + '</strong></div>';
    } else if (b.vorschau === 'team') {
      beschriftung.textContent = 'So wird die Person erscheinen';
      vorschauKasten.innerHTML =
        (w.daten.bild ? '<img src="' + htmlSichern(bildPfad(w.daten.bild)) + '" alt="" style="max-width:220px;border-radius:8px">' : '')
        + '<div class="v-titel" style="font-size:19px;margin-top:8px">' + (htmlSichern(w.daten.name) || fehlt('Name')) + '</div>'
        + '<p class="v-datum">' + (htmlSichern(w.daten.funktion) || fehlt('Funktion')) + '</p>'
        + (w.daten.email ? '<p class="v-datum">' + htmlSichern(w.daten.email) + '</p>' : '');
    } else {
      beschriftung.textContent = 'So wird der Text aussehen';
      vorschauKasten.innerHTML = '<div class="v-body">' + (mdVorschau(w.body) || fehlt('Text')) + '</div>';
    }
  }

  form.addEventListener('input', vorschau);
  form.addEventListener('change', vorschau);
  form.onsubmit = async function (e) {
    e.preventDefault();
    var w = eintragWerte(sammlungId);
    var name = w.daten.titel || w.daten.name;
    var pfad = datei ? datei.pfad : b.ordner + '/' + slugify(name) + '.md';
    meldung('Wird gespeichert …');
    try {
      await api(pfad, { method: 'PUT', body: JSON.stringify({
        message: 'Redaktion: ' + b.name + ' – ' + name,
        content: b64codieren(frontmatterSchreiben(w.daten, w.body)),
        sha: datei ? datei.sha : undefined,
      }) });
    } catch (f) { meldung('Speichern fehlgeschlagen: ' + f.message, 'fehler'); return; }
    await bereichOeffnen(sammlungId);
    meldung('Gespeichert. Mit «Veröffentlichen» kommt es auf die Webseite.', 'ok');
  };
  vorschau();
  var erstes = form.querySelector('input, textarea, select');
  if (erstes) erstes.focus();
}

async function eintragLoeschen(sammlungId, datei) {
  var b = SAMMLUNGEN[sammlungId];
  if (!confirm('«' + b.anzeige(datei.daten) + '» wirklich löschen?')) return;
  try {
    await api(datei.pfad, { method: 'DELETE',
      body: JSON.stringify({ message: 'Redaktion: gelöscht', sha: datei.sha }) });
  } catch (f) { meldung('Löschen fehlgeschlagen: ' + f.message, 'fehler'); return; }
  await bereichOeffnen(sammlungId);
  meldung('Gelöscht. Mit «Veröffentlichen» wird die Webseite neu gebaut.', 'ok');
}

/* ================================================================ Seiten
   Die festen Seiten stehen in inhalt/seiten.json als Liste von Bausteinen.
   Jede Baustein-Art hier hat ihr Gegenstück in vorlagen/bausteine.mjs –
   wer dort eine Art ergänzt, ergänzt sie auch hier, sonst lässt sie sich
   nicht bearbeiten. */
var BREITE = [
  { wert: 2, text: 'Schmal (ein Drittel)' },
  { wert: 3, text: 'Halb' },
  { wert: 4, text: 'Breit (zwei Drittel)' },
  { wert: 6, text: 'Ganze Breite' },
];
var FARBE = [
  { wert: '', text: 'Weiss' }, { wert: 'petrol', text: 'Petrol' },
  { wert: 'gelb', text: 'Gelb' }, { wert: 'nacht', text: 'Nachtblau' },
];
var BREIT = { id: 'spalten', art: 'auswahl', name: 'Breite', optionen: BREITE };
var FARBIG = { id: 'farbe', art: 'auswahl', name: 'Farbe', optionen: FARBE };
var KNOPF = { id: 'knopf', art: 'objekt', name: 'Knopf', wegWennLeer: true, unter: [
  { id: 'titel', art: 'text', name: 'Beschriftung' },
  { id: 'pfad', art: 'text', name: 'Ziel', hinweis: 'z. B. /aufnahme/' },
] };

var BAUSTEIN_PLAN = {
  held: { name: 'Titelkachel', wozu: 'Grosser Seitentitel in Petrol', felder: [
    BREIT,
    { id: 'marke', art: 'text', name: 'Kleine Zeile darüber' },
    { id: 'markeZiel', art: 'text', name: 'Ziel der kleinen Zeile' },
    { id: 'titel', art: 'text', name: 'Titel', pflicht: true },
    { id: 'text', art: 'text', name: 'Untertitel' },
    KNOPF,
  ] },
  text: { name: 'Text', wozu: 'Titel und Absätze', felder: [
    BREIT, FARBIG,
    { id: 'titel', art: 'text', name: 'Titel' },
    { id: 'marke', art: 'text', name: 'Kleine Zeile darüber' },
    { id: 'absaetze', art: 'absaetze', name: 'Absätze',
      hinweis: 'Eine Leerzeile trennt zwei Absätze' },
  ] },
  kachel: { name: 'Kachel mit Links', wozu: 'Titel, Text und eine Liste von Verweisen', felder: [
    BREIT, FARBIG,
    { id: 'titel', art: 'text', name: 'Titel', pflicht: true },
    { id: 'ziel', art: 'text', name: 'Ganze Kachel verlinken auf',
      hinweis: 'Leer lassen, wenn nur die Links anklickbar sein sollen' },
    { id: 'text', art: 'text', name: 'Text' },
    { id: 'links', art: 'liste', name: 'Links', zufuegen: 'Link hinzufügen', unter: [
      { id: 'titel', art: 'text', name: 'Beschriftung' },
      { id: 'pfad', art: 'text', name: 'Ziel' },
      { id: 'nurText', art: 'haken', name: 'Nur Text, kein Link' },
    ] },
  ] },
  bild: { name: 'Bild', wozu: 'Ein Foto über die gewählte Breite', felder: [
    BREIT,
    { id: 'quelle', art: 'bild', name: 'Bild', hinweis: 'Dateiname aus dem Ordner bilder/' },
    { id: 'alt', art: 'text', name: 'Was ist zu sehen?',
      hinweis: 'Ein Satz für alle, die das Bild nicht sehen' },
  ] },
  schritt: { name: 'Schritt', wozu: 'Nummerierter Schritt einer Abfolge', felder: [
    BREIT,
    { id: 'nummer', art: 'text', name: 'Nummer' },
    { id: 'titel', art: 'text', name: 'Titel', pflicht: true },
    { id: 'text', art: 'text', name: 'Text' },
  ] },
  person: { name: 'Ansprechperson', wozu: 'Name, Funktion, Mail und Telefon', felder: [
    BREIT,
    { id: 'titel', art: 'text', name: 'Überschrift' },
    { id: 'name', art: 'text', name: 'Name' },
    { id: 'mail', art: 'text', name: 'E-Mail' },
  ] },
  dokumente: { name: 'Dokumente', wozu: 'Liste von PDF-Dateien', felder: [
    BREIT,
    { id: 'titel', art: 'text', name: 'Titel' },
    { id: 'eintraege', art: 'liste', name: 'Dokumente', zufuegen: 'Dokument hinzufügen', unter: [
      { id: 'titel', art: 'text', name: 'Beschriftung' },
      { id: 'datei', art: 'text', name: 'Dateiname', hinweis: 'Liegt im Ordner dateien/' },
    ] },
  ] },
  aufruf: { name: 'Aufruf', wozu: 'Grosse Aussage mit Knopf', felder: [
    BREIT, FARBIG,
    { id: 'titel', art: 'text', name: 'Aussage', pflicht: true },
    { id: 'text', art: 'text', name: 'Text darunter' },
    KNOPF,
    { id: 'zweitlink', art: 'objekt', name: 'Zweiter Link', wegWennLeer: true, unter: [
      { id: 'titel', art: 'text', name: 'Beschriftung' },
      { id: 'pfad', art: 'text', name: 'Ziel' },
    ] },
  ] },
  kontakt: { name: 'Kontakt', wozu: 'Telefon, Mail und Adresse aus den Einstellungen', felder: [
    BREIT, FARBIG,
    { id: 'titel', art: 'text', name: 'Titel', pflicht: true },
    { id: 'text', art: 'text', name: 'Text' },
    { id: 'intake', art: 'haken', name: 'Anfrage-Adresse statt Hauptadresse' },
    { id: 'adresse', art: 'haken', name: 'Postadresse mit anzeigen' },
  ] },
  beitraege: { name: 'Beiträge', wozu: 'Liste der neuesten Beiträge', felder: [
    BREIT,
    { id: 'titel', art: 'text', name: 'Titel' },
    { id: 'anzahl', art: 'zahl', name: 'Wie viele' },
    { id: 'alle', art: 'haken', name: 'Alle zeigen' },
    { id: 'mehr', art: 'objekt', name: 'Link «mehr»', wegWennLeer: true, unter: [
      { id: 'titel', art: 'text', name: 'Beschriftung' },
      { id: 'pfad', art: 'text', name: 'Ziel' },
    ] },
  ] },
  stellen: { name: 'Offene Stellen', wozu: 'Liste aller Inserate mit Filter', felder: [
    BREIT,
    { id: 'titel', art: 'text', name: 'Titel' },
  ] },
  spende: { name: 'Spendenformular', wozu: 'Betrag, Zweck, Zahlungsart, Angaben', felder: [BREIT] },
  hinweis: { name: 'Hinweis', wozu: 'Gelb hinterlegter Kasten', felder: [
    BREIT,
    { id: 'text', art: 'mehrzeilig', name: 'Text' },
  ] },
  rohtext: { name: 'Roher HTML-Text', wozu: 'Nur für übernommene Inhalte', felder: [
    BREIT, FARBIG,
    { id: 'marke', art: 'text', name: 'Kleine Zeile darüber' },
    { id: 'titel', art: 'text', name: 'Titel' },
    { id: 'html', art: 'mehrzeilig', name: 'HTML' },
  ] },
};

async function seitenZeigen() {
  var arbeit = leeren($('#arbeit'));
  arbeit.appendChild(neu('p', { klasse: 'wo', html:
    'Die festen Seiten der Webseite. Beiträge und Stellen stehen nicht hier, '
    + 'sondern unter «Beiträge» und «Offene Stellen».' }));
  var karte = neu('div', { klasse: 'karte' });
  var liste = neu('ul', { klasse: 'liste' });
  karte.appendChild(liste);
  arbeit.appendChild(karte);

  var akte = await jsonLesen('inhalt/seiten.json');
  akte.daten.forEach(function (seite, i) {
    liste.appendChild(neu('li', {}, [
      neu('div', { klasse: 'titel' }, [
        neu('strong', { text: seite.titel }),
        neu('span', { klasse: 'still', text: seite.pfad + ' · '
          + seite.bausteine.length + ' Bausteine' }),
      ]),
      neu('a', { klasse: 'knopf', text: 'Ansehen', href: seite.pfad, target: '_blank', rel: 'noopener' }),
      neu('button', { text: 'Bearbeiten', onclick: function () { seiteEditor(akte, i); } }),
    ]));
  });
}

function seiteEditor(akte, index) {
  var seite = akte.daten[index];
  var arbeit = leeren($('#arbeit'));
  $('#bereich-titel').textContent = seite.titel;
  arbeit.appendChild(neu('p', { klasse: 'wo', text:
    'Die Seite besteht aus Bausteinen. Jeder Baustein wird zu einer Kachel im Raster.' }));

  var kopf = neu('div', { klasse: 'karte' });
  var kopfform = formularBauen([
    { id: 'titel', art: 'text', name: 'Seitentitel', pflicht: true },
    { id: 'beschreibung', art: 'mehrzeilig', name: 'Beschreibung',
      hinweis: 'Erscheint in Suchmaschinen und beim Teilen' },
  ], seite);
  kopf.append(neu('h2', { text: 'Die Seite' }), kopfform.el);
  arbeit.appendChild(kopf);

  var bausteinhalter = neu('div');
  arbeit.appendChild(bausteinhalter);
  var reihen = [];

  function bausteinAnlegen(b) {
    var plan = BAUSTEIN_PLAN[b.art];
    if (!plan) {
      // Lieber sichtbar stehen lassen als still verschlucken: Ein Baustein,
      // den diese Oberfläche nicht kennt, würde beim Speichern sonst
      // spurlos aus der Seite fallen.
      var roh = neu('div', { klasse: 'baustein' }, [
        neu('div', { klasse: 'bausteinkopf' }, [
          neu('span', { klasse: 'art', text: b.art }),
          neu('span', { klasse: 'wozu', text: 'unbekannte Art – bleibt unverändert' }),
        ]),
      ]);
      var eintragung0 = { lesen: function () { return b; }, el: roh };
      reihen.push(eintragung0);
      bausteinhalter.appendChild(roh);
      return;
    }
    var form = formularBauen(plan.felder, b);
    var kasten = neu('div', { klasse: 'baustein' });
    var eintragung = { lesen: function () {
      // «art» zuerst, dann der Rest: Sonst wandert der Schlüssel beim
      // Speichern ans Ende und jede Datei sieht im Vergleich geändert aus,
      // obwohl sich inhaltlich nichts getan hat.
      var w = { art: b.art };
      var gelesen = form.lesen();
      Object.keys(gelesen).forEach(function (k) { w[k] = gelesen[k]; });
      if (w.spalten) w.spalten = Number(w.spalten);
      return w;
    }, el: kasten };

    var koerper = neu('div', { klasse: 'bausteinkoerper' }, [form.el]);
    kasten.append(
      neu('div', { klasse: 'bausteinkopf' }, [
        neu('span', { klasse: 'art', text: plan.name }),
        neu('span', { klasse: 'wozu', text: plan.wozu }),
        neu('button', { type: 'button', klasse: 'klein', text: 'Hoch',
          onclick: function () { schieben(eintragung, -1); } }),
        neu('button', { type: 'button', klasse: 'klein', text: 'Runter',
          onclick: function () { schieben(eintragung, 1); } }),
        neu('button', { type: 'button', klasse: 'klein', text: 'Ein-/Ausklappen',
          onclick: function () { koerper.hidden = !koerper.hidden; } }),
        neu('button', { type: 'button', klasse: 'klein gefahr', text: 'Entfernen',
          onclick: function () {
            if (!confirm('Diesen Baustein entfernen?')) return;
            reihen.splice(reihen.indexOf(eintragung), 1);
            kasten.remove();
          } }),
      ]),
      koerper);
    reihen.push(eintragung);
    bausteinhalter.appendChild(kasten);
  }

  function schieben(eintragung, um) {
    var i = reihen.indexOf(eintragung), j = i + um;
    if (j < 0 || j >= reihen.length) return;
    reihen.splice(i, 1);
    reihen.splice(j, 0, eintragung);
    reihen.forEach(function (r) { bausteinhalter.appendChild(r.el); });
  }

  seite.bausteine.forEach(bausteinAnlegen);

  var wahl = neu('select');
  Object.keys(BAUSTEIN_PLAN).forEach(function (art) {
    wahl.appendChild(neu('option', { value: art, text: BAUSTEIN_PLAN[art].name }));
  });
  arbeit.appendChild(neu('div', { klasse: 'karte' }, [
    neu('h2', { text: 'Baustein hinzufügen' }),
    neu('div', { klasse: 'zeile' }, [wahl,
      neu('button', { text: 'Hinzufügen', onclick: function () {
        bausteinAnlegen({ art: wahl.value, spalten: 6 });
        bausteinhalter.lastChild.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } })]),
  ]));

  arbeit.appendChild(neu('div', { klasse: 'zeile' }, [
    neu('button', { klasse: 'primaer', text: 'Seite speichern', onclick: async function () {
      var kopfwerte = kopfform.lesen();
      seite.titel = kopfwerte.titel || seite.titel;
      seite.beschreibung = kopfwerte.beschreibung || '';
      seite.bausteine = reihen.map(function (r) { return r.lesen(); });
      meldung('Wird gespeichert …');
      try { await jsonSchreiben(akte, 'Redaktion: Seite ' + seite.titel); }
      catch (f) { meldung('Speichern fehlgeschlagen: ' + f.message, 'fehler'); return; }
      await bereichOeffnen('seiten');
      meldung('Gespeichert. Mit «Veröffentlichen» kommt es auf die Webseite.', 'ok');
    } }),
    neu('button', { text: 'Zurück ohne Speichern', onclick: function () { bereichOeffnen('seiten'); } }),
  ]));
}

/* =============================================== Einstellungen, Menü, Spenden
   Alle drei Masken arbeiten auf derselben Datei inhalt/einstellungen.json,
   nur mit anderem Ausschnitt. Darum ein gemeinsamer Bauer: Plan hinein,
   Formular heraus, beim Speichern werden nur die gezeigten Schlüssel
   überschrieben – die übrigen bleiben unangetastet. */
async function einstellungsmaske(titel, wo, plan) {
  var arbeit = leeren($('#arbeit'));
  arbeit.appendChild(neu('p', { klasse: 'wo', html: wo }));
  var akte = await jsonLesen('inhalt/einstellungen.json');
  var form = formularBauen(plan, akte.daten);
  var karte = neu('div', { klasse: 'karte' }, [form.el]);
  arbeit.appendChild(karte);
  arbeit.appendChild(neu('div', { klasse: 'zeile' }, [
    neu('button', { klasse: 'primaer', text: 'Speichern', onclick: async function () {
      var werte = form.lesen();
      // Nur die Schlüssel dieses Plans anfassen. Ein blosses Überschreiben
      // der ganzen Datei würde alles löschen, was gerade nicht im Formular
      // steht – das Menü verschwände beim Speichern der Adresse.
      plan.forEach(function (feld) {
        if (werte[feld.id] === undefined) delete akte.daten[feld.id];
        else akte.daten[feld.id] = werte[feld.id];
      });
      meldung('Wird gespeichert …');
      try { await jsonSchreiben(akte, 'Redaktion: ' + titel); }
      catch (f) { meldung('Speichern fehlgeschlagen: ' + f.message, 'fehler'); return; }
      meldung('Gespeichert. Mit «Veröffentlichen» kommt es auf die Webseite.', 'ok');
    } }),
  ]));
}

var VERWEIS = [
  { id: 'titel', art: 'text', name: 'Beschriftung' },
  { id: 'pfad', art: 'text', name: 'Ziel', hinweis: 'z. B. /angebot/' },
];

function menueZeigen() {
  return einstellungsmaske('Menü', 'Die Punkte oben im Kopf und die Zeile im Fuss.', [
    { id: 'menue', art: 'liste', name: 'Menü im Kopf', zufuegen: 'Menüpunkt hinzufügen', unter: VERWEIS },
    { id: 'menueKnopf', art: 'objekt', name: 'Knopf «Beratung» (nur auf dem Telefon sichtbar)', unter: VERWEIS },
    { id: 'spendenKnopf', art: 'objekt', name: 'Spendenknopf', unter: VERWEIS },
    { id: 'fusszeile', art: 'liste', name: 'Zeile im Fuss', zufuegen: 'Eintrag hinzufügen', unter: VERWEIS },
  ]);
}

function einstellungenZeigen() {
  return einstellungsmaske('Einstellungen', 'Name und Kontaktangaben. Sie stehen im Fuss jeder Seite '
    + 'und in allen Kontaktkacheln.', [
    { id: 'name', art: 'text', name: 'Name' },
    { id: 'untertitel', art: 'text', name: 'Untertitel' },
    { id: 'adresse', art: 'text', name: 'Adresse' },
    { id: 'telefon', art: 'text', name: 'Telefon, wie es dasteht', hinweis: 'z. B. 041 767 78 33' },
    { id: 'telefonWahl', art: 'text', name: 'Telefon zum Wählen', hinweis: 'z. B. +41417677833' },
    { id: 'mail', art: 'text', name: 'E-Mail' },
    { id: 'mailIntake', art: 'text', name: 'E-Mail für Anfragen' },
  ]);
}

function spendenZeigen() {
  return einstellungsmaske('Spenden', 'Steuert die Seite <a href="/spenden/" target="_blank" '
    + 'rel="noopener">Spenden</a>. Solange «Adresse des Zahlungsdienstleisters» leer ist, führt '
    + 'die Seite über Überweisung und E-Mail. Für Stripe kommt dort später die Adresse des '
    + 'Zahlungslinks hinein.', [
    { id: 'spenden', art: 'objekt', name: 'Spenden', unter: [
      { id: 'zahlungsziel', art: 'text', name: 'Adresse des Zahlungsdienstleisters',
        leerBehalten: true,
        hinweis: 'Leer = noch nicht eingerichtet. Hier kommt später der Stripe-Zahlungslink hinein.' },
      { id: 'betraegeEinmalig', art: 'zahlenliste', name: 'Beträge einmalig',
        hinweis: 'Durch Komma getrennt' },
      { id: 'betraegeMonatlich', art: 'zahlenliste', name: 'Beträge monatlich' },
      { id: 'zwecke', art: 'liste', name: 'Zwecke', zufuegen: 'Zweck hinzufügen', unter: [
        { id: 'kennung', art: 'text', name: 'Kennung', hinweis: 'ohne Leerzeichen' },
        { id: 'titel', art: 'text', name: 'Titel' },
        { id: 'text', art: 'text', name: 'Erklärung' },
      ] },
      { id: 'zahlungsarten', art: 'liste', name: 'Zahlungsarten', zufuegen: 'Zahlungsart hinzufügen', unter: [
        { id: 'kennung', art: 'text', name: 'Kennung',
          hinweis: 'Bei «ueberweisung» erscheinen die Kontoangaben' },
        { id: 'titel', art: 'text', name: 'Titel' },
        { id: 'hinweis', art: 'text', name: 'Hinweis' },
      ] },
      { id: 'konto', art: 'objekt', name: 'Spendenkonto', unter: [
        { id: 'inhaber', art: 'text', name: 'Kontoinhaber' },
        { id: 'iban', art: 'text', name: 'IBAN' },
        { id: 'bank', art: 'text', name: 'Bank und Ort' },
      ] },
    ] },
  ]);
}

/* ================================================================ Medien */
var MEDIENORTE = [
  { pfad: 'bilder', web: '/bilder/', name: 'Bilder der Webseite' },
  { pfad: 'statisch/wp-content/uploads/redaktion', web: '/wp-content/uploads/redaktion/',
    name: 'Von der Redaktion hochgeladen' },
];

async function medienZeigen() {
  var arbeit = leeren($('#arbeit'));
  arbeit.appendChild(neu('p', { klasse: 'wo', text:
    'Alle Bilder. Der Pfad hinter «Pfad kopieren» lässt sich in jedes Bildfeld einsetzen.' }));

  var wahl = neu('input', { type: 'file', accept: 'image/*', multiple: true });
  wahl.addEventListener('change', async function () {
    var dateien = Array.prototype.slice.call(wahl.files);
    if (!dateien.length) return;
    meldung(dateien.length + ' Bild(er) werden hochgeladen …');
    try {
      for (var i = 0; i < dateien.length; i++) await bildHochladen(dateien[i]);
    } catch (f) { meldung('Upload fehlgeschlagen: ' + f.message, 'fehler'); return; }
    await bereichOeffnen('medien');
    meldung('Hochgeladen.', 'ok');
  });
  arbeit.appendChild(neu('div', { klasse: 'karte' }, [
    neu('h2', { text: 'Bilder hochladen' }), wahl,
  ]));

  for (var n = 0; n < MEDIENORTE.length; n++) {
    var ort = MEDIENORTE[n];
    var karte = neu('div', { klasse: 'karte' }, [neu('h2', { text: ort.name })]);
    arbeit.appendChild(karte);
    var eintraege = [];
    try { eintraege = await api(ort.pfad); } catch (e) { eintraege = []; }
    var bilder = eintraege.filter(function (e) {
      return e.type === 'file' && /\.(jpe?g|png|gif|webp|svg)$/i.test(e.name);
    });
    if (!bilder.length) { karte.appendChild(neu('p', { klasse: 'still', text: 'Noch keine Bilder.' })); continue; }
    var gitter = neu('div', { klasse: 'medien' });
    karte.appendChild(gitter);
    bilder.forEach(function (bild) {
      var web = ort.web + bild.name;
      gitter.appendChild(neu('div', { klasse: 'medium' }, [
        neu('img', { src: web, alt: '', loading: 'lazy' }),
        neu('div', { klasse: 'name', text: bild.name }),
        neu('div', { klasse: 'tun' }, [
          neu('button', { text: 'Pfad', onclick: function () {
            var einzusetzen = ort.pfad === 'bilder' ? bild.name : web;
            navigator.clipboard.writeText(einzusetzen).then(
              function () { meldung('Kopiert: ' + einzusetzen, 'ok'); },
              function () { prompt('Pfad:', einzusetzen); });
          } }),
          neu('button', { klasse: 'gefahr', text: 'Löschen', onclick: async function () {
            if (!confirm(bild.name + ' wirklich löschen? Seiten, die es benutzen, zeigen danach eine Lücke.')) return;
            try { await api(bild.path, { method: 'DELETE', body: JSON.stringify({ message: 'Redaktion: Bild gelöscht' }) }); }
            catch (f) { meldung('Löschen fehlgeschlagen: ' + f.message, 'fehler'); return; }
            await bereichOeffnen('medien');
            meldung('Gelöscht.', 'ok');
          } }),
        ]),
      ]));
    });
  }
}

/* ============================================================== Übersicht */
async function uebersichtZeigen() {
  var arbeit = leeren($('#arbeit'));
  arbeit.appendChild(neu('p', { klasse: 'wo', text:
    'Änderungen werden erst sichtbar, wenn Sie oben rechts auf «Veröffentlichen» drücken. '
    + 'Bis dahin bleibt die Webseite, wie sie ist.' }));

  var gitter = neu('div', { klasse: 'kacheln' });
  arbeit.appendChild(gitter);

  var kacheln = [
    { id: 'news', was: 'Beiträge', ordner: 'quelle/news' },
    { id: 'stellen', was: 'Offene Stellen', ordner: 'quelle/stellen' },
    { id: 'team', was: 'Personen im Team', ordner: 'quelle/team' },
  ];
  kacheln.forEach(function (k) {
    var kachel = neu('div', { klasse: 'zahlkachel' }, [
      neu('div', { klasse: 'zahl', text: '…' }),
      neu('div', { klasse: 'was', text: k.was }),
      neu('button', { klasse: 'klein', text: 'Öffnen', onclick: function () { bereichOeffnen(k.id); } }),
    ]);
    gitter.appendChild(kachel);
    api(k.ordner).then(function (e) {
      kachel.querySelector('.zahl').textContent = e.filter(function (x) { return x.type === 'file'; }).length;
    }).catch(function () { kachel.querySelector('.zahl').textContent = '0'; });
  });

  var seitenkachel = neu('div', { klasse: 'zahlkachel' }, [
    neu('div', { klasse: 'zahl', text: '…' }),
    neu('div', { klasse: 'was', text: 'Feste Seiten' }),
    neu('button', { klasse: 'klein', text: 'Öffnen', onclick: function () { bereichOeffnen('seiten'); } }),
  ]);
  gitter.appendChild(seitenkachel);
  jsonLesen('inhalt/seiten.json').then(function (a) {
    seitenkachel.querySelector('.zahl').textContent = a.daten.length;
  }).catch(function () { seitenkachel.querySelector('.zahl').textContent = '?'; });

  arbeit.appendChild(neu('div', { klasse: 'karte' }, [
    neu('h2', { text: 'Schnell etwas erledigen' }),
    neu('div', { klasse: 'zeile' }, [
      neu('button', { klasse: 'primaer', text: 'Neuen Beitrag schreiben',
        onclick: function () { bereichId = 'news'; navAuffrischen(); eintragEditor('news', null); } }),
      neu('button', { text: 'Neues Stelleninserat',
        onclick: function () { bereichId = 'stellen'; navAuffrischen(); eintragEditor('stellen', null); } }),
      neu('button', { text: 'Seiten bearbeiten', onclick: function () { bereichOeffnen('seiten'); } }),
      neu('button', { text: 'Bilder verwalten', onclick: function () { bereichOeffnen('medien'); } }),
    ]),
  ]));

  var stand = neu('div', { klasse: 'karte' }, [
    neu('h2', { text: 'Stand' }),
    neu('p', { klasse: 'still', text: 'wird geladen …' }),
  ]);
  arbeit.appendChild(stand);
  fetch('/api/stand').then(function (a) { return a.ok ? a.json() : null; }).then(function (s) {
    leeren(stand);
    stand.appendChild(neu('h2', { text: 'Stand' }));
    if (!s) { stand.appendChild(neu('p', { klasse: 'still', text: 'Der Server gibt keine Auskunft.' })); return; }
    stand.appendChild(neu('p', { klasse: 'still',
      text: 'Fassung ' + s.stand + ', gestartet am ' + new Date(s.gestartet).toLocaleString('de-CH') + '.' }));
    if (!s.oeffentlich) {
      stand.appendChild(neu('p', { klasse: 'still', text:
        'Achtung: Es ist kein Ziel zum Aufschalten gesetzt (OEFFENTLICH). '
        + 'Veröffentlichen baut die Seiten, schaltet sie aber nicht auf.' }));
    }
  }).catch(function () { /* ohne Auskunft geht es auch */ });
}

/* ============================================================== Bereiche */
var BEREICHE = [
  { id: 'uebersicht', name: 'Übersicht', zeigen: uebersichtZeigen },
  { trenner: true },
  { id: 'news', name: 'Beiträge', zeigen: function () { return sammlungZeigen('news'); } },
  { id: 'stellen', name: 'Offene Stellen', zeigen: function () { return sammlungZeigen('stellen'); } },
  { id: 'team', name: 'Team', zeigen: function () { return sammlungZeigen('team'); } },
  { id: 'texte', name: 'Textbausteine', zeigen: function () { return sammlungZeigen('texte'); } },
  { trenner: true },
  { id: 'seiten', name: 'Seiten', zeigen: seitenZeigen },
  { id: 'medien', name: 'Bilder', zeigen: medienZeigen },
  { trenner: true },
  { id: 'menue', name: 'Menü & Fusszeile', zeigen: menueZeigen },
  { id: 'spenden', name: 'Spenden', zeigen: spendenZeigen },
  { id: 'einstellungen', name: 'Einstellungen', zeigen: einstellungenZeigen },
];

var bereichId = 'uebersicht';

function navAufbauen() {
  var nav = leeren($('#hauptnav'));
  BEREICHE.forEach(function (b) {
    if (b.trenner) { nav.appendChild(neu('div', { klasse: 'trenner' })); return; }
    nav.appendChild(neu('button', { text: b.name, 'data-bereich': b.id,
      onclick: function () { bereichOeffnen(b.id); } }));
  });
}

function navAuffrischen() {
  Array.prototype.forEach.call($('#hauptnav').querySelectorAll('button'), function (k) {
    k.setAttribute('aria-current', k.dataset.bereich === bereichId ? 'true' : 'false');
  });
}

async function bereichOeffnen(id) {
  var b = BEREICHE.filter(function (x) { return x.id === id; })[0];
  if (!b) return;
  bereichId = id;
  navAuffrischen();
  $('#bereich-titel').textContent = b.name;
  $('#leiste').classList.remove('offen');
  $('#burger').setAttribute('aria-expanded', 'false');
  meldung('');
  leeren($('#arbeit')).appendChild(neu('p', { klasse: 'still', text: 'wird geladen …' }));
  try { await b.zeigen(); }
  catch (f) { meldung('Konnte nicht geladen werden: ' + f.message, 'fehler'); }
}

/* ========================================================= Veröffentlichen */
async function veroeffentlichen() {
  var knopf = $('#knopf-veroeffentlichen');
  knopf.disabled = true;
  var alt = knopf.textContent;
  knopf.textContent = 'Wird aufgeschaltet …';
  meldung('Die Webseite wird gebaut – das dauert einen Moment.');
  try {
    var e = await (await fetch('/api/veroeffentlichen', {
      method: 'POST', headers: { 'x-redaktion': 'ja' } })).json();
    if (e.fehler) meldung('Veröffentlichen fehlgeschlagen: ' + e.fehler, 'fehler');
    else meldung('Veröffentlicht: ' + e.schritte.join(', ') + '.', 'ok');
  } catch (f) { meldung('Veröffentlichen fehlgeschlagen: ' + f.message, 'fehler'); }
  knopf.disabled = false;
  knopf.textContent = alt;
}

/* ================================================================ Anmeldung */
function anmeldungZeigen() {
  $('#ansicht-anmelden').hidden = false;
  $('#huelle').hidden = true;
}

function angemeldetZeigen() {
  $('#ansicht-anmelden').hidden = true;
  $('#huelle').hidden = false;
}

$('#form-anmelden').addEventListener('submit', async function (e) {
  e.preventDefault();
  var kasten = leeren($('#meldung-anmelden'));
  try {
    var antwort = await fetch('/api/anmelden', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-redaktion': 'ja' },
      body: JSON.stringify({ passwort: $('#passwort').value }),
    });
    var ergebnis = await antwort.json().catch(function () { return {}; });
    if (!antwort.ok) throw new Error(ergebnis.fehler || 'Anmeldung fehlgeschlagen');
  } catch (fehler) {
    kasten.appendChild(neu('div', { klasse: 'fehler', text: fehler.message }));
    return;
  }
  $('#passwort').value = '';
  angemeldetZeigen();
  bereichOeffnen('uebersicht');
});

$('#abmelden').addEventListener('click', async function () {
  await fetch('/api/abmelden', { method: 'POST', headers: { 'x-redaktion': 'ja' } });
  anmeldungZeigen();
});

$('#knopf-veroeffentlichen').addEventListener('click', veroeffentlichen);
$('#burger').addEventListener('click', function () {
  var offen = $('#leiste').classList.toggle('offen');
  $('#burger').setAttribute('aria-expanded', offen ? 'true' : 'false');
});

/* ==================================================================== Start */
navAufbauen();
(async function starten() {
  try {
    var probe = await fetch(API + 'quelle', { headers: { 'x-redaktion': 'ja' } });
    if (probe.ok) { angemeldetZeigen(); bereichOeffnen('uebersicht'); return; }
  } catch (e) { /* kein Server erreichbar */ }
  anmeldungZeigen();
})();

})();
