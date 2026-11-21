<script setup>
import {MapPin} from 'lucide-vue-next';
defineProps({farmacia:{type:Object,required:true}});
const emit=defineEmits(['seleccionar']);
</script><template><article class="pharmacy-list-card"><h4>{{farmacia.nome}}</h4><p>{{farmacia.bairro}} · {{farmacia.endereco}}</p><button class="text-action" @click="emit('seleccionar',farmacia.id)"><MapPin :size="15"/> Escolher farmácia</button></article></template>
