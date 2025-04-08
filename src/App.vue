<template>
  <div>
    <ProductList />
  </div>
  <router-view />
</template>

<script>
import ProductList from "./components/ProductList.vue";

export default {
  components: {
    ProductList,
  },
};
</script>
