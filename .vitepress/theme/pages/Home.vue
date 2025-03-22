<template>
    <h1 class="gradient-text mb-10 text-5xl font-bold md:text-7xl">
        Hello, I'm Gideon Appoh
    </h1>

    <div class="space-y-10">
        <p
            class="mb-6 text-xl leading-relaxed text-gray-700 md:text-2xl dark:text-gray-300"
        >
            Seasoned Software Architect with over a decade of crafting robust,
            scalable systems - transforming complex requirements into elegant,
            efficient solutions.
        </p>
        <p
            class="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl dark:text-gray-400"
        >
            Full-stack expert specializing in system architecture and modern
            tech stacks including PHP, Javascript, Laravel, Vue.js, TypeScript,
            and Go.
        </p>
    </div>

    <div class="mt-10 flex flex-wrap justify-center gap-4">
        <SolidButton href="/blog">View My Blog</SolidButton>
        <PlainButton href="mailto:gideonappoh@gmail.com"
            >Contact Me</PlainButton
        >
    </div>
</template>

<script lang="ts" setup>
import SolidButton from "../components/SolidButton.vue";
import PlainButton from "../components/PlainButton.vue";
</script>
