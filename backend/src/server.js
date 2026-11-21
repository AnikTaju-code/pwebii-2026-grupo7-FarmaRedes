import 'dotenv/config';
import express from 'express';import cors from 'cors';import helmet from 'helmet';import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';import bcrypt from 'bcryptjs';import {randomUUID} from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {medicamentos,haversine} from './catalog.js';import {carregar,salvar} from './store.js';
import {RegraErro,validarItens,calcularEntrega,reservarStock,devolverStock} from './logic.js';import {iniciarPagamento,normalizarTelefone} from './pagamentos.js';import {enviarSMS,smsConfigurado} from './sms.js';
const app=express();const port=Number(process.env.PORT||3001);const secret=process.env.JWT_SECRET||(process.env.NODE_ENV==='production'?null:'dev-only-change-this-secret');if(!secret)throw new Error('Configure JWT_SECRET no servidor.');let db=carregar();
app.use(helmet());app.use(cors({origin:(process.env.FRONTEND_ORIGIN||'http://localhost:5173').split(',')}));app.use(express.json({limit:'30kb'}));app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:60,standardHeaders:'draft-7',legacyHeaders:false}));
const clientes=new Set();const notify=(event,data)=>{for(const res of clientes){res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);}};
function token(user){return jwt.sign({id:user.id,nome:user.nome,perfil:user.perfil,farmaciaId:user.farmaciaId||null},secret,{expiresIn:'8h'});}
function auth(req,res,next){const raw=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');try{req.user=jwt.verify(raw,secret);next();}catch{res.status(401).json({erro:'Sessão inválida ou expirada.'});}}
function gestor(req,res,next){if(req.user.perfil!=='gestor')return res.status(403).json({erro:'Acesso reservado ao gestor.'});next();}
const safeUser=u=>({id:u.id,nome:u.nome,email:u.email,perfil:u.perfil,farmaciaId:u.farmaciaId||null});
const emailOk=s=>typeof s==='string'&&/^\S+@\S+\.\S+$/.test(s)&&s.length<=120;
app.get('/api/saude',(_req,res)=>res.json({ok:true,modoPagamento:process.env.PAYMENT_MODE||'demo',smsConfigurado:smsConfigurado()}));
app.get('/api/catalogo',(req,res)=>{
 const q=String(req.query.q||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const lista=medicamentos.filter(m=>`${m.nome} ${m.dosagem} ${m.categoria}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));res.json(lista);
});
app.get('/api/farmacias',(req,res)=>{const {lat,lng}=req.query;const coords=Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&lat!==undefined&&lng!==undefined;let f=db.farmacias.map(x=>({...x,distanciaKm:coords?haversine(Number(lat),Number(lng),x.lat,x.lng):null}));if(coords)f.sort((a,b)=>a.distanciaKm-b.distanciaKm);res.json(f);});
app.get('/api/stock',(req,res)=>{const {farmaciaId,medicamentoId}=req.query;const result=db.stock.filter(x=>(!farmaciaId||x.farmaciaId===farmaciaId)&&(!medicamentoId||x.medicamentoId===medicamentoId));res.json(result);});
const numero=s=>typeof s==='string'&&/^(?:\+?258)?8[4567]\d{7}$/.test(s.replace(/\s/g,''));
function localValido(d){return d&&typeof d.nomeFarmacia==='string'&&d.nomeFarmacia.trim().length>=3&&typeof d.endereco==='string'&&d.endereco.trim().length>=5&&typeof d.bairro==='string'&&d.bairro.trim().length>=2&&d.lat!==null&&d.lng!==null&&d.lat!==undefined&&d.lng!==undefined&&Number.isFinite(Number(d.lat))&&Number.isFinite(Number(d.lng))&&Number(d.lat)>=-27.1&&Number(d.lat)<=-10.4&&Number(d.lng)>=30&&Number(d.lng)<=41&&numero(String(d.telefone||''));}
app.post('/api/auth/registo',async(req,res,next)=>{try{
 const {nome,email,senha,tipoConta='cliente'}=req.body;
 if(typeof nome!=='string'||nome.trim().length<2||nome.length>80||!emailOk(email)||typeof senha!=='string'||senha.length<8)throw new RegraErro(400,'Preencha nome, email e palavra-passe com pelo menos 8 caracteres.');
 if(!['cliente','farmacia'].includes(tipoConta))throw new RegraErro(400,'Tipo de conta inválido.');
 if(db.utilizadores.some(u=>u.email===email.trim().toLowerCase()))throw new RegraErro(409,'Este email já está registado.');
 if(tipoConta==='farmacia'&&!localValido(req.body))throw new RegraErro(400,'Preencha os dados da farmácia e marque uma localização válida no mapa de Moçambique.');
 const u={id:randomUUID(),nome:nome.trim(),email:email.trim().toLowerCase(),hash:await bcrypt.hash(senha,10),perfil:tipoConta==='farmacia'?'gestor':'cliente'};
 if(tipoConta==='farmacia'){
   const farmaciaId=randomUUID();u.farmaciaId=farmaciaId;
   db.farmacias.push({id:farmaciaId,gestorId:u.id,nome:req.body.nomeFarmacia.trim(),bairro:req.body.bairro.trim(),endereco:req.body.endereco.trim(),lat:Number(req.body.lat),lng:Number(req.body.lng),telefone:String(req.body.telefone).trim(),horario:'08:00–18:00'});
 }
 db.utilizadores.push(u);salvar(db);notify('actualizacao',{tipo:'farmacias'});
 res.status(201).json({token:token(u),utilizador:safeUser(u)});
}catch(e){next(e);}});
app.post('/api/auth/login',async(req,res,next)=>{try{const {email,senha}=req.body;const u=db.utilizadores.find(x=>x.email===String(email||'').toLowerCase());if(!u||!(await bcrypt.compare(String(senha||''),u.hash)))throw new RegraErro(401,'Credenciais incorrectas.');res.json({token:token(u),utilizador:safeUser(u)});}catch(e){next(e);}});
app.get('/api/auth/eu',auth,(req,res)=>{const u=db.utilizadores.find(x=>x.id===req.user.id);if(!u)return res.status(401).json({erro:'Conta indisponível.'});res.json(safeUser(u));});
app.post('/api/pedidos',auth,(req,res,next)=>{try{
 const {farmaciaId,itens,tipoEntrega,morada,metodoPagamento,telefone,telefoneContacto,receberSMS}=req.body;
 if(!db.farmacias.some(f=>f.id===farmaciaId))throw new RegraErro(404,'Farmácia não encontrada.');
 if(receberSMS && !numero(normalizarTelefone(telefoneContacto)))throw new RegraErro(400,'Indique um contacto válido para receber SMS.');
 if(tipoEntrega==='entrega'&&(typeof morada!=='string'||morada.trim().length<8||morada.length>200))throw new RegraErro(400,'Indique uma morada de entrega válida.');
 const lista=validarItens(itens,db.stock,farmaciaId);const subtotal=lista.reduce((s,i)=>s+i.subtotal,0);const taxaEntrega=calcularEntrega(tipoEntrega,subtotal);
 const id=randomUUID();const pagamento=iniciarPagamento({metodo:metodoPagamento,telefone,valor:subtotal+taxaEntrega,referencia:id});
 reservarStock(db.stock,lista,farmaciaId);
 const pedido={id,clienteId:req.user.id,farmaciaId,telefoneContacto:receberSMS?normalizarTelefone(telefoneContacto):null,notificacao:{estado:receberSMS?'a_enviar':'nao_solicitada'},itens:lista,tipoEntrega,morada:tipoEntrega==='entrega'?morada.trim():null,subtotal,taxaEntrega,total:subtotal+taxaEntrega,estado:'aguarda_pagamento',pagamento,criadoEm:new Date().toISOString(),historico:[{estado:'aguarda_pagamento',data:new Date().toISOString()}]};
 if(metodoPagamento==='entrega'){pedido.estado='confirmado';pedido.historico.push({estado:'confirmado',data:new Date().toISOString()});}
 db.pedidos.unshift(pedido);salvar(db);notify('actualizacao',{tipo:'pedido',id});res.status(201).json(pedido);
 if(receberSMS){enviarSMS(telefoneContacto,`FarmaRede: encomenda ${id.slice(0,8).toUpperCase()} recebida. Total: ${pedido.total.toFixed(2)} MT. Consulte o estado na aplicacao.`).then(r=>{pedido.notificacao=r;salvar(db);notify('actualizacao',{tipo:'sms',id});}).catch(()=>{pedido.notificacao={estado:'erro'};salvar(db);notify('actualizacao',{tipo:'sms',id});});}
 }catch(e){next(e);}});
const limiteTesteSMS=rateLimit({windowMs:60*60*1000,limit:3,standardHeaders:'draft-7',legacyHeaders:false});
app.post('/api/notificacoes/teste-sms',auth,limiteTesteSMS,async(req,res,next)=>{try{
 if(!smsConfigurado())throw new RegraErro(503,'O serviço SMS ainda não foi configurado.');
 if(!numero(normalizarTelefone(req.body.telefone)))throw new RegraErro(400,'Indique um número válido.');
 const resultado=await enviarSMS(req.body.telefone,'FarmaRede: teste de notificacao SMS.');
 if(resultado.estado==='erro')throw new RegraErro(502,'O provedor SMS não aceitou o envio. Consulte os registos do servidor.');
 res.json({estado:resultado.estado,referencia:resultado.referencia});
}catch(e){next(e);}});
app.get('/api/pedidos',auth,(req,res)=>{res.json(db.pedidos.filter(p=>(req.user.perfil==='gestor'&&p.farmaciaId===req.user.farmaciaId)||p.clienteId===req.user.id).map(p=>({...p,clienteNome:db.utilizadores.find(u=>u.id===p.clienteId)?.nome||'Cliente'})));});
app.post('/api/pedidos/:id/simular-pagamento',auth,(req,res,next)=>{try{const p=db.pedidos.find(x=>x.id===req.params.id);if(!p||p.clienteId!==req.user.id)throw new RegraErro(404,'Pedido não encontrado.');if(p.pagamento.modo!=='DEMONSTRACAO'||p.pagamento.estado!=='pendente_demo'||p.estado!=='aguarda_pagamento')throw new RegraErro(409,'Pagamento não pode ser simulado neste estado.');const aprovar=req.body.aprovar===true;p.pagamento.estado=aprovar?'aprovado_demo':'recusado_demo';p.estado=aprovar?'confirmado':'cancelado';if(!aprovar)devolverStock(db.stock,p.itens,p.farmaciaId);p.historico.push({estado:p.estado,data:new Date().toISOString()});salvar(db);notify('actualizacao',{tipo:'pagamento',id:p.id});res.json(p);}catch(e){next(e);}});
app.patch('/api/pedidos/:id/estado',auth,gestor,(req,res,next)=>{try{const p=db.pedidos.find(x=>x.id===req.params.id);if(!p||p.farmaciaId!==req.user.farmaciaId)throw new RegraErro(404,'Pedido não encontrado.');const regras={confirmado:['em_preparacao','cancelado'],em_preparacao:['em_entrega','pronto_recolha','cancelado'],em_entrega:['entregue'],pronto_recolha:['entregue']};const novo=req.body.estado;if(!regras[p.estado]?.includes(novo))throw new RegraErro(409,'Transição de estado inválida.');if(novo==='cancelado')devolverStock(db.stock,p.itens,p.farmaciaId);p.estado=novo;p.historico.push({estado:novo,data:new Date().toISOString()});salvar(db);notify('actualizacao',{tipo:'pedido',id:p.id});res.json(p);}catch(e){next(e);}});
app.patch('/api/stock/:farmaciaId/:medicamentoId',auth,gestor,(req,res,next)=>{try{const s=db.stock.find(x=>x.farmaciaId===req.params.farmaciaId&&x.medicamentoId===req.params.medicamentoId);if(!s||req.params.farmaciaId!==req.user.farmaciaId)throw new RegraErro(404,'Registo de stock não encontrado.');const {quantidade,preco,versao}=req.body;if(!Number.isInteger(versao)||versao!==s.versao)throw new RegraErro(409,'O stock mudou. Actualize os dados antes de guardar.');if(!Number.isInteger(quantidade)||quantidade<0||quantidade>10000||typeof preco!=='number'||!Number.isFinite(preco)||preco<=0||preco>100000)throw new RegraErro(400,'Quantidade ou preço inválidos.');s.quantidade=quantidade;s.preco=Math.round(preco*100)/100;s.versao++;salvar(db);notify('actualizacao',{tipo:'stock',farmaciaId:s.farmaciaId});res.json(s);}catch(e){next(e);}});
app.put('/api/minha-farmacia',auth,gestor,(req,res,next)=>{try{
 const f=db.farmacias.find(x=>x.id===req.user.farmaciaId);
 if(!f)throw new RegraErro(404,'Farmácia não encontrada.');
 const d={...req.body,nomeFarmacia:req.body.nomeFarmacia||f.nome};
 if(!localValido(d))throw new RegraErro(400,'Verifique o nome, telefone, endereço e localização.');
 Object.assign(f,{nome:d.nomeFarmacia.trim(),bairro:d.bairro.trim(),endereco:d.endereco.trim(),lat:Number(d.lat),lng:Number(d.lng),telefone:d.telefone.trim(),horario:String(req.body.horario||f.horario).slice(0,80)});
 salvar(db);notify('actualizacao',{tipo:'farmacias'});res.json(f);
}catch(e){next(e);}});
app.put('/api/meu-stock/:medicamentoId',auth,gestor,(req,res,next)=>{try{
 const medicamentoId=req.params.medicamentoId;
 if(!medicamentos.some(m=>m.id===medicamentoId))throw new RegraErro(404,'Medicamento não encontrado.');
 const {quantidade,preco,versao}=req.body;
 if(!Number.isInteger(quantidade)||quantidade<0||quantidade>10000||typeof preco!=='number'||!Number.isFinite(preco)||preco<=0||preco>100000)throw new RegraErro(400,'Indique uma quantidade e um preço válidos.');
 let s=db.stock.find(x=>x.farmaciaId===req.user.farmaciaId&&x.medicamentoId===medicamentoId);
 if(s){if(versao!==s.versao)throw new RegraErro(409,'O stock mudou. Volte a abrir a edição.');s.quantidade=quantidade;s.preco=Math.round(preco*100)/100;s.versao++;}
 else {s={farmaciaId:req.user.farmaciaId,medicamentoId,quantidade,preco:Math.round(preco*100)/100,versao:1};db.stock.push(s);}
 salvar(db);notify('actualizacao',{tipo:'stock',farmaciaId:req.user.farmaciaId});res.json(s);
}catch(e){next(e);}});
app.get('/api/eventos',(_req,res)=>{res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('Connection','keep-alive');res.flushHeaders();res.write('event: ligado\ndata: {}\n\n');clientes.add(res);const timer=setInterval(()=>res.write(': ping\n\n'),25000);res.on('close',()=>{clearInterval(timer);clientes.delete(res);});});
app.use((err,_req,res,_next)=>{console.error(err.message);res.status(err.status||500).json({erro:err.status?err.message:'Erro interno do servidor.'});});
// Em Render, servir a compilação Vue pelo mesmo domínio da API.
const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../frontend/dist');
app.use(express.static(dist));
app.get('*',(_req,res)=>res.sendFile(path.join(dist,'index.html')));
app.listen(port,'0.0.0.0',()=>console.log(`FarmaRede em ${port}`));
