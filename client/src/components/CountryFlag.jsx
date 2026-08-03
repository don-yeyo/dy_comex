import React from 'react';

/**
 * Diccionario de mapeo de nombres comunes en español a código ISO 3166-1 alpha-2
 */
const COUNTRY_MAP = {
  'argentina': 'ar',
  'brasil': 'br',
  'brazil': 'br',
  'chile': 'cl',
  'uruguay': 'uy',
  'paraguay': 'py',
  'bolivia': 'bo',
  'perú': 'pe',
  'peru': 'pe',
  'colombia': 'co',
  'venezuela': 've',
  'ecuador': 'ec',
  'méxico': 'mx',
  'mexico': 'mx',
  'estados unidos': 'us',
  'eeuu': 'us',
  'ee.uu.': 'us',
  'usa': 'us',
  'canadá': 'ca',
  'canada': 'ca',
  'españa': 'es',
  'espana': 'es',
  'alemania': 'de',
  'italia': 'it',
  'francia': 'fr',
  'reino unido': 'gb',
  'uk': 'gb',
  'china': 'cn',
  'japón': 'jp',
  'japon': 'jp',
  'corea del sur': 'kr',
  'india': 'in',
  'rusia': 'ru',
  'australia': 'au',
  'países bajos': 'nl',
  'holanda': 'nl',
  'panamá': 'pa',
  'panama': 'pa',
  'costa rica': 'cr',
  'república dominicana': 'do',
  'guatemala': 'gt',
  'honduras': 'hn',
  'el salvador': 'sv',
  'nicaragua': 'ni',
  'cuba': 'cu',
  'puerto rico': 'pr'
};

/**
 * Convierte un par de emojise de indicador regional de Unicode (ej: 🇦🇷) a código de 2 letras ISO (ej: ar)
 */
export function emojiToIso(emoji) {
  if (!emoji) return null;
  const str = String(emoji).trim();
  const codePoints = [...str].map(c => c.codePointAt(0));
  if (codePoints.length >= 2 && codePoints[0] >= 0x1F1E6 && codePoints[0] <= 0x1F1FF && codePoints[1] >= 0x1F1E6 && codePoints[1] <= 0x1F1FF) {
    const char1 = String.fromCharCode(codePoints[0] - 0x1F1E6 + 65);
    const char2 = String.fromCharCode(codePoints[1] - 0x1F1E6 + 65);
    return (char1 + char2).toLowerCase();
  }
  // Si ingresó el código directo de 2 letras (ej: "AR", "BR")
  if (/^[a-zA-Z]{2}$/.test(str)) {
    return str.toLowerCase();
  }
  return null;
}

/**
 * Resuelve el código ISO 2 letras a partir de emoji, nombre o código
 */
export function resolveIsoCode(countryName, bandera) {
  let iso = emojiToIso(bandera);
  if (iso) return iso;
  if (countryName) {
    const norm = String(countryName).toLowerCase().trim();
    if (COUNTRY_MAP[norm]) return COUNTRY_MAP[norm];
  }
  return null;
}

/**
 * Componente CountryFlag — Renderiza la bandera oficial en formato SVG/PNG de alta definición
 * solucionando el problema de renderizado de emojis de banderas como letras en Windows.
 */
export default function CountryFlag({ countryName, bandera, code, size = 20, style = {}, className = '' }) {
  const iso = resolveIsoCode(countryName, bandera || code);

  if (iso) {
    return (
      <img
        src={`https://flagcdn.com/w40/${iso}.png`}
        srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
        alt={countryName || iso}
        title={countryName || iso.toUpperCase()}
        className={`country-flag-img ${className}`}
        style={{
          width: `${size}px`,
          height: `${Math.round(size * 0.72)}px`,
          objectFit: 'cover',
          borderRadius: '3px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return <span className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>{bandera || '🌐'}</span>;
}
