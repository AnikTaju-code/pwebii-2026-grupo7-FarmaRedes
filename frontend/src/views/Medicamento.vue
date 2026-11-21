<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useApp } from '../stores/app';
const route = useRoute(),
  s = useApp();
const med = computed(() => s.medicamentos.find(m => m.id === route.params.id));
const disponiveis = computed(() =>
  s.stock.filter(x => x.medicamentoId === route.params.id && x.quantidade > 0),
);
function seleccionar(id) {
  s.setFarmacia(id);
  s.adicionar(route.params.id);
}
</script>
<template>
  <div class="container page">
    <template v-if="med"
      ><h1>{{ med.nome }}</h1>
      <p>{{ med.dosagem }} · {{ med.categoria }}</p>
      <h2>Disponibilidade nas farmácias</h2>
      <div class="panel" v-if="!disponiveis.length">
        Nenhuma farmácia tem este medicamento disponível.
      </div>
      <div
        class="panel"
        v-for="linha in disponiveis"
        :key="linha.farmaciaId"
        style="margin-bottom: 12px"
      >
        <b>{{ s.farmacias.find(f => f.id === linha.farmaciaId)?.nome }}</b>
        <p>{{ linha.preco }} MT · {{ linha.quantidade }} unidades</p>
        <button class="button primary" @click="seleccionar(linha.farmaciaId)">
          Adicionar ao carrinho
        </button>
      </div></template
    >
    <div v-else class="panel">
      <h1>Medicamento não encontrado</h1>
      <router-link to="/">Voltar ao catálogo</router-link>
    </div>
  </div>
</template>
