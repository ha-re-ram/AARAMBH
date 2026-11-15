const { test, describe } = require('node:test');
const assert = require('node:assert');
const { ICONS, getIconSvg } = require('../js/icons.js');

describe('Icons Provider Tests', () => {
  test('contains all critical application icons', () => {
    const required = [
      'sparkles', 'sparkle', 'shield-heart', 'heart', 'flower', 
      'star', 'plus', 'plus-circle', 'download', 'upload', 
      'feather', 'user', 'zap', 'target', 'sun', 'trash', 
      'edit', 'check', 'x', 'shield-check'
    ];

    required.forEach(name => {
      assert.ok(ICONS[name], `Missing icon: ${name}`);
      assert.ok(ICONS[name].startsWith('<svg'), `Icon ${name} is not a valid SVG`);
    });
  });

  test('getIconSvg adds accessibility attributes', () => {
    const svg = getIconSvg('heart', 'w-5 h-5 text-primary');
    assert.ok(svg.includes('class="w-5 h-5 text-primary"'));
    assert.ok(svg.includes('aria-hidden="true"'));
    assert.ok(svg.includes('focusable="false"'));
  });
});
