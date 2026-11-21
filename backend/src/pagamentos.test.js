import test from 'node:test';
import assert from 'node:assert/strict';
import { validarPagamento, iniciarPagamento, normalizarTelefone } from './pagamentos.js';
test('M-Pesa aceita 84/85 e rejeita 86/87', () => {
  assert.equal(validarPagamento('mpesa', '841234567'), '841234567');
  assert.equal(validarPagamento('mpesa', '+258851234567'), '851234567');
  assert.throws(() => validarPagamento('mpesa', '861234567'), /84 ou 85/);
});
test('e-Mola aceita 86/87 e rejeita 84/85', () => {
  assert.equal(validarPagamento('emola', '861234567'), '861234567');
  assert.equal(validarPagamento('emola', '871234567'), '871234567');
  assert.throws(() => validarPagamento('emola', '841234567'), /86 ou 87/);
});
test('recusa telefone inválido e aceita pagamento presencial', () => {
  assert.throws(() => validarPagamento('mpesa', '123'), /9 dígitos/);
  assert.equal(validarPagamento('entrega', ''), null);
  assert.equal(normalizarTelefone('+258 84 123 4567'), '841234567');
});
test('modo de demonstração funciona sem variável de ambiente', () => {
  const old = process.env.PAYMENT_MODE; delete process.env.PAYMENT_MODE;
  try { assert.equal(iniciarPagamento({metodo:'mpesa',telefone:'841234567',valor:200,referencia:'X'}).estado,'pendente_demo'); }
  finally { if(old===undefined)delete process.env.PAYMENT_MODE;else process.env.PAYMENT_MODE=old; }
});
