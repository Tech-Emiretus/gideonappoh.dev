import { Theme } from 'vitepress'
import Layout from './Layout.vue'

import './styles/app.css';
import 'markdown-it-github-alerts/styles/github-colors-light.css'
import 'markdown-it-github-alerts/styles/github-colors-dark-media.css'
import 'markdown-it-github-alerts/styles/github-base.css'

export default {
    Layout,
} satisfies Theme
