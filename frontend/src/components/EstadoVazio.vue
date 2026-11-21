<script setup>
defineProps({ mensagem: { type: String, required: true } });
</script>
<template>
  <div class="simple-empty">{{ mensagem }}</div>
</template>
