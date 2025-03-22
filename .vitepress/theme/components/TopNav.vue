<template>
    <div class="absolute md:fixed top-6 right-6 flex items-center justify-center space-x-4">
        <SocialLinks class="mr-6" />
        <ToggleDarkMode />
    </div>
</template>

<script lang="ts" setup>
import SocialLinks from './SocialLinks.vue'
import ToggleDarkMode from './ToggleDarkMode.vue'

defineProps({
    showSocialLinks: {
        type: Boolean,
        default: true
    },
    showDarkModeToggle: {
        type: Boolean,
        default: true
    }
});
</script>
