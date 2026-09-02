// Standardwerte für neue Beiträge aus dem Redaktionssystem: Die
// Alt-Beiträge bringen layout/permalink im Frontmatter mit (gleiche
// Werte); neue .md-Dateien brauchen nur Titel, Datum und Kategorien.
export default {
  layout: 'news-rahmen.njk',
  beitragId: 'cms',
  kategorien: ['aktuelles'],
  permalink: (data) => `/${data.page.fileSlug}/index.html`,
};
