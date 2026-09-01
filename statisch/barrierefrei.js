// Kleine Nachrüstungen für Hilfstechnologie, die im statischen Abzug
// nicht aus WordPress kommen können. Wird von barrierefrei.py als
// /barrierefrei.js eingesetzt und auf jeder Seite vor </body> geladen.
//
// 1. Menüpunkte mit Untermenü: Avada öffnet die Untermenüs rein per
//    CSS (Hover/Fokus). Ohne aria-expanded erfährt ein Screenreader
//    weder, dass es ein Untermenü gibt, noch ob es offen ist
//    (WCAG 4.1.2). Die Attribute werden hier gesetzt und beim
//    Öffnen/Schliessen nachgeführt.
// 2. Cookie-Balken: bekommt eine Rolle und einen Namen, damit er im
//    Screenreader als eigenständiger Hinweis auftaucht.
(function () {
  'use strict';

  function menueNachruesten() {
    var elternpunkte = document.querySelectorAll(
      'li.menu-item-has-children.awb-menu__main-li');
    elternpunkte.forEach(function (li) {
      var link = li.querySelector('a.awb-menu__main-a');
      var untermenu = li.querySelector('.awb-menu__sub-ul');
      if (!link || !untermenu) { return; }
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      var setze = function (offen) {
        link.setAttribute('aria-expanded', offen ? 'true' : 'false');
      };
      li.addEventListener('mouseenter', function () { setze(true); });
      li.addEventListener('mouseleave', function () { setze(false); });
      li.addEventListener('focusin', function () { setze(true); });
      li.addEventListener('focusout', function () {
        // Erst nach dem Fokuswechsel prüfen, ob er das Menü verlassen hat.
        window.setTimeout(function () {
          setze(li.contains(document.activeElement));
        }, 0);
      });
    });
  }

  function cookieBalkenNachruesten() {
    var balken = document.querySelector('.fusion-privacy-bar');
    if (balken && !balken.getAttribute('role')) {
      balken.setAttribute('role', 'region');
      balken.setAttribute('aria-label', 'Hinweis zu Cookies');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      menueNachruesten();
      cookieBalkenNachruesten();
    });
  } else {
    menueNachruesten();
    cookieBalkenNachruesten();
  }
})();
