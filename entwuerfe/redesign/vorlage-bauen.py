import base64, os

SHOTS = 'shots'
LOGO = '/home/user/sobe/entwuerfe/redesign/logo.png'

def b64(path, mime):
    with open(path, 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()

seiten = ['Startseite', 'Angebot', 'Angebot Sehen', 'Aufnahme', 'Gemeinden & Kanton', 'Aktuell', 'Beitrag', 'Über uns']
richtungen = [
    {
        'nr': 1, 'name': 'Drei Eingänge', 'stamm': 'Main',
        'these': 'Die Startseite wird zur Weiche: Eltern, Gemeinden und Kanton sowie Fachpersonen finden in fünf Sekunden ihren Weg.',
        'motivation': 'Wer die Seite besucht, kommt fast immer als eine von drei Zielgruppen – und jede bekommt ihren eigenen Eingang mit den drei wichtigsten Verweisen. Kein Suchen im Menü, keine Umwege.',
        'preis': 'Die Startseite erzählt weniger vom Leben im Haus; Stimmung und Bilder entstehen erst eine Ebene tiefer.',
        'dateien': ['Main', 'Main-Angebote', 'Main-Angebot', 'Main-Aufnahme', 'Main-Behoerden', 'Main-Aktuell', 'Main-Beitrag', 'Main-Ueberuns'],
        'favorit': True,
    },
    {
        'nr': 2, 'name': 'Mosaik', 'stamm': 'Mosaik',
        'these': 'Baukasten-Layout wie eine moderne App: abgerundete Kacheln, schwebende Pillen-Navigation, weiche Schatten.',
        'motivation': 'Jede Kachel bündelt ein Anliegen – die Startseite wird zum aufgeräumten Armaturenbrett. Wirkt frisch, freundlich und sehr heutig, ohne die Hausfarben zu verlassen.',
        'preis': 'Kacheln verleiten zu Häppchen: Lange Inhalte brauchen redaktionelle Disziplin, sonst zerfällt die Seite in Schnipsel.',
        'dateien': ['Mosaik', 'Mosaik-Angebote', 'Mosaik-Angebot', 'Mosaik-Aufnahme', 'Mosaik-Behoerden', 'Mosaik-Aktuell', 'Mosaik-Beitrag', 'Mosaik-Ueberuns'],
        'favorit': False,
    },
    {
        'nr': 3, 'name': 'Nachtmodus', 'stamm': 'Nacht',
        'these': 'Dunkler, kontrastreicher Auftritt mit leuchtendem Gelb – modern wie eine Streaming-Plattform.',
        'motivation': 'Hebt sich von allen Schul- und Institutionswebseiten ab; die Fotos leuchten auf dunklem Grund, das Gelb führt durch die Seite. Ein mutiges, sehr zeitgemässes Zeichen.',
        'preis': 'Ungewohnt für eine soziale Institution. Die Kontraste sind eingeplant, müssen aber konsequent gepflegt werden.',
        'dateien': ['Nacht', 'Nacht-Angebote', 'Nacht-Angebot', 'Nacht-Aufnahme', 'Nacht-Behoerden', 'Nacht-Aktuell', 'Nacht-Beitrag', 'Nacht-Ueberuns'],
        'favorit': False,
    },
    {
        'nr': 4, 'name': 'Grossformat', 'stamm': 'Grossformat',
        'these': 'Kompromisslos grosse Typografie, gelbes Laufband, viel Weissraum – die Botschaft wird zum Gestaltungselement.',
        'motivation': 'Sehr selbstbewusst und sehr heutig: riesige Schlagzeilen, klare Zeilen, ein Laufband mit «Sehen · Verhalten · Sprechen». Kein Schmuck, nur Haltung.',
        'preis': 'Wenig Bilder – die Richtung lebt von starken Worten. Auf kleinen Bildschirmen muss die Schrift stark schrumpfen.',
        'dateien': ['Grossformat', 'Grossformat-Angebote', 'Grossformat-Angebot', 'Grossformat-Aufnahme', 'Grossformat-Behoerden', 'Grossformat-Aktuell', 'Grossformat-Beitrag', 'Grossformat-Ueberuns'],
        'favorit': False,
    },
    {
        'nr': 5, 'name': 'Panorama', 'stamm': 'Panorama',
        'these': 'Jede Seite beginnt mit einem grossen Foto und schwebendem Glas-Kopf – Bildwelt zuerst.',
        'motivation': 'Der Milchglas-Kopf schwebt über grossen Fotos, Titel stehen im Bild, Karten sind weich gerundet – modern wie aktuelle Kultur- und Hotelwebseiten. Emotion trägt die Inhalte.',
        'preis': 'Braucht laufend gute Fotos; der Text beginnt erst nach dem Bild.',
        'dateien': ['Panorama', 'Panorama-Angebote', 'Panorama-Angebot', 'Panorama-Aufnahme', 'Panorama-Behoerden', 'Panorama-Aktuell', 'Panorama-Beitrag', 'Panorama-Ueberuns'],
        'favorit': False,
    },
]

vergleich = [
    ('1 · Drei Eingänge', 'Startseite als Weiche für drei Zielgruppen', 'Eltern, Behörden und Fachpersonen gleichermassen', 'Weniger Stimmung auf der Startseite', 'gering bis mittel'),
    ('2 · Mosaik', 'Baukasten aus abgerundeten Kacheln, App-Gefühl', 'Eltern und Öffentlichkeit', 'Lange Inhalte brauchen Disziplin', 'gering bis mittel'),
    ('3 · Nachtmodus', 'Dunkler Auftritt mit leuchtendem Gelb', 'Auffallen bei allen Zielgruppen', 'Ungewohnt für eine Institution', 'gering'),
    ('4 · Grossformat', 'Riesige Typografie, Laufband, viel Weissraum', 'Eilige; klare Botschaften', 'Wenig Bilder, lebt von Worten', 'am geringsten'),
    ('5 · Panorama', 'Foto-Auftakt mit schwebendem Glas-Kopf', 'Eltern', 'Braucht laufend gute Fotos', 'am höchsten'),
]

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
  .favorit { align-self: center; margin-left: auto; background: var(--gelb); color: var(--tinte); font-size: 14px; font-weight: 700; padding: 5px 12px; white-space: nowrap; }
  .these { font-size: 21px; line-height: 1.5; max-width: 58ch; margin-top: 16px; color: var(--tinte); }
  .abwaegung { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 22px; max-width: 900px; }
  .abwaegung p { font-size: 16px; color: var(--grau); }
  .abwaegung strong { color: var(--tinte); }

  .galerie { margin-top: 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 18px; }
  .seite { display: flex; flex-direction: column; gap: 8px; border: 0; background: none; padding: 0; text-align: left; cursor: zoom-in; font: inherit; color: inherit; }
  .seite:focus-visible { outline: 3px solid var(--petrol); outline-offset: 3px; }
  .fenster { height: 285px; overflow: hidden; border: 1px solid var(--linie); background: #ffffff; }
  .fenster img { width: 100%; display: block; }
  .seite figcaption, .seite .beschriftung { font-size: 14.5px; color: var(--grau); }
  .seite .beschriftung strong { color: var(--tinte); font-weight: 600; }

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
    <p class="auftrag">Auftrag der Geschäftsleitung: Die Webseite soll <strong>schlanker</strong> werden und einen <strong>grösseren Mehrwert für Gemeinden, Kanton und Eltern</strong> bieten. Diese Vorlage stellt fünf gestalterische Richtungen nebeneinander – jede vollständig durchgespielt auf denselben acht Seiten, damit sie sich Seite für Seite vergleichen lassen.</p>
    <div class="basis">
      <div><strong>Echtes Material</strong>Alle Entwürfe verwenden das echte Logo, die echten Hausfarben (Petrol, Nachtblau, Gelb) sowie Texte und Fotos der heutigen Webseite.</div>
      <div><strong>Acht Seiten je Richtung</strong>Startseite, Angebot, Angebot Sehen, Aufnahme, Gemeinden &amp; Kanton, Aktuell, Beitrag, Über uns – in jeder Richtung identisch belegt.</div>
      <div><strong>Gemeinsame Grundsätze</strong>Menü mit 4–5 Punkten statt heute 8+, die Platzsituation als gepflegter Redaktionstext, Barrierefreiheit und Suche bleiben Standard.</div>
    </div>
  </div>

  <section>
    <h2 class="abschnitt-titel">Auf einen Blick</h2>
    <div class="tabelle-rahmen">
      <table>
        <thead><tr><th>Richtung</th><th>Kernidee</th><th>Grösster Mehrwert für</th><th>Preis</th><th>Pflegeaufwand</th></tr></thead>
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
    fav = '<span class="favorit">Unser Favorit</span>' if r['favorit'] else ''
    teile.append(f"""
  <div class="richtung">
    <div class="richtung-kopf"><span class="nr">{r['nr']}</span><h2>{r['name']}</h2>{fav}</div>
    <p class="these">{r['these']}</p>
    <div class="abwaegung">
      <p><strong>Warum diese Richtung:</strong> {r['motivation']}</p>
      <p><strong>Ihr Preis:</strong> {r['preis']}</p>
    </div>
    <div class="galerie">
""")
    for i, datei in enumerate(r['dateien']):
        bild = b64(os.path.join(SHOTS, datei + '.jpg'), 'image/jpeg')
        titel = f"{r['nr']} · {r['name']} – {seiten[i]}"
        teile.append(f"""      <button class="seite" type="button" data-titel="{titel}">
        <span class="fenster"><img src="{bild}" alt="Entwurf: Seite «{seiten[i]}» der Richtung {r['nr']} ({r['name']})" loading="lazy"></span>
        <span class="beschriftung"><strong>{seiten[i]}</strong> · zum Vergrössern antippen</span>
      </button>
""")
    teile.append("    </div>\n  </div>\n")

teile.append("""
  <div class="empfehlung">
    <h2>Unsere Empfehlung</h2>
    <p><strong>Richtung 1 «Drei Eingänge» als Grundgerüst.</strong> Sie bedient alle drei Zielgruppen aus dem Auftrag gleichmässig, bleibt schlank im Unterhalt und lässt sich mit Elementen der anderen Richtungen anreichern – etwa dem prominenten Aufnahme-Faden aus Richtung 2 oder einzelnen grossen Bildmomenten aus Richtung 5.</p>
    <p>Die Richtungen schliessen sich nicht aus: Entscheidet sich die Geschäftsleitung für eine Mischung, benennen Sie am besten das Grundgerüst und die zwei, drei Elemente, die dazukommen sollen.</p>
  </div>

  <section class="schritte">
    <h2 class="abschnitt-titel">Die nächsten Schritte</h2>
    <div class="schritt"><span class="snr">1</span><span class="stitel">Richtung wählen</span><span class="stext">Die Geschäftsleitung entscheidet sich für eine Richtung oder eine benannte Mischung.</span></div>
    <div class="schritt"><span class="snr">2</span><span class="stitel">Klickbarer Prototyp</span><span class="stext">Die gewählte Richtung wird als klickbarer Prototyp mit den echten Inhalten ausgearbeitet und intern getestet.</span></div>
    <div class="schritt"><span class="snr">3</span><span class="stitel">Umsetzung</span><span class="stext">Aufbau auf der bestehenden Technik: schnelle statische Seite, eigenes Redaktionssystem für die Mitarbeitenden, geprüfte Barrierefreiheit.</span></div>
  </section>

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
  document.querySelectorAll('.seite').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      const bild = knopf.querySelector('img');
      lupeBild.src = bild.src;
      lupeBild.alt = bild.alt;
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
