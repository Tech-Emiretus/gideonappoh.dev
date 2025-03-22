<template>
    <div
        class="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12 transition-colors duration-300"
    >
        <TopNav />

        <main class="w-full max-w-4xl space-y-8 text-center" :class="isBlogPost ? 'md:max-w-6xl blog-post' : ''">
            <Home v-if="frontmatter.layout === 'home'" />
            <BlogIndex v-if="frontmatter.layout === 'blog'" />
            <BlogPost v-else-if="isBlogPost" />
            <NotFound v-else-if="page.title === '404'" />
            <Content v-else />
        </main>
    </div>
</template>

<script lang="ts" setup>
import BlogIndex from "./pages/BlogIndex.vue";
import BlogPost from "./pages/BlogPost.vue";
import Home from "./pages/Home.vue";
import TopNav from "./components/TopNav.vue";
import { useData } from "vitepress";
import { computed } from "vue";
import NotFound from "./pages/NotFound.vue";

const { frontmatter, page } = useData();
const isBlogPost = computed(() => frontmatter.value.layout === 'blog-post');
</script>
