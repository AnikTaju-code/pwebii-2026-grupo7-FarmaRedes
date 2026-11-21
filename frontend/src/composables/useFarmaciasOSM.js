import { ref } from 'vue';

// Dados geográficos públicos do OpenStreetMap, limitados à cidade de Maputo.
const CONSULTA = `[out:json][timeout:25];(node["amenity"="pharmacy"](-26.10,32.45,-25.80,32.75);way["amenity"="pharmacy"](-26.10,32.45,-25.80,32.75);relation["amenity"="pharmacy"](-26.10,32.45,-25.80,32.75););out center tags;`;

export function useFarmaciasOSM() {
  const locais = ref([]);
  const carregando = ref(false);
  const erro = ref('');

  async function carregar() {
    if (locais.value.length) return locais.value;
    carregando.value = true;
    erro.value = '';
    try {
      const resposta = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: CONSULTA })
      });
      if (!resposta.ok) throw new Error('O serviço de mapas não respondeu.');
      const dados = await resposta.json();
      locais.value = dados.elements.map((item) => {
        const lat = item.lat ?? item.center?.lat;
        const lng = item.lon ?? item.center?.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          id: `${item.type}-${item.id}`,
          nome: item.tags?.name || 'Farmácia sem nome identificado',
          lat,
          lng,
          endereco: [item.tags?.['addr:street'], item.tags?.['addr:suburb']].filter(Boolean).join(', '),
          origem: 'OpenStreetMap'
        };
      }).filter(Boolean);
      return locais.value;
    } catch (e) {
      erro.value = 'Não foi possível carregar as localizações públicas. Pode continuar a consultar as farmácias disponíveis no catálogo.';
      return [];
    } finally {
      carregando.value = false;
    }
  }

  return { locais, carregando, erro, carregar };
}
