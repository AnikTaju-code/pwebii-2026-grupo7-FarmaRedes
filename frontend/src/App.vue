<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useApp } from './stores/app';
import {
  Search,
  MapPin,
  ShoppingBag,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Cross,
  Menu,
  X,
  Truck,
} from 'lucide-vue-next';
const s = useApp(),
  route = useRoute(),
  mobile = ref(false),
  erro = ref('');
let avisoTimer;
onMounted(async () => {
  try {
    await s.carregar();
    s.escutar();
  } catch (e) {
    erro.value = 'Não foi possível ligar à API. Inicie o backend na porta 3001.';
  }
});
watch(
  () => route.path,
  () => (mobile.value = false),
);
watch(
  () => s.aviso,
  msg => {
    clearTimeout(avisoTimer);
    if (msg)
      avisoTimer = setTimeout(() => {
        if (s.aviso === msg) s.aviso = '';
      }, 5000);
  },
);
onBeforeUnmount(() => clearTimeout(avisoTimer));
</script>
<template>
  <div class="shell">
    <header class="navbar">
      <router-link to="/" class="brand"
        ><span class="brandicon"><Cross :size="23" stroke-width="3" /></span
        ><span
          >Farma<span class="brandaccent">Rede</span><small>farmácia online</small></span
        ></router-link
      >
      <nav :class="['navlinks', mobile ? 'open' : '']">
        <router-link to="/"><Search :size="17" /> Medicamentos</router-link
        ><router-link to="/mapa"><MapPin :size="17" /> Farmácias no mapa</router-link
        ><router-link to="/pedidos" v-if="s.autenticado"
          ><ClipboardList :size="17" /> Encomendas</router-link
        ><router-link to="/gestao" v-if="s.gestor"
          ><LayoutDashboard :size="17" /> Gestão</router-link
        >
      </nav>
      <div class="header-actions">
        <router-link class="cart-pill" to="/carrinho"
          ><ShoppingBag :size="18" /> <span>Carrinho</span
          ><b>{{ s.quantidadeCarrinho }}</b></router-link
        ><router-link
          class="button button-small ghost desktop-auth"
          to="/login"
          v-if="!s.autenticado"
          ><LogIn :size="17" /> Entrar</router-link
        ><button
          v-else
          class="button button-small ghost desktop-auth"
          @click="
            s.sair();
            $router.push('/');
          "
        >
          <LogOut :size="17" /> Sair</button
        ><button class="menu-button" @click="mobile = !mobile">
          <X v-if="mobile" /><Menu v-else />
        </button>
      </div>
    </header>
    <main>
      <div v-if="erro" class="container alert error">{{ erro }}</div>
      <router-view />
    </main>
    <footer class="footer">
      <div class="container footerin">
        <div>
          <div class="brand footerbrand">
            <span class="brandicon"><Cross :size="19" /></span> FarmaRede
          </div>
          <p>Cuidamos da sua saúde, onde quer que esteja.</p>
        </div>
        <div class="foot-right">
          <span><Truck :size="16" /> Entregas em Maputo</span><small>FarmaRede · 2026</small>
        </div>
      </div>
    </footer>
    <div v-if="s.aviso" class="toast" @click="s.aviso = ''">{{ s.aviso }} <X :size="14" /></div>
  </div>
</template>
