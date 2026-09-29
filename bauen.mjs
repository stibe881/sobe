// Baut aus inhalt/ (feste Seiten) und quelle/ (redaktionelle Inhalte) die
// fertige Webseite nach statisch/ – im Auftritt «Mosaik».
//
// Ohne Fremdpakete, damit auf dem Webhosting nichts nachgeladen werden muss.
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baustein, schuetzen } from './vorlagen/bausteine.mjs';
import { sprachenLesen, wortschatzLesen, uebersetzerBauen, datumLang, pfadFuer,
         inhaltUebersetzen } from './vorlagen/sprache.mjs';
import { sammlungLesen, markdownZuHtml, wordpressAufraeumen } from './vorlagen/inhalte.mjs';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const AUS = path.join(WURZEL, 'statisch');

const lesen = async (p) => JSON.parse(await readFile(path.join(WURZEL, p), 'utf8'));

function huelle({ titel, beschreibung, pfad, inhalt, einstellungen, sprache, sprachen, t }) {
  // «pfad» ist immer der deutsche Pfad – daran hängt die Markierung des
  // aktiven Menüpunkts. Ausgegeben wird der Pfad der jeweiligen Sprache.
  const menue = einstellungen.menue.map((m) => {
    const aktiv = m.pfad === pfad || (m.pfad !== '/' && pfad.startsWith(m.pfad));
    return `      <a href="${schuetzen(pfadFuer(m.pfad, sprache))}"${aktiv ? ' aria-current="page"' : ''}>${schuetzen(t(m.titel))}</a>`;
  }).join('\n');

  // Sprachwahl: Dieselbe Seite in der anderen Sprache. Der Pfad ist in allen
  // Sprachen gleich aufgebaut, nur mit anderem Anfang – darum genügt das
  // Umschreiben; es braucht keine Übersetzungstabelle der Adressen.
  // Vier Sprachen nebeneinander sprengen die Kopfleiste – selbst als
  // Kürzel: Der Knopf wurde so schmal, dass «DE» mitten im Wort umbrach.
  // Darum ein aufklappbares Feld. Es ist ein <details>, kein Skript: So
  // funktioniert es auch, wenn JavaScript ausfällt, und die Tastatur
  // bedient es von sich aus.
  const sprachwahl = sprachen.map((sp) => {
    const jetzt = sp.kennung === sprache.kennung;
    return `          <a lang="${sp.kennung}" hreflang="${sp.kennung}" href="${schuetzen(pfadFuer(pfad, sp))}"` +
      `${jetzt ? ' aria-current="true"' : ''}>${schuetzen(sp.name)}</a>`;
  }).join('\n');

  const wechselkoepfe = sprachen.map((sp) =>
    `<link rel="alternate" hreflang="${sp.kennung}" href="${schuetzen(pfadFuer(pfad, sp))}">`).join('\n') +
    `\n<link rel="alternate" hreflang="x-default" href="${schuetzen(pfad)}">`;

  return `<!doctype html>
<html lang="${sprache.kennung}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- iOS unterstreicht selbst erkannte Adressen und Nummern gepunktet.
     Im Fuss sah das aus wie ein Fehler; die Telefonnummer ist dort
     ohnehin schon ein richtiger Verweis. -->
<meta name="format-detection" content="telephone=no, address=no, date=no, email=no">
<title>${schuetzen(titel)} · ${schuetzen(einstellungen.name)}</title>
<meta name="description" content="${schuetzen(beschreibung)}">
${wechselkoepfe}
<link rel="stylesheet" href="/stil.css">
<script>
/* Vor dem ersten Zeichnen: Sonst blitzt die helle Fassung kurz auf, bevor
   das Skript am Seitenende den Dunkelmodus setzt – gerade für Menschen mit
   Lichtempfindlichkeit das Gegenteil von hilfreich. */
try {
  var z = JSON.parse(localStorage.getItem('sobe.zugang') || '{}');
  if (z.dunkel) document.documentElement.classList.add('dunkel');
  if (z.gross) document.documentElement.classList.add('grossschrift');
} catch (e) { /* Privates Fenster ohne Speicher: dann eben ohne Vorwahl. */ }
</script>
</head>
<body>
<a class="springen" href="#inhalt">${schuetzen(t('Zum Inhalt springen'))}</a>

<header class="kopf">
  <div class="kopfband">
    <a class="logo" href="${schuetzen(sprache.wurzel)}" aria-label="${schuetzen(einstellungen.name + ', ' + t('zur Startseite'))}"><img class="fuerhell" src="/bilder/logo.png" alt="${schuetzen(einstellungen.name)}"><img class="fuerdunkel" src="/bilder/logo-weiss.png" alt="" aria-hidden="true"></a>

    <div class="werkzeuge">
      <a class="werkzeug suchknopf-kopf" href="${schuetzen(pfadFuer('/suche/', sprache))}" aria-label="${schuetzen(t('Suchen'))}">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="19" height="19">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M15.4 15.4L21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </a>
      <details class="sprachwahl">
        <summary aria-label="${schuetzen(t('Sprache') + ': ' + sprache.name)}"><span aria-hidden="true">${schuetzen(sprache.kennung.toUpperCase())}</span></summary>
        <div class="sprachfeld">
          <p class="zugangstitel">${schuetzen(t('Sprache'))}</p>
${sprachwahl}
        </div>
      </details>
      <button id="zugang" class="werkzeug" aria-expanded="false" aria-controls="zugangsfeld" aria-label="${schuetzen(t('Barrierefreiheit'))}">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22">
          <circle cx="12" cy="4" r="2" fill="currentColor"/>
          <path d="M3.5 8.2c2.8.9 5.5 1.3 8.5 1.3s5.7-.4 8.5-1.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 9.5v5m0 0l-3 7m3-7l3 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div id="zugangsfeld" class="zugangsfeld" hidden>
        <p class="zugangstitel">${schuetzen(t('Barrierefreiheit'))}</p>
        <button type="button" class="schalter" data-schalter="vorlesen" aria-pressed="false">
          <span class="schaltertext"><span class="schaltername">${schuetzen(t('Vorlese-Modus'))}</span><span class="schalterhilfe">${schuetzen(t('Liest den Seiteninhalt laut vor.'))}</span></span><span class="ampel" aria-hidden="true"></span>
        </button>
        <button type="button" class="schalter" data-schalter="gross" aria-pressed="false">
          <span class="schaltertext"><span class="schaltername">${schuetzen(t('Grössere Schrift'))}</span><span class="schalterhilfe">${schuetzen(t('Vergrössert alle Texte um einen Viertel.'))}</span></span><span class="ampel" aria-hidden="true"></span>
        </button>
        <button type="button" class="schalter" data-schalter="dunkel" aria-pressed="false">
          <span class="schaltertext"><span class="schaltername">${schuetzen(t('Dunkler Modus'))}</span><span class="schalterhilfe">${schuetzen(t('Heller Text auf dunklem Grund.'))}</span></span><span class="ampel" aria-hidden="true"></span>
        </button>
        <p class="zugangsfuss">${schuetzen(t('Die Einstellungen bleiben auf diesem Gerät gespeichert.'))}</p>
      </div>
    </div>

    <button id="burger" class="burger" aria-expanded="false" aria-controls="menue" aria-label="${schuetzen(t('Menü'))}">☰</button>

    <nav id="menue" class="menue" aria-label="${schuetzen(t('Hauptnavigation'))}">
${menue}
      <form class="suchform" role="search" action="${schuetzen(pfadFuer('/suche/', sprache))}" method="get">
        <label class="nurlesen" for="suchfeld">${schuetzen(t('Auf der ganzen Webseite suchen'))}</label>
        <input id="suchfeld" class="suchfeld" type="search" name="q" placeholder="${schuetzen(t('Suchen'))}" autocomplete="off">
        <button class="suchknopf" type="submit" aria-label="${schuetzen(t('Suchen'))}">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M15.4 15.4L21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </form>
      <a class="knopf gelb nurschmal" href="${schuetzen(pfadFuer(einstellungen.menueKnopf.pfad, sprache))}">${schuetzen(t(einstellungen.menueKnopf.titel))}</a>
      <!-- Ohne Bildzeichen: Ein Herz neben dem Wort machte aus dem Knopf in
           der engen Kopfleiste einen Kreis, aus dem der Text herauslief.
           Das Wort allein sagt dasselbe und verträgt jede Breite. -->
      <a class="knopf spende" href="${schuetzen(pfadFuer(einstellungen.spendenKnopf.pfad, sprache))}">${schuetzen(t(einstellungen.spendenKnopf.titel))}</a>
    </nav>
  </div>
</header>

<main id="inhalt">
  <div class="raster">
${inhalt}
    <div class="kachel nacht fussk">
      <img src="/bilder/logo-weiss.png" alt="${schuetzen(einstellungen.name)}">
      <p class="fussort"><span class="anschrift">${einstellungen.adresse.split('·').map((teil) => `<span class="zusammen">${schuetzen(teil.trim())}</span>`).join('<span class="punkt" aria-hidden="true">·</span>')}</span><span class="punkt trenner" aria-hidden="true">·</span><a class="hell zusammen" href="tel:${schuetzen(einstellungen.telefonWahl)}">${schuetzen(einstellungen.telefon)}</a></p>
      <nav class="rechts" aria-label="${schuetzen(t('Rechtliche Hinweise'))}">${einstellungen.fusszeile.map((f) => `<a href="${schuetzen(pfadFuer(f.pfad, sprache))}">${schuetzen(t(f.titel))}</a>`).join('')}</nav>
    </div>
  </div>
</main>

<script>window.SOBE = ${JSON.stringify({
  wurzel: sprache.wurzel,
  sprache: sprache.kennung,
  gebietsschema: sprache.gebietsschema,
  texte: Object.fromEntries([
    'Vorlese-Modus', 'Vorlesen', 'Pause', 'Beenden',
    'Bereit. Auf «Vorlesen» drücken.', 'Liest vor …', 'Fertig gelesen.',
    'Auf dieser Seite ist nichts zu lesen.', 'Dieser Browser kann nicht vorlesen.',
    'Bitte geben Sie einen Suchbegriff ein.', 'Wird gesucht …',
    'Keine Treffer für', 'Treffer', 'Stelle', 'Stellen',
    'Versuchen Sie einen kürzeren Begriff, oder sehen Sie im Menü nach.',
    'Das Verzeichnis konnte nicht geladen werden. Bitte die Seite neu laden.',
  ].map((s) => [s, t(s)])),
})};</script>
<script src="/seite.js" defer></script>
</body>
</html>
`;
}

// Zieht den blossen Lesetext aus einem erzeugten Abschnitt. Der Suchindex
// entsteht so aus genau dem, was auch auf der Seite steht – nicht aus einer
// zweiten, still auseinanderlaufenden Quelle.
function nurText(html) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|#160);/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&(quot|#34);/g, '"').replace(/&(#39|apos);/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function bauen() {
  const einstellungen = await lesen('inhalt/einstellungen.json');
  const seitenDe = await lesen('inhalt/seiten.json');
  const sprachen = await sprachenLesen(WURZEL);

  const beitraegeDe = (await sammlungLesen(WURZEL, 'news'))
    .sort((a, b) => String(b.datum || '').localeCompare(String(a.datum || '')));
  const stellenDe = (await sammlungLesen(WURZEL, 'stellen'))
    .sort((a, b) => a.reihenfolge - b.reihenfolge);
  const teamDe = (await sammlungLesen(WURZEL, 'team'))
    .sort((a, b) => a.reihenfolge - b.reihenfolge);

  // Nur die erzeugten Teile räumen – der Bestand bleibt liegen.
  for (const eintrag of existsSync(AUS) ? await readdir(AUS) : []) {
    if (eintrag === 'wp-content') continue;
    await rm(path.join(AUS, eintrag), { recursive: true, force: true });
  }
  await mkdir(AUS, { recursive: true });

  const adressen = [];
  const fehlendGesamt = {};

  for (const sprache of sprachen) {
    const wortschatz = await wortschatzLesen(WURZEL, sprache.kennung);
    const fehlend = new Set();
    const t = uebersetzerBauen(sprache, wortschatz, fehlend);
    const ue = (x) => inhaltUebersetzen(x, t, sprache);
    // Deutsch liegt an der Wurzel, die übrigen Sprachen je in einem
    // Unterordner. Dateien und Bilder bleiben einmalig an der Wurzel.
    const aus = sprache.standard ? AUS : path.join(AUS, sprache.kennung);

    const beitraege = beitraegeDe.map((x) => ({ ...x, titel: t(x.titel), bildAlt: t(x.bildAlt || '') }));
    const stellen = stellenDe.map((x) => ({ ...x, titel: t(x.titel),
      pensum: t(x.pensum || ''), eintritt: t(x.eintritt || ''), bereich: t(x.bereich || '') }));
    const team = teamDe.map((x) => ({ ...x, funktion: t(x.funktion || '') }));
    const hilfe = { einstellungen, beitraege, stellen, team, t, sprache };
    const rahmen = { einstellungen, sprache, sprachen, t };
    const verzeichnis = [];

    const schreiben = async (pfad, html) => {
      const ziel = path.join(aus, pfad === '/' ? '' : pfad, 'index.html');
      await mkdir(path.dirname(ziel), { recursive: true });
      await writeFile(ziel, html, 'utf8');
      adressen.push(pfadFuer(pfad, sprache));
    };

    // ---------------------------------------------------------- feste Seiten
    for (const s of seitenDe) {
      // Der eigene Pfad bleibt deutsch: Daran hängt die Markierung des
      // aktiven Menüpunkts, und die Sprachwahl schreibt ihn selbst um.
      const inhalt = ue(s.bausteine).map((b) => '    ' + baustein(b, hilfe)).join('\n');
      await schreiben(s.pfad, huelle({ ...rahmen, titel: t(s.titel),
        beschreibung: t(s.beschreibung || ''), pfad: s.pfad, inhalt }));
      verzeichnis.push({ t: t(s.titel), p: pfadFuer(s.pfad, sprache), a: t('Seite'), x: nurText(inhalt) });
    }

    // ------------------------------------------------------------- Beiträge
    for (const p of beitraegeDe) {
      // Erst aufräumen, dann übersetzen: Der Wortschatz soll die lesbare
      // Fassung tragen, nicht den WordPress-Wildwuchs.
      const rumpfDe = p.markdown ? markdownZuHtml(p.rumpf) : wordpressAufraeumen(p.rumpf);
      const rumpf = t(rumpfDe);
      const titel = t(p.titel);
      const teile = [];
      if (p.bild) teile.push({ art: 'bild', spalten: 6, quelle: p.bild, alt: t(p.bildAlt || '') });
      teile.push({ art: 'rohtext', spalten: 4, marke: `${t('Aktuell')} · ${datumLang(p.datum, sprache)}`,
        titel, html: rumpf || `<p>${t('Dieser Beitrag hat noch keinen Text.')}</p>` });
      const weitere = beitraege.filter((x) => x.kennung !== p.kennung).slice(0, 3);
      teile.push({ art: 'kachel', spalten: 2, farbe: 'gelb', titel: t('Weitere Beiträge'),
        links: weitere.map((x) => ({ titel: x.titel, pfad: pfadFuer(`/aktuell/${x.kennung}/`, sprache) })) });
      const inhalt = teile.map((b) => '    ' + baustein(b, hilfe)).join('\n');
      await schreiben(`/aktuell/${p.kennung}/`, huelle({ ...rahmen,
        titel, beschreibung: titel, pfad: '/aktuell/', inhalt }));
      verzeichnis.push({ t: titel, p: pfadFuer(`/aktuell/${p.kennung}/`, sprache), a: t('Beitrag'),
        d: p.datum || '', x: nurText(rumpf) });
    }

    // -------------------------------------------------------------- Stellen
    for (const s of stellenDe) {
      const rumpf = t(s.markdown ? markdownZuHtml(s.rumpf) : wordpressAufraeumen(s.rumpf));
      const titel = t(s.titel);
      const teile = [
        { art: 'held', spalten: 6, marke: t('Offene Stellen'), markeZiel: pfadFuer('/jobs/', sprache),
          titel, text: [t(s.pensum || ''), s.eintritt && `${t('Eintritt')} ${t(s.eintritt)}`, 'Baar']
            .filter(Boolean).join(' · ') },
        { art: 'rohtext', spalten: 4, html: rumpf || `<p>${t('Diese Ausschreibung hat noch keinen Text.')}</p>` },
        { art: 'aufruf', spalten: 2, farbe: 'gelb', titel: t('Bewerbung'),
          knopf: { titel: t('Jetzt bewerben'),
            pfad: s.bewerbungslink
              || `mailto:${einstellungen.mail}?subject=${encodeURIComponent(t('Bewerbung') + ' ' + titel)}` } },
      ];
      const inhalt = teile.map((b) => '    ' + baustein(b, hilfe)).join('\n');
      await schreiben(`/jobs/${s.kennung}/`, huelle({ ...rahmen,
        titel, beschreibung: titel, pfad: '/jobs/', inhalt }));
      verzeichnis.push({ t: titel, p: pfadFuer(`/jobs/${s.kennung}/`, sprache), a: t('Offene Stelle'),
        x: nurText([t(s.pensum || ''), t(s.eintritt || ''), t(s.bereich || ''), rumpf].filter(Boolean).join(' ')) });
    }

    // ---------------------------------------------------------------- Suche
    const suchseite = `    <div class="kachel petrol s6">
      <p class="marke">${schuetzen(t('Suche'))}</p>
      <h1>${schuetzen(t('Auf der ganzen Webseite suchen'))}</h1>
      <form class="grosssuche" role="search" action="${schuetzen(pfadFuer('/suche/', sprache))}" method="get">
        <label class="nurlesen" for="grossfeld">${schuetzen(t('Suchbegriff'))}</label>
        <input id="grossfeld" name="q" type="search" placeholder="${schuetzen(t('Zum Beispiel: Logopädie, Aufnahme, Sporttag'))}" autocomplete="off" autofocus>
        <button class="knopf gelb" type="submit">${schuetzen(t('Suchen'))}</button>
      </form>
    </div>
    <div class="kachel s6">
      <p id="suchlage" class="marke" role="status" aria-live="polite">${schuetzen(t('Bitte geben Sie einen Suchbegriff ein.'))}</p>
      <div id="suchergebnis"></div>
      <noscript><p class="hinweis">${schuetzen(t('Die Suche braucht JavaScript. Ohne JavaScript finden Sie die Inhalte über das Menü.'))}</p></noscript>
    </div>`;
    await schreiben('/suche/', huelle({ ...rahmen, titel: t('Suche'),
      beschreibung: t('Auf der ganzen Webseite suchen'), pfad: '/suche/', inhalt: suchseite }));

    await writeFile(path.join(aus, 'suche.json'), JSON.stringify(verzeichnis), 'utf8');
    if (fehlend.size) fehlendGesamt[sprache.kennung] = [...fehlend].sort();
  }

  // -------------------------------------------------------- Beiwerk
  // Stil, Skript und Bilder liegen einmal an der Wurzel – sie sind in allen
  // Sprachen dieselben, und pfadFuer lässt Dateien darum unangetastet.
  await cp(path.join(WURZEL, 'vorlagen/stil.css'), path.join(AUS, 'stil.css'));
  await cp(path.join(WURZEL, 'vorlagen/seite.js'), path.join(AUS, 'seite.js'));
  await cp(path.join(WURZEL, 'bilder'), path.join(AUS, 'bilder'), { recursive: true });
  if (existsSync(path.join(WURZEL, 'werkzeuge/404-seite.html'))) {
    await cp(path.join(WURZEL, 'werkzeuge/404-seite.html'), path.join(AUS, '404.html'));
  }

  await writeFile(path.join(AUS, 'sitemap.txt'), adressen.join('\n') + '\n', 'utf8');
  // Was noch nicht übersetzt ist, steht hier – daraus arbeiten das
  // Übersetzungswerkzeug und die Redaktion.
  await writeFile(path.join(WURZEL, 'inhalt/uebersetzungen/fehlend.json'),
    JSON.stringify(fehlendGesamt, null, 2) + '\n', 'utf8');
  return adressen.length;
}

const direkt = process.argv[1] && process.argv[1].endsWith('bauen.mjs');
if (direkt) {
  bauen().then((n) => {
    console.log(`${n} Seiten nach statisch/ gebaut`);
    const fehlend = JSON.parse(readFileSync(path.join(WURZEL, 'inhalt/uebersetzungen/fehlend.json'), 'utf8'));
    const offen = Object.entries(fehlend).map(([k, v]) => `${k}: ${v.length}`).join(', ');
    if (offen) console.log(`Noch nicht übersetzt – ${offen}. Mit «npm run uebersetzen» nachführen.`);
  });
}
