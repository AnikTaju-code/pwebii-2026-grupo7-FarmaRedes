import test from 'node:test';import assert from 'node:assert/strict';
import { validarItens, calcularEntrega, reservarStock, devolverStock } from './logic.js';
const criar=()=>[{farmaciaId:'farm-test',medicamentoId:'med1',quantidade:4,preco:45,versao:1}];
test('preço é calculado pelo servidor, stock é reservado e devolvido',()=>{const s=criar();const itens=validarItens([{medicamentoId:'med1',quantidade:2,preco:0}],s,'farm-test');assert.equal(itens[0].subtotal,90);reservarStock(s,itens,'farm-test');assert.equal(s[0].quantidade,2);devolverStock(s,itens,'farm-test');assert.equal(s[0].quantidade,4);});
test('não vende stock insuficiente',()=>assert.throws(()=>validarItens([{medicamentoId:'med1',quantidade:20}],criar(),'farm-test'),{status:409}));
test('entrega grátis acima do limiar',()=>{assert.equal(calcularEntrega('entrega',1499),120);assert.equal(calcularEntrega('entrega',1500),0);assert.equal(calcularEntrega('recolha',100),0);});
