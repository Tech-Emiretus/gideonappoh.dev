<template>
    <h1 class="gradient-text mb-10 text-3xl font-bold md:text-5xl md:leading-50">
        404 | Page Not Found
    </h1>

    <div class="mt-16 pl--10 flex flex-wrap justify-center gap-4">
        <SolidButton href="/blog">Back to Blog</SolidButton>
        <PlainButton href="/">Home</PlainButton>
    </div>
</template>

<script lang="ts" setup>
import SolidButton from "../components/SolidButton.vue";
import PlainButton from "../components/PlainButton.vue";
</script>
