<template>
    <article
        class="md:mt-2 mt-10 md:mx-4 space-y-16 pt-10 sm:p-8 md:p-12 text-left"
    >
        <h1 class="md:text-6xl text-4xl font-semibold text-gray-900 dark:text-gray-100">
            {{ frontmatter.title }}
        </h1>

        <div class="relative">
            <Content class="prose dark:prose-invert text-gray-900 dark:text-gray-100" />
        </div>
    </article>

    <AboutMe />

    <div class="mt-16 pl--10 flex flex-wrap justify-center gap-4">
        <SolidButton href="/blog">Back to Blog</SolidButton>
        <PlainButton href="/">Home</PlainButton>
    </div>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import SolidButton from "../components/SolidButton.vue";
import PlainButton from "../components/PlainButton.vue";
import AboutMe from "../components/AboutMe.vue";

const { frontmatter } = useData();
</script>
