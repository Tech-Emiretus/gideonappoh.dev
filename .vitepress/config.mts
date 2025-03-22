import { defineConfig } from 'vitepress';
import * as MarkdownItGitHubAlerts from 'markdown-it-github-alerts';
import { joinURL, withoutTrailingSlash } from 'ufo'
import { genOg } from './generateOg.mts';

const siteUrl = 'https://techemiretus.dev';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lang: 'en-US',
    title: "Tech Emiretus",
    description: "Personal website and blog for Gideon Appoh",

    srcDir: 'src',
    cleanUrls: true,

    head: [
        ['meta', { name: 'twitter:site', content: '@GideonAppoh' }],
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { property: 'og:image:width', content: '1200' }],
        ['meta', { property: 'og:image:height', content: '630' }],
        ['meta', { property: 'og:image:type', content: 'image/png' }],
        ['meta', { property: 'og:site_name', content: 'Tech Emiretus' }],
        ['meta', { property: 'og:type', content: 'website' }],
        ['link', { rel: 'icon', href: '/favicon/favicon.ico' }],
        ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap' }]
    ],

    sitemap: {
        hostname: siteUrl,
    },

    async transformPageData(pageData, { siteConfig }) {
        // Set layout for blog articles
        if (pageData.filePath.startsWith('blog/')) {
            pageData.frontmatter.layout = 'blog-post'
        }

        // Initialize the `head` frontmatter if it doesn't exist.
        pageData.frontmatter.head ??= []

        // Add basic meta tags to the frontmatter.
        pageData.frontmatter.head.push(
            [
                'meta',
                {
                    property: 'og:title',
                    content:
                        pageData.frontmatter.title || pageData.title || siteConfig.site.title,
                },
            ],
            [
                'meta',
                {
                    name: 'twitter:title',
                    content:
                        pageData.frontmatter.title || pageData.title || siteConfig.site.title,
                },
            ],
            [
                'meta',
                {
                    property: 'og:description',
                    content:
                        pageData.frontmatter.description || pageData.description || siteConfig.site.description,
                },
            ],
            [
                'meta',
                {
                    name: 'twitter:description',
                    content:
                        pageData.frontmatter.description || pageData.description || siteConfig.site.description,
                },
            ],
        );

        // Create the canonical URL
        pageData.frontmatter.head.push([
            'link',
            {
                rel: 'canonical',
                href: joinURL(
                    siteUrl,
                    withoutTrailingSlash(pageData.filePath.replace(/(index)?\.md$/, '')),
                ),
            },
        ]);

        pageData.frontmatter.head.push([
            'meta',
            {
                property: 'og:url',
                content: joinURL(
                    siteUrl,
                    withoutTrailingSlash(pageData.filePath.replace(/(index)?\.md$/, '')),
                ),
            },
        ]);

        // Integrate OG image URL into frontmatter
        const ogName = pageData.filePath
            .replaceAll(/\//g, '-')
            .replace(/\.md$/, '.png');

        await genOg(
            pageData.frontmatter.title || pageData.title || siteConfig.site.title,
            joinURL(siteConfig.srcDir, 'public', 'og', ogName),
        )

        pageData.frontmatter.head.push(
            [
                'meta',
                {
                    property: 'og:image',
                    content: joinURL(
                        siteUrl, // Please, change this before deploying
                        'og',
                        ogName,
                    ),
                },
            ],
            [
                'meta',
                {
                    name: 'twitter:image',
                    content: joinURL(
                        siteUrl, // Please, change this before deploying
                        'og',
                        ogName,
                    ),
                },
            ],
        );
    },

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Examples', link: '/markdown-examples' }
        ],

        sidebar: [
            {
                text: 'Examples',
                items: [
                    { text: 'Markdown Examples', link: '/markdown-examples' },
                    { text: 'Runtime API Examples', link: '/api-examples' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
        ]
    },

    markdown: {
        config(md) {
            md.use(MarkdownItGitHubAlerts.default)
        },

        gfmAlerts: true,

        theme: 'everforest-light',
    },
});
