/**
 * Curățarea textului unui verset la import. Nu schimbă ortografia („sînt"/„sunt",
 * „î"/„â" rămân ca în sursă) — asta e o decizie separată a lui Marin.
 * Fără importuri din React/Next și fără `@/`.
 */

const CEDILLA: Record<string, string> = { 'ş': 'ș', 'ţ': 'ț', 'Ş': 'Ș', 'Ţ': 'Ț' }
const CEDILLA_RE = /[şţŞŢ]/g

/** Câte litere cu sedilă (ş ţ Ş Ţ) conține textul. */
export function countCedillas(text: string): number {
  return (text.match(CEDILLA_RE) || []).length
}

/**
 * Caracterele de lățime zero și cratima moale dispar (întâi, ca să nu rămână
 * după NFC un semn diacritic separat); NFC; ş ţ Ş Ţ (sedilă) → ș ț Ș Ț (virgulă);
 * spațiul nerupt devine spațiu; spațiile multiple devin unul; fără spații la capete.
 */
export function normalizeVerseText(text: string): string {
  return text
    .replace(/[​-‍⁠﻿­]/g, '')
    .normalize('NFC')
    .replace(CEDILLA_RE, c => CEDILLA[c])
    .replace(/[   ]/g, ' ')
    .replace(/[ \t\r\n\f\v]+/g, ' ')
    .trim()
}
