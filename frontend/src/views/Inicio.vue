<script setup>
import {computed,ref} from 'vue';import CartaoMedicamento from '../components/CartaoMedicamento.vue';import FiltrosMedicamentos from '../components/FiltrosMedicamentos.vue';import EstadoVazio from '../components/EstadoVazio.vue';import {useApp} from '../stores/app';import {Search,MapPin,ArrowRight,ShoppingCart,Truck,SlidersHorizontal,ChevronDown,Pill} from 'lucide-vue-next';
const irCatalogo=()=>window.document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'});const s=useApp();const q=ref(''),categoria=ref('Todas');const categorias=['Todas','Dor e febre','Dor e inflamação','Vitaminas','Cuidados','Alergias','Digestivo','Equipamentos'];
const lista=computed(()=>s.medicamentos.filter(m=>{const term=q.value.trim().toLowerCase();return (!term||`${m.nome} ${m.dosagem} ${m.categoria}`.toLowerCase().includes(term))&&(categoria.value==='Todas'||m.categoria===categoria.value)}));const farmacia=computed(()=>s.farmacias.find(f=>f.id===s.farmaciaActual));const getStock=id=>s.stock.find(t=>t.farmaciaId===s.farmaciaActual&&t.medicamentoId===id);
</script>
<template>
  <div class="simple-home">
    <section class="container simple-intro">
      <p class="simple-kicker">FARMAREDE · FARMÁCIA ONLINE</p>
      <h1>Encontre os seus medicamentos</h1>
      <p>Pesquise medicamentos, consulte o preço e escolha a farmácia onde pretende comprar.</p>
      <div class="simple-search"><Search :size="19"/><input v-model="q" placeholder="Pesquisar medicamento..." aria-label="Pesquisar medicamento" /></div>
    </section>
    <section id="catalogo" class="container simple-catalog">
      <div class="simple-section-heading"><h2>Medicamentos disponíveis</h2><router-link to="/mapa">Ver farmácias no mapa <ArrowRight :size="16"/></router-link></div>
      <FiltrosMedicamentos :categorias="categorias" :farmacias="s.farmacias" :farmacia-actual="s.farmaciaActual" :categoria="categoria" @mudar-farmacia="s.setFarmacia" @mudar-categoria="categoria=$event" />
      <p class="simple-count">{{s.farmacias.length?`${lista.length} medicamentos no catálogo`:'Registe uma farmácia para consultar disponibilidade.'}}</p>
      <div class="simple-products">
        <CartaoMedicamento v-for="m in lista" :key="m.id" :medicamento="m" :stock="getStock(m.id)" @adicionar="s.adicionar" />
      </div>
      <EstadoVazio v-if="!lista.length" mensagem="Não foram encontrados medicamentos para esta pesquisa." />
    </section>
  </div>
</template>
