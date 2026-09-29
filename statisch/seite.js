// Alles, was die Webseite an Skript braucht. Bewusst ohne Fremdpakete und
// ohne Bündler: Die Datei wird so ausgeliefert, wie sie hier steht.
//
// Vier Stücke:
//   1. das Menü auf dem Telefon
//   2. die klickbaren Kacheln und der Bereichsfilter auf der Stellenseite
//   3. die Barrierefreiheits-Werkzeuge (Vorlesen, Schrift, dunkler Modus)
//   4. die Suche über die ganze Webseite
//
// Grundsatz durchgehend: Fällt ein Stück aus, bleibt der Rest brauchbar.
// Ohne Skript funktionieren Menü (alle Punkte stehen als Verweise da),
// Kacheln (der Titel ist ein echter Verweis) und das Suchformular (es ist
// ein echtes <form> auf /suche/) weiterhin.
(function () {
  'use strict';

  // Die Seite legt unter window.SOBE ab, in welcher Sprache sie steht und
  // wie ihre Texte lauten. Diese Datei ist für alle Sprachen dieselbe – sie
  // wird kopiert, nicht gebaut –, darum kommen die Wörter von dort.
  var SOBE = window.SOBE || {};
  var WURZEL = SOBE.wurzel || '/';
  function T(satz) { return (SOBE.texte && SOBE.texte[satz]) || satz; }

  // ------------------------------------------------------------ 1. Menü
  var burger = document.getElementById('burger');
  var menue = document.getElementById('menue');
  if (burger && menue) {
    burger.addEventListener('click', function () {
      var offen = menue.classList.toggle('offen');
      burger.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });
  }

  // -------------------------------------------- 2. Kacheln und Stellenfilter
  document.addEventListener('click', function (e) {
    var kachel = e.target.closest('.kachel.klickbar');
    if (!kachel || e.target.closest('a, button, input')) return;
    location.href = kachel.dataset.ziel;
  });

  (function () {
    var filter = Array.prototype.slice.call(document.querySelectorAll('.filter'));
    var stellen = Array.prototype.slice.call(document.querySelectorAll('.stelle'));
    var anzahl = document.getElementById('anzahl');
    var leer = document.getElementById('leer');
    if (!filter.length) return;

    function filtern(bereich) {
      var sichtbar = 0;
      stellen.forEach(function (s) {
        var passt = bereich === 'alle' || s.dataset.bereich === bereich;
        s.hidden = !passt;
        if (passt) sichtbar++;
      });
      filter.forEach(function (f) {
        f.setAttribute('aria-pressed', f.dataset.bereich === bereich ? 'true' : 'false');
      });
      if (anzahl) anzahl.textContent = sichtbar + ' ' + (sichtbar === 1 ? T('Stelle') : T('Stellen'));
      if (leer) leer.hidden = sichtbar > 0;
    }
    filter.forEach(function (f) { f.addEventListener('click', function () { filtern(f.dataset.bereich); }); });
    filtern('alle');
  })();

  // ------------------------------------------- 3. Barrierefreiheits-Werkzeuge
  var SCHLUESSEL = 'sobe.zugang';

  function einstellungenLesen() {
    try { return JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}'); } catch (e) { return {}; }
  }
  function einstellungenSchreiben(wert) {
    // Im privaten Fenster wirft das Schreiben. Die Wahl gilt dann für diesen
    // Besuch – das ist besser als eine Seite, die an einer Ausnahme hängt.
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(wert)); } catch (e) { /* egal */ }
  }

  var zustand = einstellungenLesen();
  var knopf = document.getElementById('zugang');
  var feld = document.getElementById('zugangsfeld');
  var schalter = Array.prototype.slice.call(document.querySelectorAll('.schalter'));

  function feldSchliessen() {
    if (!feld || feld.hidden) return;
    feld.hidden = true;
    knopf.setAttribute('aria-expanded', 'false');
  }

  if (knopf && feld) {
    knopf.addEventListener('click', function () {
      var offen = feld.hidden;
      feld.hidden = !offen;
      knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
      if (offen) { var erster = feld.querySelector('.schalter'); if (erster) erster.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.werkzeuge')) feldSchliessen();
    });
    // Escape schliesst das Feld und gibt die Tastaturmarke zurück an den
    // Knopf – wer nur mit der Tastatur arbeitet, sitzt sonst darin fest.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || feld.hidden) return;
      feldSchliessen();
      knopf.focus();
    });
  }

  function anzeigen() {
    document.documentElement.classList.toggle('grossschrift', !!zustand.gross);
    document.documentElement.classList.toggle('dunkel', !!zustand.dunkel);
    schalter.forEach(function (s) {
      s.setAttribute('aria-pressed', zustand[s.dataset.schalter] ? 'true' : 'false');
    });
  }

  schalter.forEach(function (s) {
    var name = s.dataset.schalter;
    if (name === 'vorlesen' && !('speechSynthesis' in window)) {
      // Nicht heimlich nichts tun: Wer den Schalter umlegt und nichts hört,
      // sucht den Fehler bei sich.
      s.disabled = true;
      var hilfe = s.querySelector('.schalterhilfe');
      if (hilfe) hilfe.textContent = T('Dieser Browser kann nicht vorlesen.');
      return;
    }
    s.addEventListener('click', function () {
      zustand[name] = !zustand[name];
      einstellungenSchreiben(zustand);
      anzeigen();
      if (name === 'vorlesen') zustand.vorlesen ? vorlesenStarten() : vorlesenBeenden();
    });
  });
  anzeigen();

  // ---------------------------------------------------------- Vorlese-Modus
  var leiste = null;
  var stuecke = [];       // { text, element }
  var bei = 0;
  var laeuft = false;

  function vorleseStuecke() {
    var haupt = document.getElementById('inhalt');
    if (!haupt) return [];
    // Die Fusskachel gehört dazu: Dort stehen Adresse und Telefonnummer –
      // für jemanden, der zuhört, oft das Wichtigste der Seite.
      var kandidaten = haupt.querySelectorAll('h1, h2, h3, h4, p, li, figcaption, .held, .gross, .fussk');
    var gefunden = [];
    Array.prototype.forEach.call(kandidaten, function (el) {
      if (el.closest('[hidden]') || el.offsetParent === null) return;
      // Ein <p> in einer Liste darf nicht zweimal gelesen werden.
      if (gefunden.some(function (g) { return g.element.contains(el); })) return;
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 2) return;
      gefunden.push({ element: el, text: text });
    });
    return gefunden;
  }

  // Lange Sätze werden zerlegt: Mehrere Browser brechen das Vorlesen nach
  // etwa fünfzehn Sekunden ohne Meldung ab. Kurze Stücke laufen durch.
  function zerlegen(text) {
    var roh = text.match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
    var teile = [];
    var puffer = '';
    roh.forEach(function (satz) {
      if ((puffer + satz).length > 180 && puffer) { teile.push(puffer.trim()); puffer = ''; }
      puffer += satz;
    });
    if (puffer.trim()) teile.push(puffer.trim());
    return teile;
  }

  function leisteBauen() {
    if (leiste) return leiste;
    leiste = document.createElement('div');
    leiste.className = 'vorleseleiste';
    leiste.setAttribute('role', 'region');
    leiste.setAttribute('aria-label', T('Vorlesen'));
    leiste.innerHTML =
      '<p></p>' +
      '<button type="button" data-tun="start"></button>' +
      '<button type="button" data-tun="pause" class="still"></button>' +
      '<button type="button" data-tun="stopp" class="still"></button>';
    leiste.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tun === 'start') {
        if (speechSynthesis.paused) { speechSynthesis.resume(); melden(T('Liest vor …')); }
        else { vonVornLesen(); }
      } else if (b.dataset.tun === 'pause') {
        if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); melden(T('Pause')); }
      } else {
        vorlesenBeenden();
        zustand.vorlesen = false;
        einstellungenSchreiben(zustand);
        anzeigen();
      }
    });
    leiste.querySelector('p').textContent = T('Vorlese-Modus');
    leiste.querySelector('[data-tun="start"]').textContent = T('Vorlesen');
    leiste.querySelector('[data-tun="pause"]').textContent = T('Pause');
    leiste.querySelector('[data-tun="stopp"]').textContent = T('Beenden');
    document.body.appendChild(leiste);
    document.body.classList.add('liest');
    return leiste;
  }

  function melden(text) {
    if (leiste) leiste.querySelector('p').textContent = text;
  }

  function markieren(el) {
    var alt = document.querySelector('.liestgerade');
    if (alt) alt.classList.remove('liestgerade');
    if (!el) return;
    el.classList.add('liestgerade');
    var kasten = el.getBoundingClientRect();
    if (kasten.top < 90 || kasten.bottom > window.innerHeight - 100) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function stimmeWaehlen() {
    var stimmen = speechSynthesis.getVoices() || [];
    return stimmen.filter(function (s) { return s.lang.toLowerCase().indexOf((SOBE.sprache || 'de') + '-') === 0; })[0]
      || stimmen.filter(function (s) { return s.lang.toLowerCase().indexOf(SOBE.sprache || 'de') === 0; })[0]
      || null;
  }

  function weiterlesen() {
    if (!laeuft) return;
    if (bei >= stuecke.length) { melden(T('Fertig gelesen.')); markieren(null); laeuft = false; return; }
    var stueck = stuecke[bei];
    markieren(stueck.element);
    var teile = zerlegen(stueck.text);
    var stimme = stimmeWaehlen();
    teile.forEach(function (teil, i) {
      var sprich = new SpeechSynthesisUtterance(teil);
      sprich.lang = SOBE.gebietsschema || SOBE.sprache || 'de';
      if (stimme) sprich.voice = stimme;
      sprich.rate = 0.95;
      if (i === teile.length - 1) {
        sprich.onend = function () { bei++; weiterlesen(); };
        sprich.onerror = function () { bei++; weiterlesen(); };
      }
      speechSynthesis.speak(sprich);
    });
  }

  function vonVornLesen() {
    speechSynthesis.cancel();
    stuecke = vorleseStuecke();
    bei = 0;
    laeuft = true;
    if (!stuecke.length) { melden(T('Auf dieser Seite ist nichts zu lesen.')); laeuft = false; return; }
    melden(T('Liest vor …'));
    weiterlesen();
  }

  function vorlesenStarten() {
    if (!('speechSynthesis' in window)) return;
    leisteBauen();
    // Die Stimmenliste steht in manchen Browsern erst nach einem Ereignis
    // bereit. Wir warten nicht darauf – ohne passende Stimme liest der
    // Browser mit seiner Vorgabe, was immer noch besser ist als Stille.
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', function nurEinmal() {
        speechSynthesis.removeEventListener('voiceschanged', nurEinmal);
      });
    }
    melden(T('Bereit. Auf «Vorlesen» drücken.'));
  }

  function vorlesenBeenden() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    laeuft = false;
    markieren(null);
    if (leiste) { leiste.remove(); leiste = null; }
    document.body.classList.remove('liest');
  }

  if (zustand.vorlesen) vorlesenStarten();
  // Ein Seitenwechsel mitten im Satz lässt manche Browser weiterreden.
  window.addEventListener('pagehide', function () {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  });

  // ------------------------------------------------------- 3b. Spendenformular
  (function () {
    var form = document.getElementById('spendenform');
    if (!form) return;

    var gruppen = {
      einmalig: document.getElementById('betraege-einmalig'),
      monatlich: document.getElementById('betraege-monatlich'),
    };
    var freibetrag = document.getElementById('freibetrag');
    var eigener = document.getElementById('f-eigenerbetrag');
    var konto = document.getElementById('kontoangaben');
    var summe = document.getElementById('spendensumme');
    var mailknopf = document.getElementById('spendenmail');

    function gewaehlt(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }

    function intervall() { return gewaehlt('intervall') || 'einmalig'; }

    function gruppeWechseln() {
      var welche = intervall();
      Object.keys(gruppen).forEach(function (k) {
        var g = gruppen[k];
        if (!g) return;
        var an = k === welche;
        g.hidden = !an;
        // Abgeschaltete Felder wandern aus der Tabulatorreihe und werden
        // nicht mitgeschickt. Blosses Verstecken täte beides nicht.
        Array.prototype.forEach.call(g.querySelectorAll('input'), function (i) { i.disabled = !an; });
      });
      var aktiv = gruppen[welche];
      if (aktiv && !aktiv.querySelector('input:checked')) {
        var vorwahl = aktiv.querySelectorAll('input:not([value="frei"])')[1]
          || aktiv.querySelector('input');
        if (vorwahl) vorwahl.checked = true;
      }
    }

    function betrag() {
      var b = gewaehlt('betrag');
      if (b === 'frei') return eigener && eigener.value ? Number(eigener.value) : 0;
      return Number(b) || 0;
    }

    function auffrischen() {
      var frei = gewaehlt('betrag') === 'frei';
      if (freibetrag) freibetrag.hidden = !frei;
      if (frei && eigener && document.activeElement !== eigener) eigener.focus();
      if (konto) konto.hidden = gewaehlt('zahlungsart') !== 'ueberweisung';

      var wert = betrag();
      if (summe) {
        summe.innerHTML = '';
        summe.appendChild(document.createTextNode('Ihre Spende: '));
        var stark = document.createElement('strong');
        stark.textContent = wert ? 'CHF ' + wert : 'Betrag wählen';
        summe.appendChild(stark);
        summe.appendChild(document.createTextNode(
          wert ? (intervall() === 'monatlich' ? ' monatlich' : ' einmalig') : ''));
      }

      // Solange kein Zahlungsdienstleister eingerichtet ist, trägt die Mail
      // alles Gewählte schon ein – sonst müsste es jemand zweimal tippen.
      if (mailknopf) {
        var zeilen = [
          'Betrag: CHF ' + (wert || '—') + ' (' + intervall() + ')',
          'Zweck: ' + (gewaehlt('zweck') || '—'),
          'Zahlungsart: ' + (gewaehlt('zahlungsart') || '—'),
          '',
          'Name: ' + [form.vorname.value, form.name.value].join(' ').trim(),
          'Adresse: ' + [form.strasse.value, [form.plz.value, form.ort.value].join(' ').trim()]
            .filter(Boolean).join(', '),
          'E-Mail: ' + form.mail.value,
          'Spendenbescheinigung: ' + (form.bescheinigung.checked ? 'ja' : 'nein'),
          'Nennung: ' + (form.anonym.checked ? 'nicht öffentlich' : 'einverstanden'),
        ];
        var ziel = mailknopf.getAttribute('href').split('?')[0];
        mailknopf.setAttribute('href', ziel
          + '?subject=' + encodeURIComponent('Spende')
          + '&body=' + encodeURIComponent(zeilen.join('\n')));
      }
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'intervall') gruppeWechseln();
      auffrischen();
    });
    form.addEventListener('input', auffrischen);
    gruppeWechseln();
    auffrischen();
  })();

  // ------------------------------------------------------- 3c. Warenkorb
  //
  // Der Warenkorb lebt im Browser. Der Server rechnet beim Bestellen neu:
  // Was hier steht, ist ein Wunsch, keine Rechnung.
  (function () {
    var KORB = 'sobe.warenkorb';
    var katalog = null;

    function korbLesen() {
      try { return JSON.parse(localStorage.getItem(KORB) || '[]'); } catch (e) { return []; }
    }
    function korbSchreiben(korb) {
      try { localStorage.setItem(KORB, JSON.stringify(korb)); } catch (e) { /* privates Fenster */ }
      zahlAuffrischen();
    }
    function zahlAuffrischen() {
      var zeichen = document.getElementById('korbzahl');
      if (!zeichen) return;
      var stueck = korbLesen().reduce(function (s, p) { return s + p.anzahl; }, 0);
      zeichen.textContent = stueck;
      zeichen.hidden = stueck === 0;
    }
    zahlAuffrischen();

    function katalogHolen() {
      if (katalog) return Promise.resolve(katalog);
      return fetch(WURZEL + 'produkte.json').then(function (a) { return a.json(); })
        .then(function (k) { katalog = k; return k; });
    }
    function geld(betrag, waehrung) {
      try {
        return new Intl.NumberFormat(SOBE.gebietsschema || 'de-CH',
          { style: 'currency', currency: waehrung, minimumFractionDigits: 2 }).format(betrag);
      } catch (e) { return waehrung + ' ' + betrag.toFixed(2); }
    }

    // ---------------------------------------------------- In den Warenkorb
    var legen = document.querySelector('.inwarenkorb');
    if (legen) {
      legen.addEventListener('submit', function (e) {
        e.preventDefault();
        if (legen.dataset.aus === 'ja') return;
        var kennung = legen.dataset.kennung;
        var variante = legen.variante ? legen.variante.value : '';
        var anzahl = Math.max(1, parseInt(legen.anzahl.value, 10) || 1);
        var korb = korbLesen();
        var da = korb.filter(function (p) { return p.kennung === kennung && p.variante === variante; })[0];
        if (da) da.anzahl += anzahl; else korb.push({ kennung: kennung, variante: variante, anzahl: anzahl });
        korbSchreiben(korb);
        var wink = document.getElementById('gelegt');
        if (wink) { wink.textContent = T('Ist im Warenkorb.'); wink.hidden = false; }
      });
    }

    // ------------------------------------------------------------ Die Kasse
    var kasse = document.getElementById('kasse');
    if (!kasse) return;

    var liste = document.getElementById('korbliste');
    var leer = document.getElementById('korbleer');
    var summenkasten = document.getElementById('korbsumme');
    var abschnitte = ['kasse-rest', 'kasse-zahlung', 'kasse-angaben', 'kasse-abschluss']
      .map(function (id) { return document.getElementById(id); });

    function rechnen(korb, k) {
      var waren = 0;
      korb.forEach(function (p) {
        var w = k.waren.filter(function (x) { return x.kennung === p.kennung; })[0];
        if (w) waren += w.preis * p.anzahl;
      });
      var abholung = kasse.versandart && kasse.versandart.value === 'abholung';
      var versand = (abholung || !waren || (k.versandfreiAb && waren >= k.versandfreiAb)) ? 0 : k.versandkosten;
      return { waren: waren, versand: versand, gesamt: waren + versand };
    }

    function zeichnen() {
      katalogHolen().then(function (k) {
        var korb = korbLesen().filter(function (p) {
          return k.waren.some(function (w) { return w.kennung === p.kennung; });
        });
        leeren(liste);
        var hatWare = korb.length > 0;
        leer.hidden = hatWare;
        summenkasten.hidden = !hatWare;
        abschnitte.forEach(function (a) { if (a) a.hidden = !hatWare; });
        if (!hatWare) return;

        korb.forEach(function (p, i) {
          var w = k.waren.filter(function (x) { return x.kennung === p.kennung; })[0];
          var zeile = document.createElement('div');
          zeile.className = 'korbzeile';

          var bild = document.createElement(w.bild ? 'img' : 'span');
          if (w.bild) { bild.src = w.bild.charAt(0) === '/' ? w.bild : '/bilder/' + w.bild; bild.alt = ''; }
          bild.className = 'korbbild';
          zeile.appendChild(bild);

          var text = document.createElement('div');
          text.className = 'korbtext';
          var name = document.createElement('a');
          name.href = w.pfad; name.className = 'korbname'; name.textContent = w.titel;
          text.appendChild(name);
          if (p.variante) text.appendChild(Object.assign(document.createElement('span'),
            { className: 'korbvariante', textContent: p.variante }));
          text.appendChild(Object.assign(document.createElement('span'),
            { className: 'korbstueck', textContent: geld(w.preis, k.waehrung) }));
          zeile.appendChild(text);

          var menge = document.createElement('input');
          menge.type = 'number'; menge.min = '1'; menge.step = '1'; menge.value = p.anzahl;
          menge.className = 'korbmenge';
          menge.setAttribute('aria-label', T('Anzahl') + ': ' + w.titel);
          if (w.lager > 0) menge.max = String(w.lager);
          menge.addEventListener('change', function () {
            var neuAnzahl = Math.max(1, parseInt(menge.value, 10) || 1);
            if (w.lager > 0 && neuAnzahl > w.lager) neuAnzahl = w.lager;
            menge.value = neuAnzahl;
            var alle = korbLesen();
            var treffer = alle.filter(function (x) {
              return x.kennung === p.kennung && x.variante === p.variante; })[0];
            if (treffer) treffer.anzahl = neuAnzahl;
            korbSchreiben(alle);
            zeichnen();
          });
          zeile.appendChild(menge);

          var weg = document.createElement('button');
          weg.type = 'button'; weg.className = 'korbweg'; weg.textContent = T('Entfernen');
          weg.addEventListener('click', function () {
            korbSchreiben(korbLesen().filter(function (x) {
              return !(x.kennung === p.kennung && x.variante === p.variante); }));
            zeichnen();
          });
          zeile.appendChild(weg);
          liste.appendChild(zeile);
        });

        var s = rechnen(korb, k);
        document.getElementById('summe-waren').textContent = geld(s.waren, k.waehrung);
        document.getElementById('summe-versand').textContent = s.versand ? geld(s.versand, k.waehrung) : '–';
        document.getElementById('summe-gesamt').textContent = geld(s.gesamt, k.waehrung);
        var lage = document.getElementById('kassenlage');
        if (lage) lage.textContent = T('Gesamt') + ': ' + geld(s.gesamt, k.waehrung);
      }).catch(function () {
        leer.textContent = T('Die Bestellung konnte nicht abgeschickt werden. Bitte später nochmals versuchen.');
        leer.hidden = false;
      });
    }

    function leeren(el) { while (el.firstChild) el.removeChild(el.firstChild); }

    kasse.addEventListener('change', function (e) {
      if (e.target.name === 'versandart') zeichnen();
    });

    kasse.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!kasse.reportValidity()) return;
      var knopf = kasse.querySelector('button[type="submit"]');
      knopf.disabled = true;
      var lage = document.getElementById('kassenlage');
      if (lage) lage.textContent = T('Wird abgeschickt …');
      var bestellung = {
        sprache: SOBE.sprache || 'de',
        positionen: korbLesen(),
        versandart: kasse.versandart ? kasse.versandart.value : 'versand',
        zahlung: kasse.zahlung ? kasse.zahlung.value : '',
        kunde: {
          vorname: kasse.vorname.value, name: kasse.name.value, strasse: kasse.strasse.value,
          plz: kasse.plz.value, ort: kasse.ort.value, mail: kasse.mail.value,
          telefon: kasse.telefon.value, bemerkung: kasse.bemerkung.value,
        },
      };
      try {
        var antwort = await fetch('/api/bestellung', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(bestellung),
        });
        var ergebnis = await antwort.json();
        if (!antwort.ok) throw new Error(ergebnis.fehler || String(antwort.status));
        // Erst jetzt leeren: Geht das Abschicken schief, ist der Korb noch da.
        korbSchreiben([]);
        var kasten = document.getElementById('bestaetigung');
        kasten.hidden = false;
        kasten.innerHTML = '';
        kasten.appendChild(Object.assign(document.createElement('h2'),
          { textContent: T('Vielen Dank für Ihre Bestellung.') }));
        kasten.appendChild(Object.assign(document.createElement('p'),
          { className: 'produktpreis',
            textContent: T('Ihre Bestellnummer') + ': ' + ergebnis.nummer }));
        kasse.hidden = true;
        kasten.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } catch (f) {
        if (lage) lage.textContent = T('Die Bestellung konnte nicht abgeschickt werden. Bitte später nochmals versuchen.');
        knopf.disabled = false;
      }
    });

    zeichnen();
  })();

  // ------------------------------------------------------------- 4. Suche
  var ergebnis = document.getElementById('suchergebnis');
  var lage = document.getElementById('suchlage');
  var grossfeld = document.getElementById('grossfeld');
  if (!ergebnis || !lage) return;

  // Umlaute und Akzente werden eingeebnet: Wer «logopadie» tippt, soll
  // «Logopädie» finden. Sonst hängt das Ergebnis daran, welche Tastatur
  // jemand gerade hat.
  //
  // Wichtig: Diese Faltung ist zeichentreu – ä wird zu a, nicht zu ae.
  // Andernfalls verschieben sich alle Fundstellen gegenüber dem
  // Originaltext, und der Ausschnitt im Ergebnis zeigt auf die falsche
  // Stelle. Die Schreibweise «Logopaedie» deckt varianten() ab.
  function falten(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 's')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Aus einem Suchwort alle Schreibweisen, die dasselbe meinen können.
  // Gesucht werden beide, nie nur eine: «Museum» darf nicht verschwinden,
  // bloss weil «ue» auch für ü stehen könnte.
  function varianten(wort) {
    var alle = [wort];
    var ersetzt = wort.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ss/g, 's');
    if (ersetzt !== wort) alle.push(ersetzt);
    return alle;
  }

  function findeStelle(heuhaufen, wort) {
    var v = varianten(wort);
    for (var i = 0; i < v.length; i++) {
      var s = heuhaufen.indexOf(v[i]);
      if (s !== -1) return { stelle: s, laenge: v[i].length };
    }
    return null;
  }

  var verzeichnis = null;
  var holen = null;

  function verzeichnisHolen() {
    if (holen) return holen;
    holen = fetch(WURZEL + 'suche.json')
      .then(function (a) { if (!a.ok) throw new Error('HTTP ' + a.status); return a.json(); })
      .then(function (liste) {
        verzeichnis = liste.map(function (e) {
          return { t: e.t, p: e.p, a: e.a, d: e.d || '', x: e.x,
                   ft: falten(e.t), fx: falten(e.x) };
        });
        return verzeichnis;
      });
    return holen;
  }

  function bewerten(eintrag, woerter) {
    var punkte = 0;
    for (var i = 0; i < woerter.length; i++) {
      var v = varianten(woerter[i]);
      var imTitel = v.some(function (w) { return eintrag.ft.indexOf(w) !== -1; });
      var treffer = v.reduce(function (summe, w) { return summe + (eintrag.fx.split(w).length - 1); }, 0);
      if (!imTitel && !treffer) return 0;          // ein Wort fehlt ganz
      if (imTitel) punkte += 40;
      punkte += Math.min(treffer, 8) * 3;
      // Ganze Wörter zählen mehr als Wortteile: «rat» soll nicht wegen
      // «Beratung» vor einem Treffer stehen, der wirklich «Rat» meint.
      if (v.some(function (w) { return new RegExp('(^|[^a-z0-9])' + w + '([^a-z0-9]|$)').test(eintrag.fx); })) punkte += 10;
    }
    return punkte;
  }

  function ausschnitt(eintrag, woerter) {
    var stelle = -1;
    for (var i = 0; i < woerter.length && stelle < 0; i++) {
      var f = findeStelle(eintrag.fx, woerter[i]);
      if (f) stelle = f.stelle;
    }
    if (stelle < 0) stelle = 0;
    // fx ist zeichentreu zu x, darum zeigt die Fundstelle auf dasselbe
    // Zeichen im Originaltext.
    var von = Math.max(0, stelle - 70);
    var bis = Math.min(eintrag.x.length, stelle + 200);
    var text = eintrag.x.slice(von, bis);
    return (von > 0 ? '… ' : '') + text + (bis < eintrag.x.length ? ' …' : '');
  }

  // Der Ausschnitt wird als Textknoten gesetzt, nie als HTML: Inhalte kommen
  // aus der Redaktion, und eine Suche, die fremden Text als Auszeichnung
  // ausführt, wäre ein offenes Scheunentor.
  function hervorheben(behaelter, text, woerter) {
    var rest = text;
    var schutz = 0;
    while (rest && schutz++ < 200) {
      var fRest = falten(rest);
      var best = -1, bestLaenge = 0;
      woerter.forEach(function (w) {
        var f = findeStelle(fRest, w);
        if (f && (best === -1 || f.stelle < best)) { best = f.stelle; bestLaenge = f.laenge; }
      });
      if (best === -1) { behaelter.appendChild(document.createTextNode(rest)); return; }
      behaelter.appendChild(document.createTextNode(rest.slice(0, best)));
      var m = document.createElement('mark');
      m.textContent = rest.slice(best, best + bestLaenge);
      behaelter.appendChild(m);
      rest = rest.slice(best + bestLaenge);
    }
    if (rest) behaelter.appendChild(document.createTextNode(rest));
  }

  function zeigen(frage) {
    ergebnis.textContent = '';
    var woerter = falten(frage).split(/\s+/).filter(function (w) { return w.length >= 2; });
    if (!woerter.length) {
      lage.textContent = T('Bitte geben Sie einen Suchbegriff ein.');
      return;
    }
    lage.textContent = T('Wird gesucht …');
    verzeichnisHolen().then(function (liste) {
      var funde = liste
        .map(function (e) { return { e: e, punkte: bewerten(e, woerter) }; })
        .filter(function (f) { return f.punkte > 0; })
        .sort(function (a, b) { return b.punkte - a.punkte; })
        .slice(0, 40);

      if (!funde.length) {
        lage.textContent = T('Keine Treffer für') + ' «' + frage + '».';
        var tipp = document.createElement('p');
        tipp.className = 'fliess';
        tipp.style.marginTop = '10px';
        tipp.textContent = T('Versuchen Sie einen kürzeren Begriff, oder sehen Sie im Menü nach.');
        ergebnis.appendChild(tipp);
        return;
      }

      lage.textContent = funde.length + ' ' + T('Treffer');
      funde.forEach(function (f) {
        var a = document.createElement('a');
        a.className = 'treffer';
        a.href = f.e.p;

        var kopf = document.createElement('div');
        kopf.className = 'trefferkopf';
        var titel = document.createElement('span');
        titel.className = 'treffertitel';
        titel.textContent = f.e.t;
        var art = document.createElement('span');
        art.className = 'trefferart';
        art.textContent = f.e.a;
        kopf.appendChild(titel);
        kopf.appendChild(art);
        a.appendChild(kopf);

        if (f.e.x) {
          var text = document.createElement('div');
          text.className = 'treffertext';
          hervorheben(text, ausschnitt(f.e, woerter), woerter);
          a.appendChild(text);
        }
        ergebnis.appendChild(a);
      });
    }).catch(function () {
      lage.textContent = T('Das Verzeichnis konnte nicht geladen werden. Bitte die Seite neu laden.');
    });
  }

  var frage = new URLSearchParams(location.search).get('q') || '';
  if (grossfeld) {
    grossfeld.value = frage;
    var wartet = null;
    grossfeld.addEventListener('input', function () {
      clearTimeout(wartet);
      wartet = setTimeout(function () {
        var wert = grossfeld.value.trim();
        // Die Adresse mitführen, damit ein Treffer teilbar und der
        // Zurück-Knopf nicht nutzlos ist.
        try {
          history.replaceState(null, '', WURZEL + 'suche/' + (wert ? '?q=' + encodeURIComponent(wert) : ''));
        } catch (e) { /* egal */ }
        zeigen(wert);
      }, 180);
    });
    var form = grossfeld.closest('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); zeigen(grossfeld.value.trim()); });
  }
  if (frage) zeigen(frage);
})();
