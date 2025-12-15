<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <!-- Header Padrão -->
    <Header :show-search="true" />

    <div class="relative z-10 flex min-h-screen">
      <main class="flex-grow flex flex-col items-center justify-center p-6 sm:p-8 md:p-10">
        <div class="w-full max-w-screen-lg mb-6 sm:mb-8">
          <h2 class="text-4xl destaque rounded-full">
            Por onde começar?
          </h2>
        </div>

        <div class="max-w-screen-lg grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div class="card">
            <div>
              <h3 class="text-2xl mb-1 m-0">Terror</h3>
              <p>
                O terror como gênero literário é caracterizado por sua capacidade de despertar sentimentos de medo, suspense e apreensão no leitor, através de narrativas que exploram o sobrenatural, o macabro, ou temas que geram angústia e desconforto
              </p>
            </div>
            <button @click="navegarParaLista('x4yxjqcqfvqxmqi')" class="botao mt-3">
              Quero ler!
            </button>
          </div>

          <div class="card">
            <div>
              <h3 class="text-2xl mb-1 m-0">Fantasia</h3>
              <p>
                É um gênero da ficção em que geralmente se utilizam fenômenos sobrenaturais, mágicos e outros como elementos primários do enredo, tema ou configuração. Muitas obras dentro do gênero ocorrem em mundos imaginários, onde há criaturas mágicas e itens mágicos.
              </p>
            </div>
            <button @click="navegarParaLista('iuxaks68yotnzs4')" class="botao mt-3">
              Quero ler!
            </button>
          </div>

          <div class="card">
            <div>
              <h3 class="text-2xl mb-1 m-0">Ficção Científica</h3>
              <p>
                É um gênero que normalmente lida com conceitos ficcionais e imaginativos relacionados ao futuro, ciência e tecnologia, e seus impactos e/ou consequências em uma determinada sociedade ou em seus indivíduos
              </p>
            </div>
            <button @click="navegarParaLista('x4yxjqcqfvqxmqi')" class="botao mt-3">
              Quero ler!
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import Header from '~/components/Header.vue';

const router = useRouter();

function navegarParaLista(listaId) {
  router.push(`/lista/${listaId}`);
}
</script>
