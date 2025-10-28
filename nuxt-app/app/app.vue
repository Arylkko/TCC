<template>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
</template>

<style>
:root {
  /* Cores principais */
  --incipit-background: #0D1117;
  --incipit-dark: #0D1117;
  --incipit-card: #161B22;
  --incipit-base: #1C2128;
  --incipit-primary: #DC892F;
  --incipit-texto: #E6EDF3;
  --incipit-branco: #FFFFFF;
  
  /* Cores do tema antigo (compatibilidade) */
  --incipit-fundo: #ede5d8;
  --roxo: #A68DAD;
}

html,
body {
  padding: 0;
  margin: 0;
  background-color: var(--incipit-background);
  color: var(--incipit-texto);
}
</style>