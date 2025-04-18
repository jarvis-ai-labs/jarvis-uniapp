<template>
  <scroll-view scroll-y="true" class="scroll-app">
    <custom-header />

    <scroll-view scroll-y="true" class="scroll-tasks"> </scroll-view>

    <custom-tabbar />
  </scroll-view>
</template>

<script setup>
import CustomTabbar from '@/components/custom-tabbar.vue';
import CustomHeader from '@/components/custom-header.vue';
</script>
