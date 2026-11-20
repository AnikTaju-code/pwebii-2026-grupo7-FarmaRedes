<script setup>
import {ref,reactive} from 'vue';
import {useRouter,useRoute} from 'vue-router';
import {useApp} from '../stores/app';
import api from '../services/api';
import SeleccionarLocal from '../components/SeleccionarLocal.vue';
const router=useRouter(),route=useRoute(),s=useApp();
const reg=ref(false),tipoConta=ref('cliente'),busy=ref(false),error=ref('');
const dados=reactive({nome:'',email:'',senha:'',nomeFarmacia:'',bairro:'',endereco:'',telefone:'',lat:null,lng:null});
function escolherLocal(p){dados.lat=p.lat;dados.lng=p.lng;}
async function enviar(){busy.value=true;error.value='';try{
 const payload=reg.value?{...dados,tipoConta:tipoConta.value}:{email:dados.email,senha:dados.senha};
 const r=await api.post(reg.value?'/auth/registo':'/auth/login',payload);
 s.guardarSessao(r.data);await s.carregar();router.push(route.query.voltar||(s.gestor?'/gestao':'/'));
}catch(e){error.value=e.message;}finally{busy.value=false;}}
</script>
<template><div class="container page"><div class="auth-card" style="max-width:620px;margin:auto"><h1>{{reg?'Criar conta':'Entrar'}}</h1><p class="muted">{{reg?'Escolha como pretende utilizar o FarmaRede.':'Aceda à sua conta.'}}</p>
<div v-if="error" class="alert error">{{error}}</div>
<form @submit.prevent="enviar">
<label v-if="reg">Tipo de conta<select v-model="tipoConta"><option value="cliente">Cliente</option><option value="farmacia">Farmácia</option></select></label>
<label v-if="reg">Nome completo<input v-model.trim="dados.nome" required minlength="2" placeholder="Nome completo"/></label>
<label>Email<input v-model.trim="dados.email" type="email" required placeholder="email@exemplo.mz"/></label>
<label>Palavra-passe<input v-model="dados.senha" type="password" minlength="8" required placeholder="Pelo menos 8 caracteres"/></label>
<template v-if="reg&&tipoConta==='farmacia'">
<h2>Dados da farmácia</h2>
<label>Nome da farmácia<input v-model.trim="dados.nomeFarmacia" required minlength="3"/></label>
<label>Telefone<input v-model.trim="dados.telefone" required placeholder="841234567"/></label>
<label>Bairro<input v-model.trim="dados.bairro" required/></label>
<label>Endereço<input v-model.trim="dados.endereco" required/></label>
<label>Localização no mapa<small>Toque no ponto onde a farmácia está localizada.</small></label>
<SeleccionarLocal :lat="dados.lat" :lng="dados.lng" @escolher="escolherLocal"/>
<p class="muted">{{dados.lat===null?'Localização por marcar':`Latitude: ${dados.lat.toFixed(5)} · Longitude: ${dados.lng.toFixed(5)}`}}</p>
</template>
<button class="button primary full" :disabled="busy||(reg&&tipoConta==='farmacia'&&dados.lat===null)">{{busy?'A guardar...':reg?'Criar conta':'Entrar'}}</button>
</form><p class="auth-switch">{{reg?'Já tem conta?':'Ainda não tem conta?'}} <button type="button" @click="reg=!reg;error=''">{{reg?'Entrar':'Criar conta'}}</button></p>
</div></div></template>
