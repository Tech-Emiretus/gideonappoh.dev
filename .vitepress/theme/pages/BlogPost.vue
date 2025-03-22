<template>
    <article
        class="mx-4 space-y-16 p-8 md:p-12 text-left"
    >
        <h1 class="text-6xl font-semibold text-gray-900 dark:text-gray-100">
            {{ frontmatter.title }}
        </h1>

        <div class="relative">
            <Content class="prose dark:prose-invert text-gray-900 dark:text-gray-100" />
        </div>
    </article>

    <div class="mt-16 pl--10 flex flex-wrap justify-center gap-4">
        <SolidButton href="/blog">Back to Blog</SolidButton>
        <PlainButton href="/">Home</PlainButton>
    </div>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import SolidButton from "../components/SolidButton.vue";
import PlainButton from "../components/PlainButton.vue";

const { frontmatter } = useData();
</script>
