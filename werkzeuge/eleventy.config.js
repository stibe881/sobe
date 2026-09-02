// Baut aus quelle/ (Vorlagen + Inhalte) die generierten Teile der
// Webseite nach statisch/. Alt-Beiträge liegen als .html mit rohem
// Fusion-Markup vor und dürfen NICHT durch die Template-Engine laufen
// (htmlTemplateEngine: false) – nur Vorlagen und .md-Beiträge sind
// Nunjucks bzw. Markdown.
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'];

export default function (eleventyConfig) {
  eleventyConfig.addCollection('news', (api) =>
    api.getFilteredByGlob('../quelle/news/*').sort(
      (a, b) => (b.data.datum || '').localeCompare(a.data.datum || '')));

  eleventyConfig.addCollection('team', (api) =>
    api.getFilteredByGlob('../quelle/team/*').sort(
      (a, b) => (a.data.reihenfolge || 0) - (b.data.reihenfolge || 0)));

  eleventyConfig.addCollection('stellen', (api) =>
    api.getFilteredByGlob('../quelle/stellen/*').sort(
      (a, b) => (a.data.reihenfolge || 0) - (b.data.reihenfolge || 0)));

  eleventyConfig.addCollection('texte', (api) =>
    api.getFilteredByGlob('../quelle/texte/*'));

  // «2026-08-13» → «13. August 2026», wie es die Pinnwand-Kacheln zeigen.
  eleventyConfig.addFilter('datumDeutsch', (iso) => {
    const [j, m, t] = String(iso).slice(0, 10).split('-').map(Number);
    return `${t}. ${MONATE[m - 1]} ${j}`;
  });


  // Das Redaktionssystem schreibt Bildpfade absolut (/wp-content/…) –
  // Sveltia erlaubt nur absolute public_folder. Damit die Seite auch
  // unter einem Unterpfad (GitHub-Pages-Vorschau /sobe/) funktioniert,
  // werden solche Pfade beim Bau tiefenabhängig relativiert.
  eleventyConfig.addTransform('wpContentRelativ', function (inhalt) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith('.html')) {
      return inhalt;
    }
    const tiefe = this.page.url.split('/').length - 2;
    const praefix = '../'.repeat(Math.max(tiefe, 0)) || './';
    return inhalt.replace(/(src|href)="\/wp-content\//g,
      (treffer, attr) => `${attr}="${praefix}wp-content/`);
  });

  return {
    dir: { input: '../quelle', output: '../statisch', includes: '_includes' },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
