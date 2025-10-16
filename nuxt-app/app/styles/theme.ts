// Constantes de tema do Incipit
// Centralize cores e estilos reutilizáveis aqui

export const colors = {
  base: '#C7B198',
  fundo: '#ede5d8',
  branco: '#E4E4E4',
  card: '#DFD3C3',
  texto: '#4E3939',
  roxo: '#A68DAD',
} as const;

export const shortcuts = {
  // Containers e Cards
  'page-container': 'min-h-screen bg-incipit-fundo relative',
  'auth-card': 'bg-incipit-card text-texto rounded-[30px] shadow-xl p-8 w-full max-w-md',
  
  // Inputs
  'input-field': 'w-full px-4 py-3 rounded-lg bg-incipit-base text-texto placeholder-texto/60 border-none outline-none focus:ring-2 focus:ring-roxo/50',
  
  // Botões
  'btn-primary': 'bg-roxo text-branco py-3 px-8 rounded-full border-0 hover:brightness-90 transition cursor-pointer font-medium',
  'btn-link': 'text-roxo hover:underline cursor-pointer',
  
  // Texto
  'title-lg': 'text-3xl font-bold text-texto mb-6 text-center',
  'label-text': 'text-texto text-sm mb-2 block',
} as const;
