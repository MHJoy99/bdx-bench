// BDX Bench smoke test: aggregate math (mean).
// Runnable via: node tests/smoke.js (plain node, no deps).
'use strict';
const assert = require('node:assert/strict');

function mean(xs) {
  if (!Array.isArray(xs)) throw new TypeError('mean expects an array');
  if (xs.length === 0) return NaN;
  let sum = 0;
  for (const x of xs) {
    if (typeof x !== 'number' || Number.isNaN(x)) throw new TypeError('mean expects numbers');
    sum += x;
  }
  return sum / xs.length;
}

function check(name, fn) {
  fn();
  console.log(`PASS: ${name}`);
}

check('mean of [1,2,3] is 2', () => assert.equal(mean([1, 2, 3]), 2));
check('mean of single element [10] is 10', () => assert.equal(mean([10]), 10));
check('mean of zeros is 0', () => assert.equal(mean([0, 0, 0]), 0));
check('mean handles negatives: [-1,1] is 0', () => assert.equal(mean([-1, 1]), 0));
check('mean of floats [0.5,1.5] is 1', () => assert.equal(mean([0.5, 1.5]), 1));
check('mean of empty array is NaN', () => assert.ok(Number.isNaN(mean([]))));

console.log('smoke OK: all mean assertions passed');
