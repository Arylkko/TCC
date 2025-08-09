<script setup>
const { $pb } = useNuxtApp();
const posts = ref([]);

try {
   posts.value = await $pb.collection('posts').getFullList();
} catch (error) {
  console.error("Deu ruim pra buscar os posts:", error);
}

</script>

<template>
  <div>
    <h1>Meus Posts</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
      </li>
    </ul>
  </div>
</template>