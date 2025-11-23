// uno.config.ts

import { defineConfig, presetAttributify, presetIcons } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'
import { presetUno, presetWebFonts } from 'unocss' // isso é pra fonte!

export default defineConfig({
    presets: [
        presetUno(),
        presetWebFonts({
            provider: 'google',
            fonts: {
                sono: 'Sono',
                display: [
                    {
                        name: 'Baloo 2',
                        weights: ['800'],
                    }
                ]
            }
        }),
        presetWind3(),
        presetAttributify(),
        // Permite o uso de ícones como classes (exige instalação adicional)
        presetIcons({
            scale: 1.2,
            warn: true,
        }),
    ],

    // Regras e shortcuts customizados
    rules: [
        // Exemplo de regra customizada: 'c-red' para color: red
        ['c-red', { color: 'red' }],
    ],

    theme: {
        colors: {
            'incipit-base': '#C7B198',
            'incipit-fundo': '#ede5d8',
            'branco': '#E4E4E4',
            'incipit-card': '#DFD3C3',
            'texto': '#4E3939',
            'roxo': '#A68DAD',
            'vermelho': '#ad8d8dff',
        },
    },    // Shortcuts são atalhos para um grupo de classes
    shortcuts: [
        // Cards e containers
        ['destaque', 'bg-incipit-card text-texto text-center rounded-[30px] shadow-lg p-y-2 p-x-8'],
        ['card', 'bg-incipit-card text-texto rounded-[30px] shadow-xl flex flex-col items-center justify-between text-center p-6'],
        ['auth-card', 'bg-incipit-card text-texto rounded-[30px] shadow-xl p-8 w-full max-w-md'],

        // Botões
        ['botao', 'bg-roxo text-branco py-2 px-6 rounded-full border-0 hover:brightness-90 transition cursor-pointer font-medium font-sono'],
        ['btn-primary', 'bg-roxo text-branco py-3 px-8 rounded-full border-0 hover:brightness-90 transition cursor-pointer font-medium w-full font-sono'],
        ['btn-link', 'text-roxo hover:underline cursor-pointer'],

        // Inputs
        ['input-field', 'w-full px-4 py-3 rounded-lg bg-incipit-base text-texto placeholder-texto/60 border-none outline-none focus:ring-2 focus:ring-roxo/50'],

        // Texto
        ['title-lg', 'text-3xl font-bold text-texto mb-6 text-center'],
        ['label-text', 'text-texto text-sm mb-2 block'],
    ]
})