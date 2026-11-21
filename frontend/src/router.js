import { createRouter, createWebHashHistory } from 'vue-router';
import { useApp } from './stores/app';
import Inicio from './views/Inicio.vue';
import Medicamento from './views/Medicamento.vue';
import NaoEncontrada from './views/NaoEncontrada.vue';
import Mapa from './views/Mapa.vue';
import Carrinho from './views/Carrinho.vue';
import Pedidos from './views/Pedidos.vue';
import Gestao from './views/Gestao.vue';
import Login from './views/Login.vue';
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Inicio },
    { path: '/mapa', component: Mapa },
    { path: '/medicamento/:id', component: Medicamento },
    { path: '/carrinho', component: Carrinho },
    { path: '/pedidos', component: Pedidos, meta: { auth: true } },
    { path: '/gestao', component: Gestao, meta: { auth: true, gestor: true } },
    { path: '/login', component: Login },
    { path: '/:pathMatch(.*)*', component: NaoEncontrada },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
router.beforeEach(to => {
  const s = useApp();
  if (to.meta.auth && !s.autenticado) return { path: '/login', query: { voltar: to.fullPath } };
  if (to.meta.gestor && !s.gestor) return '/';
});
export default router;
