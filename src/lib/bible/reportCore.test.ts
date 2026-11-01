import { describe, it, expect } from 'vitest'
import { checkReportMessage, clientAddress, containsUrl, isHoneypotFilled, throttleKey } from './reportCore'

describe('mesajul', () => {
  it('e opțional', () => {
    expect(checkReportMessage('   ')).toEqual({ ok: true, message: null })
  })
  it('se curăță: sedilă, spații', () => {
    expect(checkReportMessage('  lipseşte   un cuvânt ')).toEqual({ ok: true, message: 'lipsește un cuvânt' })
  })
  it('exact 300 de caractere trece; 301 nu', () => {
    expect(checkReportMessage('a'.repeat(300)).ok).toBe(true)
    expect(checkReportMessage('a'.repeat(301))).toEqual({ ok: false, code: 'too-long' })
  })
  it('caracterele de control sunt respinse', () => {
    expect(checkReportMessage('text\u0007')).toEqual({ ok: false, code: 'invalid' })
  })
  it.each(['vezi http://exemplu.test', 'HTTPS://exemplu.test/x', 'www.exemplu', 'mergi pe exemplu.com acum', 'ftp://x'])('respinge adresa: %s', text => {
    expect(containsUrl(text)).toBe(true)
    expect(checkReportMessage(text)).toEqual({ ok: false, code: 'url' })
  })
  it.each(['Lipsește un cuvânt.', 'la versetul 3.5 e greșit', 'scrie „Domnul” de două ori.Apoi urmează'])('păstrează textul obișnuit: %s', text => {
    expect(containsUrl(text)).toBe(false)
  })
})

describe('capcana', () => {
  it('câmpul completat e detectat', () => {
    expect(isHoneypotFilled('robot')).toBe(true)
    expect(isHoneypotFilled('')).toBe(false)
    expect(isHoneypotFilled(undefined)).toBe(false)
  })
})

describe('cheia limitării', () => {
  it('nu conține adresa în clar', () => {
    const key = throttleKey('203.0.113.7', 'Navigator', 'sare')
    expect(key).toMatch(/^[0-9a-f]{64}$/)
    expect(key).not.toContain('203.0.113.7')
  })
  it('diferă după adresă, user-agent și sare', () => {
    const base = throttleKey('203.0.113.7', 'N', 's')
    expect(throttleKey('203.0.113.8', 'N', 's')).not.toBe(base)
    expect(throttleKey('203.0.113.7', 'M', 's')).not.toBe(base)
    expect(throttleKey('203.0.113.7', 'N', 't')).not.toBe(base)
    expect(throttleKey('203.0.113.7', 'N', 's')).toBe(base)
  })
  it('folosește ultima adresă: pe cele dinainte le poate inventa oricine', () => {
    expect(clientAddress('1.1.1.1, 2.2.2.2', null)).toBe('2.2.2.2')
    expect(clientAddress(null, '3.3.3.3')).toBe('3.3.3.3')
    expect(clientAddress(null, null)).toBe('necunoscut')
  })
})
