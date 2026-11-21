<script setup>
import {ref,onMounted,onBeforeUnmount} from 'vue';import L from 'leaflet';
const props=defineProps({lat:Number,lng:Number});const emit=defineEmits(['escolher']);const el=ref(null);let map,marker;
onMounted(()=>{map=L.map(el.value).setView([props.lat??-25.965,props.lng??32.583],props.lat===null?12:15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
if(props.lat!=null&&props.lng!=null)marker=L.marker([props.lat,props.lng]).addTo(map);
map.on('click',e=>{const {lat,lng}=e.latlng;if(marker)marker.setLatLng([lat,lng]);else marker=L.marker([lat,lng]).addTo(map);emit('escolher',{lat,lng});});setTimeout(()=>map.invalidateSize(),100);});onBeforeUnmount(()=>map?.remove());
</script><template><div ref="el" style="height:280px;width:100%;border-radius:10px;border:1px solid #cbd5e1;margin:12px 0"></div></template>
