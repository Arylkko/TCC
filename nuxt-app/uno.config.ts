// uno.config.ts

import { defineConfig, presetAttributify, presetIcons } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'

export default defineConfig({
    presets: [
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
        },
    },

    // Shortcuts são atalhos para um grupo de classes
    shortcuts: [
        ['destaque', 'bg-incipit-card text-texto text-center rounded-[30px] shadow-lg p-y-2 p-x-8'],
        ['card', 'bg-incipit-card text-texto rounded-[30px] shadow-xl flex flex-col items-center justify-between text-center p-6'],
        ['botao', 'bg-roxo text-texto py-1 px-3 rounded-full border-0 hover:brightness-90 transition']
    ]
})