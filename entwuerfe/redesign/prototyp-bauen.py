# -*- coding: utf-8 -*-
"""Baut den klickbaren Prototyp der Richtung 2 «Mosaik».

Eine einzige Datei: Bilder eingebettet, Navigation über den Anker (#/…),
damit Vor und Zurück im Browser funktionieren. Die Entwurfstafeln sind fest
1280 Punkte breit – hier ist das Raster beweglich, damit sich der Prototyp
auf dem Telefon so verhält wie später die echte Seite.
"""
import base64, os

Q = '/home/user/sobe/entwuerfe/redesign'
ZIEL = f'{Q}/prototyp-mosaik.html'


def bild(name, mime):
    with open(os.path.join(Q, name), 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()


B = {
    'logo': bild('logo.png', 'image/png'),
    'logoweiss': bild('logo-weiss.png', 'image/png'),
    'aquarell': bild('aquarell.jpg', 'image/jpeg'),
    'malen': bild('malen.jpg', 'image/jpeg'),
    'fussball': bild('fussball.jpg', 'image/jpeg'),
    'campus': bild('campus.jpg', 'image/jpeg'),
}

STIL = """
:root {
  --petrol: #14514a; --nacht: #212934; --gelb: #fbb500;
  --grund: #f2f1ec; --weiss: #ffffff; --text: #212934; --grau: #565851;
  --linie: #e3e1d6; --rund: 22px;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { transition: none !important; animation: none !important; } }
body {
  margin: 0; background: var(--grund); color: var(--text);
  font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  font-size: 17px; line-height: 1.55;
}
a { color: var(--petrol); text-decoration: none; font-weight: 600; }
a:hover { text-decoration: underline; }
:focus-visible { outline: 3px solid var(--petrol); outline-offset: 3px; border-radius: 6px; }
h1, h2, h3 { margin: 0; line-height: 1.2; }
img { display: block; max-width: 100%; }

.springen { position: absolute; left: -9999px; top: 0; background: var(--weiss); padding: 12px 18px; border-radius: 12px; z-index: 50; }
.springen:focus { left: 16px; top: 16px; }

/* ---------------------------------------------------------- Kopfbereich */
.kopf { position: sticky; top: 0; z-index: 30; padding: 14px 20px 0; }
.kopfband {
  max-width: 1240px; margin: 0 auto; background: var(--weiss); border-radius: 999px;
  box-shadow: 0 2px 14px rgba(33, 41, 52, 0.09); padding: 12px 16px 12px 26px;
  display: flex; align-items: center; gap: 22px;
}
.kopfband img { height: 30px; width: auto; }
.menue { display: flex; gap: 22px; margin-left: auto; align-items: center; }
.menue a { color: var(--text); font-weight: 600; padding: 6px 2px; border-bottom: 2px solid transparent; }
.menue a:hover { text-decoration: none; border-bottom-color: var(--linie); }
.menue a[aria-current="page"] { border-bottom-color: var(--gelb); }
.knopf {
  display: inline-block; background: var(--nacht); color: var(--weiss); border-radius: 999px;
  padding: 12px 24px; font-weight: 700; font-size: 16px; border: 0; cursor: pointer; font-family: inherit;
}
.knopf:hover { text-decoration: none; background: #313b48; }
.knopf.gelb { background: var(--gelb); color: var(--nacht); }
.knopf.gelb:hover { background: #e5a600; }
.burger { display: none; margin-left: auto; background: none; border: 0; padding: 8px 10px; font-size: 26px; line-height: 1; cursor: pointer; color: var(--text); border-radius: 12px; }

/* ------------------------------------------------------------- Baukasten */
main { max-width: 1240px; margin: 0 auto; padding: 18px 20px 40px; }
.raster { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; }
.kachel { background: var(--weiss); border-radius: var(--rund); padding: 30px; grid-column: span 6; }
.kachel.petrol { background: var(--petrol); color: var(--weiss); }
.kachel.gelb { background: var(--gelb); color: var(--nacht); }
.kachel.nacht { background: var(--nacht); color: #aeb4bd; }
.kachel.bild { padding: 0; overflow: hidden; }
.kachel.bild img { width: 100%; height: 100%; min-height: 200px; object-fit: cover; }
.kachel h2 { font-size: 26px; }
.kachel .lauf { color: var(--grau); }
.petrol .lauf, .nacht .lauf { color: #cfe0dc; }
.marke { font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; color: var(--grau); }
.petrol .marke { color: #8fb8b0; }
.liste { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.reihe { display: flex; gap: 20px; padding: 13px 0; border-bottom: 1px solid var(--linie); align-items: baseline; flex-wrap: wrap; }
.reihe:last-child { border-bottom: 0; }
.reihe .datum { flex: none; width: 130px; color: var(--grau); font-size: 14.5px; }
.reihe .inhalt { flex: 1; min-width: 200px; }
.held { font-size: clamp(30px, 5vw, 46px); font-weight: 800; line-height: 1.08; }
.gross { font-size: clamp(22px, 3vw, 30px); font-weight: 800; }
.fliess { color: var(--grau); }
.petrol .fliess { color: #cfe0dc; }
.nacht .fliess { color: #aeb4bd; }
.paar { display: flex; gap: 22px; align-items: center; flex-wrap: wrap; }
.tel { font-size: 20px; font-weight: 800; }
.hinweis { font-size: 14.5px; color: var(--grau); background: #fdf3da; border-radius: 14px; padding: 12px 16px; margin-top: 16px; }
.nacht a, .petrol a { color: var(--gelb); }
.fussk { grid-column: span 6; display: flex; gap: 22px; align-items: center; flex-wrap: wrap; font-size: 15px; }
.fussk img { height: 22px; width: auto; }
.fussk .rechts { display: flex; gap: 20px; margin-left: auto; flex-wrap: wrap; }
.fussk a { color: #cfd3da; font-weight: 500; }
.protokoll { grid-column: span 6; font-size: 14px; color: var(--grau); text-align: center; padding: 6px 0 0; }

/* Spannweiten nur ab Tablet – darunter steht jede Kachel allein. */
@media (min-width: 720px) {
  .s2 { grid-column: span 3; } .s3 { grid-column: span 3; }
  .s4 { grid-column: span 6; }
}
@media (min-width: 1000px) {
  .s2 { grid-column: span 2; } .s3 { grid-column: span 3; } .s4 { grid-column: span 4; }
}
@media (max-width: 860px) {
  body { font-size: 16px; }
  .menue {
    display: none; position: absolute; left: 20px; right: 20px; top: 74px;
    background: var(--weiss); border-radius: var(--rund); box-shadow: 0 10px 30px rgba(33, 41, 52, 0.16);
    flex-direction: column; align-items: stretch; gap: 0; padding: 10px;
  }
  .menue.offen { display: flex; }
  .menue a { padding: 13px 14px; border-bottom: 1px solid var(--linie); }
  .menue a:last-of-type { border-bottom: 0; }
  .menue .knopf { text-align: center; margin: 10px 4px 4px; }
  .burger { display: block; }
  .kachel { padding: 22px; }
  .reihe .datum { width: auto; }
}
"""

JS = """
(function () {
  var seiten = Array.prototype.slice.call(document.querySelectorAll('[data-seite]'));
  var menue = document.getElementById('menue');
  var burger = document.getElementById('burger');

  function zeigen(name, scrollen) {
    var treffer = seiten.filter(function (s) { return s.dataset.seite === name; })[0] || seiten[0];
    seiten.forEach(function (s) { s.hidden = s !== treffer; });
    document.querySelectorAll('.menue a[data-ziel]').forEach(function (a) {
      if (a.dataset.ziel === treffer.dataset.seite) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = treffer.dataset.titel + ' · SONNENBERG';
    menue.classList.remove('offen');
    burger.setAttribute('aria-expanded', 'false');
    if (scrollen) window.scrollTo(0, 0);
    var h1 = treffer.querySelector('h1');
    if (h1 && scrollen) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }

  function ausAnker() {
    var name = (location.hash || '#/start').replace('#/', '');
    zeigen(name, false);
  }

  window.addEventListener('hashchange', function () {
    var name = (location.hash || '#/start').replace('#/', '');
    zeigen(name, true);
  });

  burger.addEventListener('click', function () {
    var offen = menue.classList.toggle('offen');
    burger.setAttribute('aria-expanded', offen ? 'true' : 'false');
  });

  // Im Prototyp nicht hinterlegte Ziele sagen das, statt ins Leere zu führen.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-offen]');
    if (!a) return;
    e.preventDefault();
    var meldung = document.getElementById('meldung');
    meldung.textContent = a.dataset.offen;
    meldung.hidden = false;
    clearTimeout(meldung._t);
    meldung._t = setTimeout(function () { meldung.hidden = true; }, 4000);
  });

  ausAnker();
})();
"""

MENUE = [
    ('start', 'Start'), ('angebot', 'Angebot'), ('aufnahme', 'Aufnahme'),
    ('aktuell', 'Aktuell'), ('ueber-uns', 'Über uns'),
]

PLATZ = ('Aktuell sind unsere Plätze in allen Angeboten belegt. Im Bereich Blinden- und Low '
         'Vision-Pädagogik kann sich nach Absprache eventuell noch eine Möglichkeit für das '
         'Schuljahr 2026/27 ergeben. Anfragen für das Schuljahr 2027/28 werden ab Anfang '
         'September 2026 bearbeitet.')

KEIN_PDF = 'Im Prototyp ist kein PDF hinterlegt.'
KEINE_SEITE = 'Diese Unterseite ist im Prototyp nicht ausgearbeitet.'


def fuss():
    return f"""      <div class="kachel nacht fussk">
        <img src="{B['logoweiss']}" alt="SONNENBERG">
        <div>Landhausstrasse 20 · 6340 Baar · <a href="tel:+41417677833">041 767 78 33</a></div>
        <div class="rechts">
          <a href="#" data-offen="{KEINE_SEITE}">Jobs</a>
          <a href="#" data-offen="{KEINE_SEITE}">Impressum</a>
          <a href="#" data-offen="{KEINE_SEITE}">Datenschutz</a>
          <a href="#" data-offen="{KEINE_SEITE}">Barrierefreiheit</a>
        </div>
      </div>
      <p class="protokoll">Klickbarer Prototyp der Gestaltungsrichtung «Mosaik» – nicht die öffentliche Webseite.</p>"""


def seite(name, titel, inhalt):
    return f"""  <section data-seite="{name}" data-titel="{titel}" hidden>
    <div class="raster">
{inhalt}
{fuss()}
    </div>
  </section>
"""


SEITEN = []

# ------------------------------------------------------------------- Start
SEITEN.append(seite('start', 'Start', f"""      <div class="kachel petrol s4" style="display: flex; flex-direction: column; justify-content: center; gap: 18px;">
        <h1 class="held">Wir begleiten, fördern und unterstützen mit Herz.</h1>
        <p class="fliess" style="font-size: 18px; margin: 0;">Das Kompetenzzentrum für Sehen, Verhalten und Sprechen in Baar.</p>
        <p style="margin: 0;"><a class="knopf gelb" href="#/aufnahme">Aufnahme &amp; Beratung</a></p>
      </div>
      <div class="kachel bild s2"><img src="{B['aquarell']}" alt="Kinder malen mit Wasserfarben"></div>

      <div class="kachel s2">
        <h2>Für Eltern</h2>
        <div class="liste">
          <a href="#/aufnahme">So läuft eine Aufnahme ab</a>
          <a href="#/angebot">Unsere Angebote</a>
          <a href="#/aufnahme">Beratungsgespräch vereinbaren</a>
        </div>
      </div>
      <div class="kachel s2">
        <h2>Für Gemeinden &amp; Kanton</h2>
        <div class="liste">
          <a href="#/gemeinden">Zuweisung &amp; Platzsituation</a>
          <a href="#/gemeinden">Jahresberichte &amp; Kennzahlen</a>
          <a href="#/gemeinden">Ansprechpersonen Intake</a>
        </div>
      </div>
      <div class="kachel s2">
        <h2>Für Fachpersonen</h2>
        <div class="liste">
          <a href="#/angebot-sehen">Fachstellen Sehen &amp; Autismus</a>
          <a href="#" data-offen="{KEINE_SEITE}">Beratung für Regelschulen</a>
          <a href="#" data-offen="{KEINE_SEITE}">Lehrmittel &amp; Shop</a>
        </div>
      </div>

      <div class="kachel gelb s2">
        <h2>Direkt erreichbar</h2>
        <p class="lauf" style="color: #4a3c00; margin: 8px 0 12px;">Das Intake hört zu und hilft weiter.</p>
        <p class="tel" style="margin: 0;"><a href="tel:+41417677833" style="color: var(--nacht);">041 767 78 33</a></p>
      </div>
      <div class="kachel s4">
        <div class="paar" style="justify-content: space-between;">
          <h2>Aktuell</h2>
          <a href="#/aktuell">Alle Beiträge</a>
        </div>
        <div style="margin-top: 10px;">
          <div class="reihe"><div class="datum">13. August 2026</div><div class="inhalt"><a href="#/beitrag">European Inclusion Cup: Ein Wochenende voller Fussball, Begegnungen und gelebter Inklusion</a></div></div>
          <div class="reihe"><div class="datum">12. Juni 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">SONNENBERG Sporttag – Spiel, Spass und Teamgeist</a></div></div>
          <div class="reihe"><div class="datum">1. Juni 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">Feuerwehrübung auf dem SONNENBERG-Areal</a></div></div>
        </div>
      </div>"""))

# ----------------------------------------------------------------- Angebot
ANGEBOTE = [
    ('Sehen', 'Schule und Beratung für blinde und sehbeeinträchtigte Kinder und Jugendliche.', '#/angebot-sehen', None),
    ('Sehen Plus', 'Für Kinder mit Sehbeeinträchtigung und weiteren Behinderungen.', '#', KEINE_SEITE),
    ('Erwachsene Sehen Plus', 'Wohnen und Tagesstruktur für Erwachsene.', '#', KEINE_SEITE),
    ('Verhalten und Sprache', 'Sonderschule mit Sprachheil- und Verhaltenspädagogik.', '#', KEINE_SEITE),
    ('Verhalten Plus', 'Spezialisierter Unterricht in kleinsten Gruppen.', '#', KEINE_SEITE),
]
kacheln = ''
for titel, text, ziel, offen in ANGEBOTE:
    attr = f' data-offen="{offen}"' if offen else ''
    kacheln += f"""      <div class="kachel s2">
        <h2 style="font-size: 22px;"><a href="{ziel}"{attr}>{titel}</a></h2>
        <p class="fliess" style="margin: 8px 0 0;">{text}</p>
      </div>
"""

SEITEN.append(seite('angebot', 'Angebot', f"""      <div class="kachel petrol">
        <h1 class="held" style="font-size: clamp(26px, 4vw, 38px);">Angebot</h1>
        <p class="fliess" style="margin: 10px 0 0;">Fünf Angebote unter einem Dach – dazu Therapie, Internat und Beratung.</p>
      </div>
{kacheln}      <div class="kachel gelb s2">
        <h2 style="font-size: 20px;">Ergänzend</h2>
        <div class="liste">
          <a href="#" data-offen="{KEINE_SEITE}" style="color: var(--nacht);">Therapieangebot</a>
          <a href="#" data-offen="{KEINE_SEITE}" style="color: var(--nacht);">Internat</a>
        </div>
      </div>
      <div class="kachel s4">
        <div class="paar" style="justify-content: space-between;">
          <h2 class="gross" style="max-width: 32ch;">Nicht sicher, welches Angebot passt? Wir klären es gemeinsam.</h2>
          <a class="knopf" href="#/aufnahme">Zur Aufnahme</a>
        </div>
        <p class="hinweis">Im Prototyp ist stellvertretend die Detailseite «Sehen» ausgearbeitet.</p>
      </div>"""))

# ----------------------------------------------------------- Angebot Sehen
SEITEN.append(seite('angebot-sehen', 'Angebot Sehen', f"""      <div class="kachel petrol s4">
        <p class="marke" style="margin: 0;"><a href="#/angebot" style="color: #8fb8b0;">Angebot</a></p>
        <h1 class="held" style="margin-top: 6px;">Sehen</h1>
        <p class="fliess" style="margin: 12px 0 0;">Schule und Beratung für blinde und sehbeeinträchtigte Kinder und Jugendliche – von der Primarschule bis zur Berufsintegration.</p>
      </div>
      <div class="kachel bild s2"><img src="{B['malen']}" alt="Eine Hand malt mit Pinsel und grüner Farbe"></div>

      <div class="kachel s2">
        <h2 style="font-size: 20px;">Für wen</h2>
        <p class="fliess" style="margin: 8px 0 0;">Blinde und sehbeeinträchtigte Kinder und Jugendliche in Primarschule und Oberstufe, begleitet bis in die Berufswelt.</p>
      </div>
      <div class="kachel s2">
        <h2 style="font-size: 20px;">Unterricht</h2>
        <p class="fliess" style="margin: 8px 0 0;">Kleingruppen nach dem Lehrplan der öffentlichen Schule, bei Bedarf mit angepassten Lernzielen – separativ oder integrativ.</p>
      </div>
      <div class="kachel s2">
        <h2 style="font-size: 20px;">Begleitung</h2>
        <p class="fliess" style="margin: 8px 0 0;">Lehrpersonen, Rehabilitationsfachpersonen und Therapeut*innen – für ein selbstständiges, integriertes Erwachsenenleben.</p>
      </div>

      <div class="kachel s3">
        <h2 style="font-size: 20px;">Ansprechperson</h2>
        <p style="margin: 10px 0 0; font-weight: 700;">Claudia Friedli-Hutter</p>
        <p class="fliess" style="margin: 4px 0 0;"><a href="mailto:claudia.friedli@sonnenberg-baar.ch">claudia.friedli@sonnenberg-baar.ch</a> · <a href="tel:+41417677833">041 767 78 33</a></p>
      </div>
      <div class="kachel s3">
        <h2 style="font-size: 20px;">Unterlagen</h2>
        <div class="liste">
          <a href="#" data-offen="{KEIN_PDF}">Flyer Blinden- und Low Vision-Pädagogik</a>
          <a href="#" data-offen="{KEIN_PDF}">Therapieangebot</a>
          <a href="#" data-offen="{KEIN_PDF}">Schulferien und schulfreie Tage</a>
        </div>
      </div>

      <div class="kachel gelb">
        <div class="paar" style="justify-content: space-between;">
          <h2 class="gross" style="max-width: 32ch;">Könnte das Angebot Sehen zu Ihrem Kind passen?</h2>
          <a class="knopf" href="#/aufnahme">Aufnahme &amp; Beratung</a>
        </div>
      </div>"""))

# ---------------------------------------------------------------- Aufnahme
SCHRITTE = [
    ('1', 'Kontakt aufnehmen', 'Ein Anruf oder eine Mail ans Intake genügt. Wir hören zu und klären die erste Frage: Passt der SONNENBERG?'),
    ('2', 'Abklärung', 'Gespräch, Unterlagen, Schnuppern: Gemeinsam mit Eltern und zuweisender Stelle klären wir den Bedarf.'),
    ('3', 'Entscheid', 'Die Kostengutsprache läuft über Wohngemeinde und Kanton – wir begleiten den Ablauf und wissen, was wo nötig ist.'),
    ('4', 'Eintritt', 'Sorgfältig vorbereitet, mit fester Bezugsperson – in Schule, Internat oder Tagesstruktur.'),
]
schritt_kacheln = ''.join(f"""      <div class="kachel s3">
        <p class="marke" style="font-size: 30px; letter-spacing: 0; color: var(--petrol); margin: 0;">{nr}</p>
        <h2 style="font-size: 20px; margin-top: 6px;">{titel}</h2>
        <p class="fliess" style="margin: 8px 0 0;">{text}</p>
      </div>
""" for nr, titel, text in SCHRITTE)

SEITEN.append(seite('aufnahme', 'Aufnahme', f"""      <div class="kachel petrol">
        <h1 class="held" style="font-size: clamp(26px, 4vw, 38px);">Aufnahme &amp; Beratung</h1>
        <p class="fliess" style="margin: 10px 0 0;">Vier Schritte zum Platz im SONNENBERG – für Eltern gleich wie für zuweisende Stellen.</p>
      </div>
{schritt_kacheln}      <div class="kachel s4">
        <h2 style="font-size: 20px;">Platzsituation</h2>
        <p class="marke" style="margin: 6px 0 0; font-size: 12.5px;">Stand August 2026 · wird von der Redaktion laufend nachgeführt</p>
        <p class="fliess" style="margin: 12px 0 0;">{PLATZ}</p>
      </div>
      <div class="kachel gelb s2">
        <h2 style="font-size: 20px;">Das Intake hört zu.</h2>
        <p class="tel" style="margin: 10px 0 4px;"><a href="tel:+41417677833" style="color: var(--nacht);">041 767 78 33</a></p>
        <p style="margin: 0;"><a href="mailto:anfrage@sonnenberg-baar.ch" style="color: var(--nacht);">anfrage@sonnenberg-baar.ch</a></p>
      </div>"""))

# -------------------------------------------------------- Gemeinden/Kanton
DOKUMENTE = ['Anmeldeunterlagen', 'Jahresbericht &amp; Jahresrechnung',
             'Angebotsübersicht &amp; Tarife', 'Statuten des Vereins SONNENBERG']
dok = ''.join(f"""          <div class="reihe"><div class="inhalt"><a href="#" data-offen="{KEIN_PDF}">{d}</a></div><div class="datum" style="width: auto; text-align: right;">PDF</div></div>
""" for d in DOKUMENTE)

SEITEN.append(seite('gemeinden', 'Gemeinden & Kanton', f"""      <div class="kachel petrol">
        <p class="marke" style="margin: 0;"><a href="#/aufnahme" style="color: #8fb8b0;">Aufnahme</a></p>
        <h1 class="held" style="font-size: clamp(26px, 4vw, 38px); margin-top: 6px;">Für Gemeinden &amp; Kanton</h1>
        <p class="fliess" style="margin: 10px 0 0;">Zuweisung, Kostengutsprache, Berichte und Ansprechpersonen – gebündelt, ohne Suchen.</p>
      </div>
      <div class="kachel s4">
        <h2 style="font-size: 20px;">Unterlagen</h2>
        <div style="margin-top: 8px;">
{dok}        </div>
      </div>
      <div class="kachel s2">
        <h2 style="font-size: 20px;">So läuft die Zuweisung</h2>
        <p class="fliess" style="margin: 8px 0 0;">Die zuweisende Stelle meldet sich direkt beim Intake; die Kostengutsprache läuft über Wohngemeinde und Kanton. Wir begleiten den Ablauf.</p>
        <p class="fliess" style="margin: 8px 0 0;">Ältere Jahrgänge der Berichte stellt die Geschäftsstelle gerne zu.</p>
      </div>
      <div class="kachel s4">
        <h2 style="font-size: 20px;">Platzsituation</h2>
        <p class="marke" style="margin: 6px 0 0; font-size: 12.5px;">Stand August 2026 · wird von der Redaktion laufend nachgeführt</p>
        <p class="fliess" style="margin: 12px 0 0;">{PLATZ}</p>
      </div>
      <div class="kachel gelb s2">
        <h2 style="font-size: 20px;">Fragen zur Zuweisung?</h2>
        <p class="tel" style="margin: 10px 0 4px;"><a href="tel:+41417677833" style="color: var(--nacht);">041 767 78 33</a></p>
        <p style="margin: 0;"><a href="mailto:anfrage@sonnenberg-baar.ch" style="color: var(--nacht);">anfrage@sonnenberg-baar.ch</a></p>
      </div>"""))

# ----------------------------------------------------------------- Aktuell
SEITEN.append(seite('aktuell', 'Aktuell', f"""      <div class="kachel petrol">
        <h1 class="held" style="font-size: clamp(26px, 4vw, 38px);">Aktuell</h1>
        <p class="fliess" style="margin: 10px 0 0;">Einblicke in den Alltag im SONNENBERG.</p>
      </div>
      <div class="kachel bild s3" style="display: flex; flex-direction: column;">
        <img src="{B['fussball']}" alt="Vier junge Fussballer jubeln auf dem Spielfeld" style="height: 220px; min-height: 0;">
        <div style="padding: 22px 26px 26px;">
          <p class="marke" style="margin: 0; font-size: 12.5px;">13. August 2026</p>
          <h2 style="font-size: 20px; margin-top: 6px;"><a href="#/beitrag">European Inclusion Cup: Ein Wochenende voller Fussball, Begegnungen und gelebter Inklusion</a></h2>
        </div>
      </div>
      <div class="kachel bild s3" style="display: flex; flex-direction: column;">
        <img src="{B['aquarell']}" alt="Kinder malen mit Wasserfarben" style="height: 220px; min-height: 0;">
        <div style="padding: 22px 26px 26px;">
          <p class="marke" style="margin: 0; font-size: 12.5px;">12. Juni 2026</p>
          <h2 style="font-size: 20px; margin-top: 6px;"><a href="#" data-offen="{KEINE_SEITE}">SONNENBERG Sporttag – Spiel, Spass und Teamgeist</a></h2>
        </div>
      </div>
      <div class="kachel">
        <div class="reihe"><div class="datum">1. Juni 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">Feuerwehrübung auf dem SONNENBERG-Areal</a></div></div>
        <div class="reihe"><div class="datum">Mai 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">Die Frühlingsausgabe des SONNENBERG-Magazins ist da</a></div></div>
        <div class="reihe"><div class="datum">April 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">Orientierung für alle Sinne: neue Signaletik im SONNENBERG</a></div></div>
      </div>"""))

# ----------------------------------------------------------------- Beitrag
SEITEN.append(seite('beitrag', 'Beitrag', f"""      <div class="kachel bild"><img src="{B['fussball']}" alt="Vier junge Fussballer jubeln auf dem Spielfeld" style="max-height: 380px;"></div>
      <div class="kachel s4">
        <p class="marke" style="margin: 0;"><a href="#/aktuell">Aktuell</a> · 13. August 2026</p>
        <h1 style="font-size: clamp(24px, 3.4vw, 34px); margin-top: 10px;">European Inclusion Cup: Ein Wochenende voller Fussball, Begegnungen und gelebter Inklusion</h1>
        <p class="fliess" style="margin: 18px 0 0;">Das von FOOTBALL IS MORE initiierte Turnier verbindet sportlichen Wettkampf mit gesellschaftlicher Teilhabe und Inklusion. Nachwuchstalente sowie Menschen mit Beeinträchtigungen zeigen gemeinsam ihr Können auf dem Platz und setzen damit ein starkes Zeichen für Gleichberechtigung.</p>
        <p class="fliess" style="margin: 14px 0 0;">Vom 7. bis 9. August 2026 nahm der FC Bruschgol – mit drei Spielern des SONNENBERG und fünf weiteren Spieler*innen aus dem Talkessel Schwyz – am European Inclusion Cup in St. Gallen teil. Das Teilnehmerfeld war international besetzt, mit Teams aus Portugal, der Ukraine bis hin nach Dubai.</p>
        <p class="fliess" style="margin: 14px 0 0;">Auf dem Rasen warteten unter anderem Chelsea FC, Benfica Lissabon und Werder Bremen; auch Schweizer Teams wie der FC Winterthur, Lausanne-Sport, YB oder der FC Zürich forderten unser Team heraus. Unsere Spieler*innen zeigten viel Einsatz, Motivation und Freude am Spiel.</p>
      </div>
      <div class="kachel gelb s2">
        <p class="gross" style="margin: 0; line-height: 1.35;">«Fussball, Begegnung und gelebte Inklusion – dafür steht der FC Bruschgol seit Jahren.»</p>
      </div>
      <div class="kachel">
        <h2 style="font-size: 20px;">Weitere Beiträge</h2>
        <div style="margin-top: 8px;">
          <div class="reihe"><div class="datum">12. Juni 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">SONNENBERG Sporttag – Spiel, Spass und Teamgeist</a></div></div>
          <div class="reihe"><div class="datum">1. Juni 2026</div><div class="inhalt"><a href="#" data-offen="{KEINE_SEITE}">Feuerwehrübung auf dem SONNENBERG-Areal</a></div></div>
        </div>
      </div>"""))

# ---------------------------------------------------------------- Über uns
SEITEN.append(seite('ueber-uns', 'Über uns', f"""      <div class="kachel petrol s3">
        <h1 class="held" style="font-size: clamp(26px, 4vw, 38px);">Über uns</h1>
        <p class="fliess" style="margin: 12px 0 0;">Seit über 100 Jahren für Kinder und Jugendliche mit besonderen Bedürfnissen da – getragen vom Verein SONNENBERG, im Auftrag von Gemeinden und Kanton.</p>
      </div>
      <div class="kachel bild s3"><img src="{B['campus']}" alt="Luftaufnahme des SONNENBERG-Areals in Baar"></div>

      <div class="kachel">
        <p class="fliess" style="margin: 0; font-size: 18px;">Der SONNENBERG ist das Kompetenzzentrum für Sehen, Verhalten und Sprechen in Baar. Schule, Internat, Therapie und Beratung liegen unter einem Dach – an der Seite der Familien.</p>
      </div>

      <div class="kachel s2">
        <h2 style="font-size: 20px;">Auftrag</h2>
        <p class="fliess" style="margin: 8px 0 0;">Begleiten, fördern und unterstützen – mit dem Ziel eines selbstständigen, integrierten Lebens.</p>
      </div>
      <div class="kachel s2">
        <h2 style="font-size: 20px;">Träger</h2>
        <p class="fliess" style="margin: 8px 0 0;">Verein SONNENBERG – <a href="#/gemeinden">Vorstand, Statuten und Jahresberichte</a>.</p>
      </div>
      <div class="kachel s2">
        <h2 style="font-size: 20px;">Arbeiten bei uns</h2>
        <p class="fliess" style="margin: 8px 0 0;"><a href="#" data-offen="{KEINE_SEITE}">Offene Stellen</a> in Schule, Internat, Therapie und Verwaltung.</p>
      </div>

      <div class="kachel gelb s4">
        <h2 style="font-size: 20px;">Kontakt</h2>
        <p class="tel" style="margin: 10px 0 4px;"><a href="tel:+41417677833" style="color: var(--nacht);">041 767 78 33</a> · <a href="mailto:info@sonnenberg-baar.ch" style="color: var(--nacht);">info@sonnenberg-baar.ch</a></p>
        <p style="margin: 0;">Landhausstrasse 20, 6340 Baar</p>
      </div>
      <div class="kachel s2">
        <div class="paar"><a class="knopf" href="#/aufnahme">Besuchen Sie uns</a></div>
      </div>"""))

# ----------------------------------------------------------------- Zusammenbau
menue_html = ''.join(
    f'      <a href="#/{ziel}" data-ziel="{ziel}">{beschriftung}</a>\n'
    for ziel, beschriftung in MENUE)

html = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SONNENBERG · Prototyp</title>
<style>{STIL}
#meldung {{
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 22px; z-index: 40;
  background: var(--nacht); color: var(--weiss); padding: 12px 20px; border-radius: 999px;
  font-size: 15px; box-shadow: 0 8px 24px rgba(33, 41, 52, 0.28);
}}
#meldung[hidden] {{ display: none; }}
</style>
</head>
<body>
<a class="springen" href="#inhalt">Zum Inhalt springen</a>

<header class="kopf">
  <div class="kopfband">
    <a href="#/start" aria-label="SONNENBERG, zur Startseite"><img src="{B['logo']}" alt="SONNENBERG"></a>
    <button id="burger" class="burger" aria-expanded="false" aria-controls="menue" aria-label="Menü">☰</button>
    <nav id="menue" class="menue" aria-label="Hauptnavigation">
{menue_html}      <a class="knopf gelb" href="#/aufnahme">Beratung</a>
    </nav>
  </div>
</header>

<main id="inhalt">
{''.join(SEITEN)}</main>

<div id="meldung" role="status" hidden></div>
<script>{JS}</script>
</body>
</html>
"""

with open(ZIEL, 'w', encoding='utf-8') as f:
    f.write(html)
print(ZIEL, round(os.path.getsize(ZIEL) / 1e6, 2), 'MB')
