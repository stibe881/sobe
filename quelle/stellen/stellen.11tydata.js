// Standardwerte für neue Inserate aus dem Redaktionssystem: Alt-
// Inserate bringen layout/permalink im Frontmatter mit; neue
// .md-Dateien brauchen nur Titel, Bewerbungslink und Reihenfolge.
export default {
  layout: 'stellen-rahmen.njk',
  beitragId: 'cms',
  knopfImText: false,
  reihenfolge: 500,
  permalink: (data) => `/job/${data.page.fileSlug}/index.html`,
};
