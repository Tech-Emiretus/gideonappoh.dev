<template>
    <section
        class="group relative border-2 border-black dark:border-white bg-white dark:bg-gray-800 p-8 shadow-[6px_6px_0_black] dark:shadow-[6px_6px_0_white] transition duration-300 hover:shadow-lg dark:hover:shadow-white/10"
    >
        <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div class="w-48 h-48 flex-shrink-0">
                <img
                    src="/profile-image.png"
                    alt="Gideon Appoh"
                    class="w-full h-full object-cover rounded-lg border-2 border-black dark:border-white"
                />
            </div>

            <div class="flex-1 space-y-4">
                <h2 class="md:text-3xl text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Hi 👋🏼, I am Gideon Appoh
                </h2>
                <p class="md:text-lg text-gray-700 dark:text-gray-300">
                    I am a software engineer with over a decade of experience, I am passionate about building and I love to share my knowledge and experiences with others. Follow me on my journey as I share my thoughts and experiences on various topics.
                </p>

                <SocialLinks />
            </div>
        </div>
    </section>
</template>

<script lang='ts'   setup>
import SocialLinks from './SocialLinks.vue'
</script>
