import { defineStore } from 'pinia';
import api from '../services/api';
import { reconcileCart } from './cart.js';

function actualizarCarrinho(store) {
  const result = reconcileCart(store.carrinho, store.stock, store.farmaciaActual);
  store.carrinho = result.items;
  if (result.changed) store.notificar('O stock mudou. O carrinho foi actualizado.');
}

export const useApp = defineStore('app', {
  state: () => ({
    utilizador: JSON.parse(localStorage.getItem('fr_user') || 'null'),
    farmacias: [],
    medicamentos: [],
    stock: [],
    carrinho: [],
    farmaciaActual: localStorage.getItem('fr_farmacia') || '',
    aviso: '',
    evento: null,
  }),
  getters: {
    autenticado: state => !!state.utilizador,
    gestor: state => state.utilizador?.perfil === 'gestor',
    itensCarrinho: state =>
      state.carrinho.map(item => ({
        ...item,
        med: state.medicamentos.find(med => med.id === item.medicamentoId),
        linha: state.stock.find(
          row =>
            row.medicamentoId === item.medicamentoId && row.farmaciaId === state.farmaciaActual,
        ),
      })),
    subtotal() {
      return this.itensCarrinho.reduce(
        (total, item) => total + (item.linha?.preco || 0) * item.quantidade,
        0,
      );
    },
    quantidadeCarrinho: state => state.carrinho.reduce((total, item) => total + item.quantidade, 0),
  },
  actions: {
    async carregar() {
      const [farmacias, medicamentos, stock] = await Promise.all([
        api.get('/farmacias'),
        api.get('/catalogo'),
        api.get('/stock'),
      ]);
      this.farmacias = farmacias.data;
      this.medicamentos = medicamentos.data;
      this.stock = stock.data;

      if (!this.farmacias.some(farmacia => farmacia.id === this.farmaciaActual)) {
        this.farmaciaActual = this.farmacias[0]?.id || '';
        localStorage.setItem('fr_farmacia', this.farmaciaActual);
      }

      actualizarCarrinho(this);
    },
    async refrescarStock() {
      this.stock = (await api.get('/stock')).data;
      actualizarCarrinho(this);
    },
    setFarmacia(id) {
      if (this.farmaciaActual !== id) {
        this.farmaciaActual = id;
        this.carrinho = [];
        localStorage.setItem('fr_farmacia', id);
      }
    },
    adicionar(medicamentoId) {
      const linha = this.stock.find(
        row => row.farmaciaId === this.farmaciaActual && row.medicamentoId === medicamentoId,
      );
      if (!linha || !linha.quantidade) return this.notificar('Sem stock disponível.');
      const item = this.carrinho.find(row => row.medicamentoId === medicamentoId);
      const quantidade = item?.quantidade || 0;
      if (quantidade >= linha.quantidade)
        return this.notificar('Quantidade máxima em stock atingida.');
      if (item) item.quantidade++;
      else this.carrinho.push({ medicamentoId, quantidade: 1 });
      this.notificar('Adicionado ao carrinho.');
    },
    alterarQtd(id, quantidade) {
      const item = this.carrinho.find(row => row.medicamentoId === id);
      if (!item) return;
      const max =
        this.stock.find(row => row.farmaciaId === this.farmaciaActual && row.medicamentoId === id)
          ?.quantidade || 0;
      if (quantidade <= 0 || max <= 0) {
        this.carrinho = this.carrinho.filter(row => row.medicamentoId !== id);
      } else {
        item.quantidade = Math.min(quantidade, max);
      }
    },
    notificar(msg) {
      this.aviso = msg;
    },
    guardarSessao(data) {
      this.utilizador = data.utilizador;
      if (data.utilizador.farmaciaId) this.farmaciaActual = data.utilizador.farmaciaId;
      localStorage.setItem('fr_token', data.token);
      localStorage.setItem('fr_user', JSON.stringify(data.utilizador));
    },
    sair() {
      this.utilizador = null;
      localStorage.removeItem('fr_token');
      localStorage.removeItem('fr_user');
    },
    escutar() {
      if (this.evento) return;
      const es = new EventSource(`${import.meta.env.VITE_API_URL || ''}/api/eventos`);
      es.addEventListener('actualizacao', async () => {
        try {
          await this.carregar();
          window.dispatchEvent(new CustomEvent('fr:refresh'));
        } catch {
          this.notificar(
            error instanceof Error ? error.message : 'Não foi possível actualizar os dados.',
          );
        }
      });
      this.evento = es;
    },
  },
});
