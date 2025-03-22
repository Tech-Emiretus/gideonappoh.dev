import { Buffer } from 'node:buffer'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const ogSvg: string = readFileSync(
    join('.vitepress', 'og-template.svg'),
    'utf-8',
)

/**
 * @credit Estéban, https://soubiran.dev/
 * @link https://soubiran.dev/series/create-a-blog-with-vitepress-and-vue-js-from-scratch/creating-open-graph-images-automatically-for-each-blog-post
 */
export async function genOg(title: string, output: string) {
    // Skip if the file already exists
    if (existsSync(output))
        return

    // Ensure the output directory exists
    mkdirSync(dirname(output), { recursive: true })

    // Break the title into lines of 30 characters
    const lines = title
        .trim()
        .split(/(.{0,30})(?:\s|$)/g)
        .filter(Boolean)

    const data: Record<string, string> = {
        title1: lines[0],
        title2: lines[1],
        title3: lines[2],
    }
    const svg = ogSvg.replace(/\{\{([^}]+)\}\}/g, (_, name) => data[name] || '')

    console.info(`Generating ${output}`)
    try {
        await sharp(Buffer.from(svg)).resize(1440, 810).png().toFile(output)
    }
    catch (e) {
        console.error('Failed to generate og image', e)
    }
}
