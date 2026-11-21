import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileCart } from './cart.js';

test('removes cart items that are no longer in stock', () => {
  const result = reconcileCart(
    [{ medicamentoId: 'med1', quantidade: 1 }],
    [{ farmaciaId: 'farm1', medicamentoId: 'med1', quantidade: 0 }],
    'farm1',
  );

  assert.deepEqual(result, { items: [], changed: true });
});

test('limits cart quantity to available stock', () => {
  const result = reconcileCart(
    [{ medicamentoId: 'med1', quantidade: 4 }],
    [{ farmaciaId: 'farm1', medicamentoId: 'med1', quantidade: 2 }],
    'farm1',
  );

  assert.deepEqual(result, {
    items: [{ medicamentoId: 'med1', quantidade: 2 }],
    changed: true,
  });
});

test('preserves cart items when stock is sufficient', () => {
  const cart = [{ medicamentoId: 'med1', quantidade: 2 }];
  const result = reconcileCart(
    cart,
    [{ farmaciaId: 'farm1', medicamentoId: 'med1', quantidade: 5 }],
    'farm1',
  );

  assert.deepEqual(result, { items: cart, changed: false });
  assert.notEqual(result.items, cart);
});
