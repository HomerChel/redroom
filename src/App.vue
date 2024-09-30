<template>
  <div id="app">
    <h1>Историческая карта и временная шкала</h1>
    <MapAndTimeline />
  </div>
</template>

<script>
import MapAndTimeline from './components/MapAndTimeline.vue';

export default {
  name: 'App',
  components: {
    MapAndTimeline
  }
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
}

h1 {
  margin: 20px 0;
  text-align: center;
}

.custom-video-marker {
  transition: width 0.2s ease-in-out, height 0.2s ease-in-out, margin-left 0.2s ease-in-out, margin-top 0.2s ease-in-out;
}

.custom-video-marker:hover {
  margin-left: -160px !important;
  margin-top: -120px !important;
  width: 320px !important;
  height: 240px !important;
  z-index: 1000 !important;
  /* Пропорционально меняем высоту */
}
</style>
