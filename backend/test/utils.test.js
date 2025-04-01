const assert = require('assert');
const { deck } = require('../utils');

describe('Utils Tests', () => {
    it('should generate a full deck of 52 cards', () => {
        const cards = deck();
        assert.strictEqual(cards.length, 52);
        assert(cards.includes('A♠'));
        assert(cards.includes('2♦'));
        assert(new Set(cards).size === 52);
    });
});