import { randomUUID } from 'node:crypto';
import { RegraErro } from './logic.js';

export const modalidades = ['mpesa', 'emola', 'entrega'];
export function normalizarTelefone(valor) {
  return String(valor ?? '').replace(/[\s()-]/g, '').replace(/^(?:\+?258)/, '');
}
export function validarPagamento(metodo, telefone) {
  if (!modalidades.includes(metodo)) throw new RegraErro(400, 'Escolha uma forma de pagamento válida.');
  if (metodo === 'entrega') return null;
  const numero = normalizarTelefone(telefone);
  if (!/^8[4567]\d{7}$/.test(numero)) throw new RegraErro(400, 'Introduza um número de telemóvel válido com 9 dígitos.');
  if (metodo === 'mpesa' && !/^8[45]/.test(numero)) throw new RegraErro(400, 'Para M-Pesa utilize um número começado por 84 ou 85.');
  if (metodo === 'emola' && !/^8[67]/.test(numero)) throw new RegraErro(400, 'Para e-Mola utilize um número começado por 86 ou 87.');
  return numero;
}
export function iniciarPagamento({ metodo, telefone, valor, referencia }) {
  const numero = validarPagamento(metodo, telefone);
  // A integração bancária só é efectuada mediante contrato e confirmação verificada.
  if ((process.env.PAYMENT_MODE || 'demo') !== 'demo') {
    throw new RegraErro(503, 'O pagamento electrónico está temporariamente indisponível.');
  }
  return { id: randomUUID(), referencia, metodo, valor,
    telefone: numero, estado: metodo === 'entrega' ? 'pagamento_na_entrega' : 'pendente_demo',
    modo: 'DEMONSTRACAO', criadoEm: new Date().toISOString() };
}
