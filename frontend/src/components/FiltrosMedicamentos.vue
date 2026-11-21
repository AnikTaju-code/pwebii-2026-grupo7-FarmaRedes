<script setup>
defineProps({categorias:{type:Array,required:true},farmacias:{type:Array,required:true},farmaciaActual:{type:String,default:''},categoria:{type:String,default:'Todas'}});
const emit=defineEmits(['mudar-farmacia','mudar-categoria']);
</script>
<template><div class="simple-filters"><label>Farmácia<select :value="farmaciaActual" @change="emit('mudar-farmacia',$event.target.value)"><option v-for="f in farmacias" :key="f.id" :value="f.id">{{f.nome}}</option></select></label><label>Categoria<select :value="categoria" @change="emit('mudar-categoria',$event.target.value)"><option v-for="c in categorias" :key="c">{{c}}</option></select></label></div></template>
