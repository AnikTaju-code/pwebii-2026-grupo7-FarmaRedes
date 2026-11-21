export class RegraErro extends Error {constructor(status,mensagem){super(mensagem);this.status=status;}}
export function validarItens(itens,stock,farmaciaId){
 if(!Array.isArray(itens)||!itens.length||itens.length>20)throw new RegraErro(400,'Carrinho inválido.');
 const ids=new Set();return itens.map(it=>{
  if(typeof it.medicamentoId!=='string'||!Number.isInteger(it.quantidade)||it.quantidade<1||it.quantidade>20||ids.has(it.medicamentoId))throw new RegraErro(400,'Itens inválidos ou repetidos.');
  ids.add(it.medicamentoId);const reg=stock.find(x=>x.farmaciaId===farmaciaId&&x.medicamentoId===it.medicamentoId);
  if(!reg)throw new RegraErro(404,'Medicamento não disponível nesta farmácia.');
  if(reg.quantidade<it.quantidade)throw new RegraErro(409,`Stock insuficiente para ${it.medicamentoId}.`);
  return {medicamentoId:it.medicamentoId,quantidade:it.quantidade,preco:reg.preco,subtotal:reg.preco*it.quantidade};
 });
}
export function calcularEntrega(tipo,subtotal){if(tipo==='recolha')return 0;if(tipo==='entrega')return subtotal>=1500?0:120;throw new RegraErro(400,'Tipo de entrega inválido.');}
export function reservarStock(stock,items,farmaciaId){for(const i of items){const r=stock.find(x=>x.farmaciaId===farmaciaId&&x.medicamentoId===i.medicamentoId);r.quantidade-=i.quantidade;r.versao++;}}
export function devolverStock(stock,items,farmaciaId){for(const i of items){const r=stock.find(x=>x.farmaciaId===farmaciaId&&x.medicamentoId===i.medicamentoId);if(r){r.quantidade+=i.quantidade;r.versao++;}}}
