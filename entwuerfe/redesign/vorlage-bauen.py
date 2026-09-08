import base64, os

SHOTS = 'shots'
LOGO = '/home/user/sobe/entwuerfe/redesign/logo.png'

def b64(path, mime):
    with open(path, 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()

seiten = ['Startseite', 'Angebot', 'Angebot Sehen', 'Aufnahme', 'Gemeinden & Kanton', 'Aktuell', 'Beitrag', 'Über uns']
richtungen = [
    {
        'nr': 1, 'name': 'Duett', 'stamm': 'Duett',
        'these': 'Geteilter Bildschirm: Links steht das Haus mit grosser Aussage und Navigation fest, rechts fliesst der Inhalt.',
        'motivation': 'Wie eine moderne digitale Broschüre: Die petrolfarbene Halbseite gibt jeder Seite Ruhe und Wiedererkennung, rechts bleibt der Inhalt kompakt und geführt. Sehr aufgeräumt, sehr eigenständig.',
        'preis': 'Die linke Hälfte bindet Platz; auf dem Handy wird sie zum Kopfbereich über dem Inhalt.',
        'dateien': ['Duett', 'Duett-Angebote', 'Duett-Angebot', 'Duett-Aufnahme', 'Duett-Behoerden', 'Duett-Aktuell', 'Duett-Beitrag', 'Duett-Ueberuns'],
    },
    {
        'nr': 2, 'name': 'Mosaik', 'stamm': 'Mosaik',
        'these': 'Baukasten-Layout wie eine moderne App: abgerundete Kacheln, schwebende Pillen-Navigation, weiche Schatten.',
        'motivation': 'Jede Kachel bündelt ein Anliegen – die Startseite wird zum aufgeräumten Armaturenbrett. Wirkt frisch, freundlich und sehr heutig, ohne die Hausfarben zu verlassen.',
        'preis': 'Kacheln verleiten zu Häppchen: Lange Inhalte brauchen redaktionelle Disziplin, sonst zerfällt die Seite in Schnipsel.',
        'dateien': ['Mosaik', 'Mosaik-Angebote', 'Mosaik-Angebot', 'Mosaik-Aufnahme', 'Mosaik-Behoerden', 'Mosaik-Aktuell', 'Mosaik-Beitrag', 'Mosaik-Ueberuns'],
    },
    {
        'nr': 3, 'name': 'Nachtmodus', 'stamm': 'Nacht',
        'these': 'Dunkler, kontrastreicher Auftritt mit leuchtendem Gelb – modern wie eine Streaming-Plattform.',
        'motivation': 'Hebt sich von allen Schul- und Institutionswebseiten ab; die Fotos leuchten auf dunklem Grund, das Gelb führt durch die Seite. Ein mutiges, sehr zeitgemässes Zeichen.',
        'preis': 'Ungewohnt für eine soziale Institution. Die Kontraste sind eingeplant, müssen aber konsequent gepflegt werden.',
        'dateien': ['Nacht', 'Nacht-Angebote', 'Nacht-Angebot', 'Nacht-Aufnahme', 'Nacht-Behoerden', 'Nacht-Aktuell', 'Nacht-Beitrag', 'Nacht-Ueberuns'],
    },
    {
        'nr': 4, 'name': 'Horizont', 'stamm': 'Horizont',
        'these': 'Weicher Farbverlauf in den Hausfarben als grosse Bühne, schwebende Karten, viel Rundung.',
        'motivation': 'Die wärmste, freundlichste der modernen Richtungen: Der Verlauf von Petrol nach Nachtblau trägt die Titel, Inhalte schweben als Karten mit sanften Schatten auf getönten Bändern. Einladend und grosszügig.',
        'preis': 'Braucht gestalterische Sorgfalt, damit es leicht bleibt und nicht überladen wirkt.',
        'dateien': ['Horizont', 'Horizont-Angebote', 'Horizont-Angebot', 'Horizont-Aufnahme', 'Horizont-Behoerden', 'Horizont-Aktuell', 'Horizont-Beitrag', 'Horizont-Ueberuns'],
    },
    {
        'nr': 5, 'name': 'Panorama', 'stamm': 'Panorama',
        'these': 'Jede Seite beginnt mit einem grossen Foto und schwebendem Glas-Kopf – Bildwelt zuerst.',
        'motivation': 'Der Milchglas-Kopf schwebt über grossen Fotos, Titel stehen im Bild, Karten sind weich gerundet – modern wie aktuelle Kultur- und Hotelwebseiten. Emotion trägt die Inhalte.',
        'preis': 'Braucht laufend gute Fotos; der Text beginnt erst nach dem Bild.',
        'dateien': ['Panorama', 'Panorama-Angebote', 'Panorama-Angebot', 'Panorama-Aufnahme', 'Panorama-Behoerden', 'Panorama-Aktuell', 'Panorama-Beitrag', 'Panorama-Ueberuns'],
    },
]

vergleich = [
    ('1 · Duett', 'Geteilter Bildschirm: links das Haus, rechts der Inhalt', 'Linke Hälfte bindet Platz', 'Gebundene Hälfte fehlt dem Inhalt', 'gering'),
    ('2 · Mosaik', 'Baukasten aus abgerundeten Kacheln, App-Gefühl', 'Lange Inhalte brauchen Disziplin', 'Ordnung geht verloren, sobald Kacheln stapeln', 'gering bis mittel'),
    ('3 · Nachtmodus', 'Dunkler Auftritt mit leuchtendem Gelb', 'Ungewohnt für eine Institution', 'Legt alle Seiten auf einen dunklen Grund fest', 'gering'),
    ('4 · Horizont', 'Farbverlauf, schwebende Karten, weiche Rundungen', 'Muss leicht gehalten werden', 'Reihenfolge und Kontraste bleiben in jeder Grösse', 'gering bis mittel'),
    ('5 · Panorama', 'Foto-Auftakt mit schwebendem Glas-Kopf', 'Braucht laufend gute Fotos', 'Milchglas kostet Kontrast, Text beginnt spät', 'am höchsten'),
]

schritte = [
    ('Richtung wählen', 'Die Geschäftsleitung entscheidet sich für eine Richtung oder eine benannte Mischung.'),
    ('Klickbarer Prototyp', 'Die gewählte Richtung wird als klickbarer Prototyp mit den echten Inhalten ausgearbeitet und intern getestet.'),
    ('Umsetzung', 'Aufbau auf der bestehenden Technik: schnelle statische Seite, eigenes Redaktionssystem für die Mitarbeitenden.'),
    ('Spenden-Seite integrieren', 'Die Spenden-Seite wird in den neuen Auftritt übernommen und in die gewählte Gestaltung eingepasst.'),
    ('Barrierefreiheit prüfen', 'Der fertige Auftritt wird auf Barrierefreiheit geprüft; die Befunde werden vor dem Aufschalten behoben.'),
    ('Go-live', 'Der neue Auftritt wird auf sonnenberg-baar.ch aufgeschaltet.'),
    ('Webshop integrieren', 'Der Webshop wird an den neuen Auftritt angebunden.'),
]
schritte_html = ''.join(
    f'    <div class="schritt"><span class="snr">{i}</span><span class="stitel">{titel}</span>'
    f'<span class="stext">{text}</span></div>\n'
    for i, (titel, text) in enumerate(schritte, start=1)
)

logo64 = b64(LOGO, 'image/png')

teile = []
teile.append("""<title>Fünf Richtungen</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap">
<style>
  :root {
    --papier: #fdfcf8; --tinte: #212934; --petrol: #14514a; --gelb: #fbb500;
    --grau: #565851; --linie: #e3e1d6; --beige: #f4f3ec;
  }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  body { background: var(--papier); color: var(--tinte); font-family: "Source Sans 3", "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 17px; line-height: 1.6; }
  .blatt { max-width: 1060px; margin: 0 auto; padding: 0 40px 80px; }
  h1, h2, h3 { font-family: "Source Serif 4", Georgia, "Times New Roman", serif; font-weight: 600; text-wrap: balance; margin: 0; }
  a { color: var(--petrol); text-decoration: none; }
  p { margin: 0; }

  .kopf { display: flex; align-items: center; gap: 24px; padding: 34px 0 26px; border-bottom: 1px solid var(--linie); }
  .kopf img { height: 34px; width: auto; }
  .kopf .art { margin-left: auto; font-size: 15px; color: var(--grau); text-align: right; }

  .deck { padding: 64px 0 56px; border-bottom: 1px solid var(--linie); }
  .deck h1 { font-size: 52px; line-height: 1.08; max-width: 17ch; }
  .deck .auftrag { margin-top: 28px; max-width: 62ch; font-size: 19px; color: var(--grau); }
  .deck .auftrag strong { color: var(--tinte); }
  .basis { margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--linie); display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; font-size: 15.5px; color: var(--grau); }
  .basis strong { display: block; color: var(--tinte); font-size: 16px; margin-bottom: 4px; }

  section { padding: 56px 0 0; }
  .abschnitt-titel { font-size: 30px; margin-bottom: 20px; }

  .tabelle-rahmen { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; min-width: 780px; font-size: 15.5px; }
  th { font-family: inherit; font-weight: 700; text-align: left; padding: 10px 20px 10px 0; border-bottom: 1px solid var(--tinte); white-space: nowrap; }
  td { padding: 12px 20px 12px 0; border-bottom: 1px solid var(--linie); vertical-align: top; color: var(--grau); }
  td:first-child { color: var(--tinte); font-weight: 700; white-space: nowrap; }

  .richtung { padding: 64px 0 8px; border-top: 1px solid var(--linie); margin-top: 56px; }
  .richtung-kopf { display: flex; gap: 28px; align-items: baseline; }
  .richtung-kopf .nr { font-family: "Source Serif 4", Georgia, serif; font-size: 58px; font-weight: 600; color: var(--petrol); line-height: 1; }
  .richtung-kopf h2 { font-size: 38px; }
  .these { font-size: 21px; line-height: 1.5; max-width: 58ch; margin-top: 16px; color: var(--tinte); }
  .abwaegung { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 22px; max-width: 900px; }
  .abwaegung p { font-size: 16px; color: var(--grau); }
  .abwaegung strong { color: var(--tinte); }

  .galerie { margin-top: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px 20px; }
  .seite { margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .paar { display: flex; gap: 10px; }
  .schau { border: 0; background: none; padding: 0; text-align: left; cursor: zoom-in; font: inherit; color: inherit; flex: 1; min-width: 0; }
  .schau.handy { flex: none; width: 30%; }
  .schau:focus-visible { outline: 3px solid var(--petrol); outline-offset: 3px; }
  .fenster { display: block; height: 285px; overflow: hidden; border: 1px solid var(--linie); background: #ffffff; }
  .fenster img { width: 100%; display: block; }
  .seite figcaption { font-size: 14.5px; color: var(--grau); }
  .seite figcaption strong { color: var(--tinte); font-weight: 600; }

  .empfehlung { margin-top: 72px; background: var(--beige); padding: 44px 48px; }
  .empfehlung h2 { font-size: 30px; }
  .empfehlung p { margin-top: 16px; max-width: 68ch; color: var(--grau); }
  .empfehlung p strong { color: var(--tinte); }

  .schritte { padding-top: 56px; }
  .schritt { display: flex; gap: 28px; padding: 20px 0; border-bottom: 1px solid var(--linie); align-items: baseline; }
  .schritt:first-of-type { border-top: 1px solid var(--linie); }
  .schritt .snr { font-family: "Source Serif 4", Georgia, serif; font-size: 26px; font-weight: 600; color: var(--petrol); width: 36px; flex: none; }
  .schritt .stitel { font-weight: 700; width: 300px; flex: none; }
  .schritt .stext { color: var(--grau); font-size: 16px; }

  .fussnoten { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--linie); font-size: 14.5px; color: var(--grau); max-width: 78ch; }
  .fussnoten p + p { margin-top: 8px; }

  #lupe { position: fixed; inset: 0; background: rgba(33, 41, 52, 0.88); z-index: 10; overflow-y: auto; padding: 40px 20px; cursor: zoom-out; }
  #lupe[hidden] { display: none !important; }
  #lupe .rahmen { max-width: 880px; margin: 0 auto; }
  #lupe .titelzeile { color: #ffffff; font-size: 16px; display: flex; align-items: baseline; gap: 16px; margin-bottom: 12px; }
  #lupe .titelzeile .zu { margin-left: auto; color: #cfd3da; font-size: 14px; }
  #lupe img { width: 100%; display: block; background: #ffffff; }

  @media (max-width: 900px) {
    .blatt { padding: 0 22px 60px; }
    .deck h1 { font-size: 38px; }
    .basis { grid-template-columns: 1fr; gap: 18px; }
    .galerie { grid-template-columns: repeat(2, 1fr); }
    .abwaegung { grid-template-columns: 1fr; gap: 16px; }
    .richtung-kopf h2 { font-size: 28px; }
    .richtung-kopf .nr { font-size: 40px; }
    .schritt .stitel { width: auto; }
    .schritt { flex-wrap: wrap; }
  }
</style>
<div class="blatt">
""")

teile.append(f"""
  <div class="kopf">
    <img src="{logo64}" alt="SONNENBERG">
    <div class="art">Vorlage zuhanden der Geschäftsleitung<br>4. September 2026 · Arbeitsstand</div>
  </div>

  <div class="deck">
    <h1>Redesign von sonnenberg-baar.ch: fünf Richtungen zur Wahl</h1>
    <p class="auftrag">Unser Vorschlag zur Diskussion: Die Webseite soll <strong>schlanker</strong> werden und einen <strong>grösseren Mehrwert für Gemeinden, Kanton und Eltern</strong> bieten. Diese Vorlage stellt dafür fünf gestalterische Richtungen nebeneinander – jede vollständig durchgespielt auf denselben acht Seiten, damit sie sich Seite für Seite vergleichen lassen.</p>
    <div class="basis">
      <div><strong>Echtes Material</strong>Alle Entwürfe verwenden das echte Logo, die echten Hausfarben (Petrol, Nachtblau, Gelb) sowie Texte und Fotos der heutigen Webseite.</div>
      <div><strong>Acht Seiten je Richtung</strong>Startseite, Angebot, Angebot Sehen, Aufnahme, Gemeinden &amp; Kanton, Aktuell, Beitrag, Über uns – in jeder Richtung identisch belegt, jeweils mit Desktop- und Handy-Ansicht.</div>
      <div><strong>Gemeinsame Grundsätze</strong>Menü mit 4–5 Punkten statt heute 8+, die Platzsituation als gepflegter Redaktionstext, Barrierefreiheit und Suche bleiben Standard.</div>
    </div>
  </div>

  <section>
    <h2 class="abschnitt-titel">Auf einen Blick</h2>
    <div class="tabelle-rahmen">
      <table>
        <thead><tr><th>Richtung</th><th>Kernidee</th><th>Preis</th><th>Robustheit des Aufbaus</th><th>Pflegeaufwand</th></tr></thead>
        <tbody>
""")
for name, idee, wert, preis, pflege in vergleich:
    teile.append(f"          <tr><td>{name}</td><td>{idee}</td><td>{wert}</td><td>{preis}</td><td>{pflege}</td></tr>\n")
teile.append("""        </tbody>
      </table>
    </div>
  </section>
""")

for r in richtungen:
    teile.append(f"""
  <div class="richtung">
    <div class="richtung-kopf"><span class="nr">{r['nr']}</span><h2>{r['name']}</h2></div>
    <p class="these">{r['these']}</p>
    <div class="abwaegung">
      <p><strong>Warum diese Richtung:</strong> {r['motivation']}</p>
      <p><strong>Ihr Preis:</strong> {r['preis']}</p>
    </div>
    <div class="galerie">
""")
    for i, datei in enumerate(r['dateien']):
        bild = b64(os.path.join(SHOTS, datei + '.jpg'), 'image/jpeg')
        handy = b64(os.path.join('shots-mobil', datei + '.jpg'), 'image/jpeg')
        titel = f"{r['nr']} · {r['name']} – {seiten[i]}"
        teile.append(f"""      <figure class="seite">
        <div class="paar">
          <button class="schau" type="button" data-titel="{titel} – Desktop">
            <span class="fenster"><img src="{bild}" alt="Entwurf: Seite «{seiten[i]}» der Richtung {r['nr']} ({r['name']}), Desktop" loading="lazy"></span>
          </button>
          <button class="schau handy" type="button" data-titel="{titel} – Mobil" data-schmal="1">
            <span class="fenster"><img src="{handy}" alt="Entwurf: Seite «{seiten[i]}» der Richtung {r['nr']} ({r['name']}), mobile Ansicht" loading="lazy"></span>
          </button>
        </div>
        <figcaption><strong>{seiten[i]}</strong> · Desktop und Mobil, antippen zum Vergrössern</figcaption>
      </figure>
""")
    teile.append("    </div>\n  </div>\n")

teile.append("""
  <div class="empfehlung">
    <h2>Unsere Empfehlung</h2>
    <p><strong>Richtung 4 «Horizont» als Gestaltungssprache.</strong> Sie verbindet einen modernen Auftritt mit einem Aufbau, der auch unter schwierigen Bedingungen trägt. Horizont ist im Gerüst bewusst gewöhnlich: ein Kopf, eine Bühne, darunter Bänder mit Karten in einer schlichten Reihe. Was man sieht, ist zugleich die Reihenfolge im Quelltext – also das, was eine Vorlesesoftware wiedergibt. Bei starker Vergrösserung verhält sich die Seite gleich wie in normaler Ansicht, und die weissen Karten liegen auf getönten Bändern, heben sich also auch bei schwacher Kontrastwahrnehmung noch ab.</p>
    <p>Modern wirkt sie deswegen nicht weniger: grosse Rundungen, weiche Schatten, der Farbverlauf in den Hausfarben, viel Luft. Sie ist zugleich die wärmste der fünf Richtungen – passend für ein Haus, das Familien begleitet. Und sie ist pflegeleicht: Neue Inhalte fügen sich als weitere Karte in ein bestehendes Band, ohne dass jemand ein Layout austarieren muss.</p>
    <p>Zwei gezielte Anleihen empfehlen wir dazu: der <strong>Panorama-Bildauftakt</strong> für die emotionalen Seiten («Über uns», Aktuell-Beiträge) und die konsequente <strong>Behörden-Bündelung</strong>, wie sie in allen Richtungen angelegt ist. Nachtmodus ist der auffälligste Vorschlag, legt aber alle Seiten auf einen dunklen Grund fest; Duett bindet auf jeder Seite Platz an die linke Hälfte, der dem Inhalt fehlt; Panorama pur stellt für Behörden das Bild vor die Auskunft und arbeitet mit Milchglas, das Kontraste kostet.</p>
    </div>

  <section class="schritte">
    <h2 class="abschnitt-titel">Die nächsten Schritte</h2>
""" + schritte_html + """  </section>

  <div class="fussnoten">
    <p>Hinweise zum Arbeitsstand: Das Elternzitat in Richtung 5 ist ein gekennzeichneter Platzhalter und müsste eingeholt werden. Die vier Aufnahme-Schritte sind beispielhaft formuliert und wären fachlich zu verifizieren. Alle übrigen Texte und Fotos stammen von der heutigen Webseite sonnenberg-baar.ch.</p>
    <p>Die Entwürfe liegen zusätzlich als interaktive Arbeitstafel vor, auf der jede Seite in voller Grösse betrachtet werden kann.</p>
  </div>
</div>

<div id="lupe" hidden>
  <div class="rahmen">
    <div class="titelzeile"><span id="lupe-titel"></span><span class="zu">Schliessen mit Klick oder Esc</span></div>
    <img id="lupe-bild" src="" alt="">
  </div>
</div>
<script>
  const lupe = document.getElementById('lupe');
  const lupeBild = document.getElementById('lupe-bild');
  const lupeTitel = document.getElementById('lupe-titel');
  let zuletzt = null;
  document.querySelectorAll('.schau').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      const bild = knopf.querySelector('img');
      lupeBild.src = bild.src;
      lupeBild.alt = bild.alt;
      lupeBild.style.maxWidth = knopf.dataset.schmal ? '420px' : '';
      lupeBild.style.margin = knopf.dataset.schmal ? '0 auto' : '';
      lupeTitel.textContent = knopf.dataset.titel;
      lupe.hidden = false;
      zuletzt = knopf;
      document.body.style.overflow = 'hidden';
    });
  });
  function schliessen() {
    lupe.hidden = true;
    document.body.style.overflow = '';
    if (zuletzt) zuletzt.focus();
  }
  lupe.addEventListener('click', schliessen);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lupe.hidden) schliessen(); });
</script>
""")

out = '/home/user/sobe/entwuerfe/redesign/praesentation.html'
with open(out, 'w', encoding='utf-8') as f:
    f.write(''.join(teile))
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')
