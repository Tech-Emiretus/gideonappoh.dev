<template>
    <section class="space-y-16  p-8 md:p-12">
        <h1 class="text-6xl font-semibold text-gray-900 dark:text-gray-100">
            {{ frontmatter.title }}
        </h1>

        <div class="space-y-10">
            <BlogCard v-for="post in data" :key="post.url" :post="post" />
        </div>

        <div class="flex justify-center">
            <SolidButton href="/">Back to Home</SolidButton>
        </div>
    </section>
</template>

<script lang="ts" setup>
import { useData } from "vitepress";
import { data } from "../../data/blog.data";
import BlogCard from "../components/BlogCard.vue";
import SolidButton from "../components/SolidButton.vue";

const { frontmatter } = useData();
</script>
