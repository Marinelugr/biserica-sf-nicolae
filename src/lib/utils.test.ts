import { describe, it, expect } from 'vitest'
import { htmlToPlainText, readingTime } from './utils'

describe('htmlToPlainText', () => {
  it('&nbsp; nu mai apare și nu lasă spații', () => {
    expect(htmlToPlainText('&nbsp;&nbsp;Text')).toBe('Text')
    expect(htmlToPlainText('<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Bucurie duhovnicească</p>')).toBe('Bucurie duhovnicească')
    expect(htmlToPlainText('a b')).toBe('a b')
  })
  it('entități numite și numerice', () => {
    expect(htmlToPlainText('Tom &amp; Jerry')).toBe('Tom & Jerry')
    expect(htmlToPlainText('1990 &#8211; 2000')).toBe('1990 – 2000')
    expect(htmlToPlainText('&icirc;n biseric&#259;')).toBe('în biserică')
  })
  it('etichete imbricate devin spațiu între cuvinte', () => {
    expect(htmlToPlainText('<div><p>Unu<strong>doi</strong></p><ul><li>trei</li></ul></div>')).toBe('Unu doi trei')
  })
  it('scoate conținutul <script> și <style>', () => {
    expect(htmlToPlainText('<script>alert(1)</script>Salut')).toBe('Salut')
    expect(htmlToPlainText('<style type="text/css">p{color:red}</style><SCRIPT src="x"></SCRIPT >Salut')).toBe('Salut')
  })
  it('șir gol / null', () => {
    expect(htmlToPlainText('')).toBe('')
    expect(htmlToPlainText(null)).toBe('')
    expect(htmlToPlainText(undefined)).toBe('')
  })
  it('HTML invalid', () => {
    expect(htmlToPlainText('<p>fără închidere')).toBe('fără închidere')
  })
})

describe('readingTime', () => {
  it('&nbsp; nu se numără drept cuvinte', () => {
    expect(readingTime(`<p>${'cuvânt '.repeat(400)}</p>`)).toBe(2)
    expect(readingTime(`<p>${'cuvânt&nbsp;'.repeat(400)}</p>`)).toBe(2)
  })
})
