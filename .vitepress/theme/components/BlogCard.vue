<template>
    <article
        class="group relative space-y-6 border-2 border-black dark:border-white bg-white dark:bg-gray-800 p-8 shadow-[6px_6px_0_black] dark:shadow-[6px_6px_0_white] transition duration-300 hover:shadow-lg dark:hover:shadow-white/10"
    >
        <h2 class="text-3xl font-medium text-gray-900 dark:text-gray-100">
            <a :href="post.url" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                {{ post.frontmatter.title }}
                <span class="absolute inset-0" />
            </a>
        </h2>

        <p class="text-lg text-gray-700 dark:text-gray-300">
            {{ post.frontmatter.description }}
        </p>
    </article>
</template>

<script lang="ts" setup>
import { ContentData } from "vitepress";

defineProps<{
    post: ContentData;
}>();
</script>
