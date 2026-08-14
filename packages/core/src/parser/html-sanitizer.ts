/**
 * Decodes HTML entities into Unicode characters
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';

  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&auml;/g, 'ä')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß')
    .replace(/&euro;/gi, '€')
    .replace(/&copy;/gi, '©')
    .replace(/&deg;/gi, '°')
    .replace(/&bull;/gi, '•')
    .replace(/&hellip;/gi, '…')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&#(\d+);/g, (_, num) => {
      const code = parseInt(num, 10);
      return !isNaN(code) ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return !isNaN(code) ? String.fromCharCode(code) : '';
    });
}

/**
 * Strips HTML tags from a string, keeping entity decodes
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ''));
}
