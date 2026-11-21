<script setup>
import { computed, ref } from 'vue';
import { useApp } from '../stores/app';
import { useRouter } from 'vue-router';
import api from '../services/api';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Truck,
  Store,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Pill,
} from 'lucide-vue-next';
const s = useApp(),
  router = useRouter(),
  tipo = ref('entrega'),
  metodo = ref('mpesa'),
  telefone = ref(''),
  morada = ref(''),
  telefoneContacto = ref(''),
  receberSMS = ref(false),
  busy = ref(false),
  error = ref('');
const taxa = computed(() => (tipo.value === 'recolha' || s.subtotal >= 1500 ? 0 : 120));
const total = computed(() => s.subtotal + taxa.value);
const farmacia = computed(() => s.farmacias.find(f => f.id === s.farmaciaActual));
async function finalizar() {
  if (!s.autenticado) return router.push({ path: '/login', query: { voltar: '/carrinho' } });
  if (!s.carrinho.length) return;
  busy.value = true;
  error.value = '';
  try {
    const r = await api.post('/pedidos', {
      farmaciaId: s.farmaciaActual,
      itens: s.carrinho.map(x => ({ medicamentoId: x.medicamentoId, quantidade: x.quantidade })),
      tipoEntrega: tipo.value,
      morada: morada.value,
      metodoPagamento: metodo.value,
      telefone: telefone.value,
      telefoneContacto: telefoneContacto.value,
      receberSMS: receberSMS.value,
    });
    s.carrinho = [];
    await s.refrescarStock();
    router.push({ path: '/pedidos', query: { novo: r.data.id } });
  } catch (e) {
    error.value = e.message;
    await s.refrescarStock();
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="container page">
    <div class="page-heading">
      <div>
        <div class="section-overline">A SUA ENCOMENDA</div>
        <h1>O seu carrinho</h1>
        <p>Revise os produtos e escolha como receber.</p>
      </div>
    </div>
    <div v-if="!s.carrinho.length" class="empty-cart">
      <ShoppingBag :size="55" />
      <h2>O carrinho está vazio</h2>
      <p>Adicione medicamentos para começar.</p>
      <router-link class="button primary" to="/"
        >Explorar medicamentos <ArrowRight :size="17"
      /></router-link>
    </div>
    <div v-else class="checkout-grid">
      <div>
        <div class="panel">
          <div class="panel-title">
            <h3>Produtos seleccionados</h3>
            <span>{{ s.quantidadeCarrinho }} unidades</span>
          </div>
          <div v-for="i in s.itensCarrinho" :key="i.medicamentoId" class="cart-row">
            <div class="cart-emoji"><Pill :size="22" /></div>
            <div class="cart-product">
              <b>{{ i.med?.nome }}</b><small>{{ i.med?.dosagem }}</small
              ><strong>{{ i.linha?.preco }} MT</strong>
            </div>
            <div class="qty">
              <button @click="s.alterarQtd(i.medicamentoId, i.quantidade - 1)">
                <Minus :size="14" /></button
              >{{ i.quantidade
              }}<button @click="s.alterarQtd(i.medicamentoId, i.quantidade + 1)">
                <Plus :size="14" />
              </button>
            </div>
            <button class="delete" @click="s.alterarQtd(i.medicamentoId, 0)">
              <Trash2 :size="18" />
            </button>
          </div>
          <div class="pharmacy-note">
            <Store :size="17" /> Farmácia seleccionada: <b>{{ farmacia?.nome }}</b>
          </div>
        </div>
        <div class="panel">
          <h3>Como pretende receber?</h3>
          <div class="choice-grid">
            <label :class="['choice', tipo === 'entrega' ? 'chosen' : '']"
              ><input type="radio" value="entrega" v-model="tipo" /><Truck :size="24" /><b
                >Entrega ao domicílio</b
              ><small>120 MT · grátis acima de 1.500 MT</small></label
            ><label :class="['choice', tipo === 'recolha' ? 'chosen' : '']"
              ><input type="radio" value="recolha" v-model="tipo" /><Store :size="24" /><b
                >Recolher na farmácia</b
              ><small>Sem custo de entrega</small></label
            >
          </div>
          <label class="field" v-if="tipo === 'entrega'"
            >Morada de entrega<input
              v-model="morada"
              placeholder="Rua, bairro, ponto de referência"
          /></label>
        </div>
        <div class="panel">
          <h3>Forma de pagamento</h3>
          <div class="payment-choices">
            <label :class="['payment-choice', metodo === 'mpesa' ? 'chosen' : '']"
              ><input type="radio" value="mpesa" v-model="metodo" /><span class="pay-logo mpesa"
                >M</span
              ><span><b>M-Pesa</b><small>Vodacom</small></span></label
            ><label :class="['payment-choice', metodo === 'emola' ? 'chosen' : '']"
              ><input type="radio" value="emola" v-model="metodo" /><span class="pay-logo emola"
                >e</span
              ><span><b>e-Mola</b><small>Movitel</small></span></label
            ><label :class="['payment-choice', metodo === 'entrega' ? 'chosen' : '']"
              ><input type="radio" value="entrega" v-model="metodo" /><span class="pay-logo cash"
                ><Wallet :size="22" /></span
              ><span
                ><b>Pagar na entrega/recolha</b><small>Pagamento ao receber</small></span
              ></label
            >
          </div>
          <label class="field" v-if="metodo !== 'entrega'"
            >Número de telemóvel<input
              v-model="telefone"
              inputmode="tel"
              placeholder="84xxxxxxx ou 86xxxxxxx"
          /></label>
          <p class="payment-disclaimer">
            Pagamento electrónico sujeito a confirmação da operadora.
          </p>
        </div>
        <div class="panel">
          <h3>Notificações</h3>
          <label class="field"
            >Telefone de contacto (opcional)<input
              v-model="telefoneContacto"
              inputmode="tel"
              placeholder="84xxxxxxx" /></label
          ><label class="sms-option"
            ><input type="checkbox" v-model="receberSMS" /> Quero receber a confirmação da encomenda
            por SMS</label
          ><small>O envio depende da disponibilidade do serviço SMS.</small>
        </div>
      </div>
      <aside>
        <div class="panel summary-panel">
          <h3>Resumo da compra</h3>
          <div class="summary-line">
            <span>Subtotal</span><b>{{ s.subtotal.toFixed(2) }} MT</b>
          </div>
          <div class="summary-line">
            <span>Entrega</span><b>{{ taxa ? taxa.toFixed(2) + ' MT' : 'Grátis' }}</b>
          </div>
          <div class="summary-total">
            <span>Total</span><strong>{{ total.toFixed(2) }} MT</strong>
          </div>
          <p v-if="error" class="alert error">{{ error }}</p>
          <button :disabled="busy" class="button primary full" @click="finalizar">
            {{ busy ? 'A processar...' : 'Confirmar encomenda' }} <ArrowRight :size="18" /></button
          ><small class="summary-foot"
            >Ao confirmar, reservamos os produtos da sua encomenda.</small
          >
        </div>
      </aside>
    </div>
  </div>
</template>
