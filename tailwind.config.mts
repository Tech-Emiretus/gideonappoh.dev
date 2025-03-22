export default {
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        '--tw-prose-pre-bg': '#0f0f1f',
                        '--tw-prose-invert-pre-bg': '#0f0f1f',

                        code: {
                            'padding': '0 0.25rem',
                            'borderRadius': '0',
                            '&::before': {
                                content: '""!important',
                            },
                            '&::after': {
                                content: '""!important',
                            },
                        },
                        pre: {
                            'border-radius': '0',
                            'border': '1px solid black',
                            'margin': '0',
                        },
                        'ul > li': {
                            '--tw-prose-bullets': 'var(--color-gray-500)',
                        },
                        'hr': {
                            'border-top': '2px solid var(--color-gray-500)',
                        },
                    },
                },

            },
        },
    },
};
