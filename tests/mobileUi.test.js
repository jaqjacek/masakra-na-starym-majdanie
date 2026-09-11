import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeIsMobileUi } from '../src/hooks/useMobileUi.js';

describe('computeIsMobileUi', () => {
  it('follows auto from the viewport width', () => {
    assert.equal(computeIsMobileUi('auto', true), true);
    assert.equal(computeIsMobileUi('auto', false), false);
  });

  it('honours an explicit mobile or desktop override', () => {
    assert.equal(computeIsMobileUi('mobile', false), true);
    assert.equal(computeIsMobileUi('desktop', true), false);
  });
});
