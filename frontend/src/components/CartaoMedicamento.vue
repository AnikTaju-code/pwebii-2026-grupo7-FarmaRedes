<script setup>
import { Pill, ShoppingCart } from 'lucide-vue-next';
defineProps({
  medicamento: { type: Object, required: true },
  stock: { type: Object, default: null },
});
const emit = defineEmits(['adicionar']);
</script>
<template>
  <article class="simple-product">
    <div class="simple-product-mark"><Pill :size="25" :stroke-width="1.7" /></div>
    <div class="simple-product-info">
      <h3>{{ medicamento.nome }}</h3>
      <p>{{ medicamento.dosagem }}</p>
      <small>{{ medicamento.categoria }}</small>
    </div>
    <div class="simple-product-bottom">
      <strong>{{ stock ? stock.preco + ' MT' : 'Preço indisponível' }}</strong><span
        :class="stock?.quantidade ? 'in-stock' : 'out-stock'"
        >{{ stock?.quantidade ? 'Disponível' : 'Esgotado' }}</span
      >
    </div>
    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
      <button
        class="button primary simple-add"
        :disabled="!stock?.quantidade"
        @click="emit('adicionar', medicamento.id)"
      >
        <ShoppingCart :size="16" /> Adicionar</button
      ><router-link :to="`/medicamento/${medicamento.id}`" class="text-action"
        >Detalhes</router-link
      >
    </div>
  </article>
</template>
