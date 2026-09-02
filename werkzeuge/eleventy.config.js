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

  return {
    dir: { input: '../quelle', output: '../statisch', includes: '_includes' },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
