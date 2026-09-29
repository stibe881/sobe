// Nur zwei Dinge brauchen Skript: das Menü auf dem Telefon und der
// Bereichsfilter auf der Stellenseite. Alles andere sind echte Verweise.
(function () {
  var burger = document.getElementById('burger');
  var menue = document.getElementById('menue');
  if (burger && menue) {
    burger.addEventListener('click', function () {
      var offen = menue.classList.toggle('offen');
      burger.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var kachel = e.target.closest('.kachel.klickbar');
    if (!kachel || e.target.closest('a')) return;
    location.href = kachel.dataset.ziel;
  });

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
    if (anzahl) anzahl.textContent = sichtbar === 1 ? '1 Stelle' : sichtbar + ' Stellen';
    if (leer) leer.hidden = sichtbar > 0;
  }
  filter.forEach(function (f) { f.addEventListener('click', function () { filtern(f.dataset.bereich); }); });
  filtern('alle');
})();
