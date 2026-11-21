<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { useApp } from '../stores/app';
import api from '../services/api';
import {
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  CreditCard,
} from 'lucide-vue-next';
const s = useApp(),
  pedidos = ref([]),
  busy = ref(''),
  error = ref('');
const labels = {
  aguarda_pagamento: 'Aguarda pagamento',
  confirmado: 'Confirmado',
  em_preparacao: 'Em preparação',
  em_entrega: 'Em entrega',
  pronto_recolha: 'Pronto para recolha',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
const nomeMed = id => s.medicamentos.find(m => m.id === id)?.nome || id;
const nomeFarm = id => s.farmacias.find(f => f.id === id)?.nome || id;
async function carregar() {
  try {
    pedidos.value = (await api.get('/pedidos')).data;
  } catch (e) {
    error.value = e.message;
  }
}
async function confirmarPagamentoTeste(p, aprovar) {
  busy.value = p.id;
  error.value = '';
  try {
    await api.post(`/pedidos/${p.id}/simular-pagamento`, { aprovar });
    await carregar();
    await s.refrescarStock();
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = '';
  }
}
const refresh = () => carregar();
onMounted(() => {
  carregar();
  window.addEventListener('fr:refresh', refresh);
});
onBeforeUnmount(() => window.removeEventListener('fr:refresh', refresh));
</script>
<template>
  <div class="container page">
    <div class="page-heading">
      <div>
        <div class="section-overline">ACOMPANHAMENTO</div>
        <h1>As minhas encomendas</h1>
        <p>Consulte o estado das suas compras e acompanhe as entregas.</p>
      </div>
    </div>
    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="!pedidos.length" class="empty-state tall">
      <PackageCheck :size="45" />
      <h3>Sem encomendas por enquanto</h3>
      <router-link to="/" class="button primary">Fazer primeira encomenda</router-link>
    </div>
    <div class="orders-list">
      <div class="order-card" v-for="p in pedidos" :key="p.id">
        <div class="order-head">
          <div>
            <small>ENCOMENDA #{{ p.id.slice(0, 8).toUpperCase() }}</small>
            <h3>{{ nomeFarm(p.farmaciaId) }}</h3>
            <p>
              {{ new Date(p.criadoEm).toLocaleString('pt-PT') }} ·
              {{ p.tipoEntrega === 'entrega' ? 'Entrega ao domicílio' : 'Recolha na farmácia' }}
            </p>
          </div>
          <span :class="['status-badge', p.estado]">{{ labels[p.estado] || p.estado }}</span>
        </div>
        <div class="order-products">
          <span v-for="i in p.itens" :key="i.medicamentoId"
            >{{ i.quantidade }}× {{ nomeMed(i.medicamentoId) }}</span
          >
        </div>
        <div class="order-bottom">
          <div>
            <small>Total da encomenda</small><strong>{{ p.total.toFixed(2) }} MT</strong
            ><small v-if="p.notificacao?.estado === 'enviado_ao_provedor'"
              >SMS enviado para processamento</small
            ><small
              >Pagamento:
              {{
                p.pagamento.metodo === 'mpesa'
                  ? 'M-Pesa'
                  : p.pagamento.metodo === 'emola'
                    ? 'e-Mola'
                    : 'Presencial'
              }}</small
            >
          </div>
          <div v-if="p.estado === 'aguarda_pagamento'" class="order-actions">
            <button
              class="button primary button-small"
              :disabled="busy === p.id"
              @click="confirmarPagamentoTeste(p, true)"
            >
              <CheckCircle2 :size="16" /> Confirmar pagamento</button
            ><button
              class="button outline-button button-small"
              :disabled="busy === p.id"
              @click="confirmarPagamentoTeste(p, false)"
            >
              <XCircle :size="16" /> Não foi possível pagar
            </button>
          </div>
        </div>
        <div v-if="p.estado === 'confirmado'" class="order-info">
          <PackageCheck :size="17" /> Encomenda confirmada. A farmácia pode iniciar a preparação.
        </div>
        <div v-if="p.estado === 'em_entrega'" class="order-info">
          <Truck :size="17" /> A encomenda encontra-se em distribuição.
        </div>
      </div>
    </div>
  </div>
</template>
