import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toPiqad } from '../src/utils/piqad.js';

describe('toPiqad', () => {
  it('maps Qapla\' to CSUR pIqaD', () => {
    assert.equal(toPiqad("Qapla'"), '\uF8E0\uF8D0\uF8DE\uF8D9\uF8D0\uF8E9');
  });

  it('maps digraphs as single letters', () => {
    assert.equal(toPiqad('tlhIngan'), '\uF8E4\uF8D7\uF8DC\uF8D0\uF8DB');
    assert.equal(toPiqad(' Hol').trim().length > 0, true);
    assert.equal(toPiqad('ghobe\'').length, 5);
    assert.equal(toPiqad('chuq').length, 3);
  });

  it('leaves interpolation placeholders alone', () => {
    assert.equal(toPiqad('QujwI\' {player}'), `${toPiqad("QujwI'")} {player}`);
  });

  it('leaves Latin leftovers that are not Klingon letters', () => {
    assert.equal(toPiqad('MASAKRA'), 'MASAKRA');
    assert.equal(toPiqad('API De\''), `API ${toPiqad("De'")}`);
  });
});
