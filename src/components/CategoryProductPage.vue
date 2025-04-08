<template>
  <div class="category-products">
    <h2>{{ categoryTitle }}</h2>
    <ul class="products">
      <li v-for="product in products" :key="product.id">
        <div class="product-card">
          <img :src="product.image" alt="Product Image" />
          <h3>{{ product.name }}</h3>
          <p>{{ product.price }} تومان</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: {
    categoryId: Number,
    subcategoryId: Number,
  },
  data() {
    return {
      categoryTitle: "",
      products: [],
    };
  },
  watch: {
    categoryId: "fetchProducts",
    subcategoryId: "fetchProducts",
  },
  mounted() {
    this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      if (!this.categoryId) return;
      try {
        const response = await axios.get(
          `https://ps.azkivam.com/products?categoryId=${
            this.categoryId
          }&subcategoryId=${this.subcategoryId || ""}`
        );
        this.products = response.data.products;

        const categoryResponse = await axios.get(
          `https://ps.azkivam.com/categories`
        );
        const foundCategory = categoryResponse.data.find(
          (cat) => cat.id === this.categoryId
        );
        this.categoryTitle = foundCategory ? foundCategory.name : "محصولات";
      } catch (error) {
        console.error("خطا در دریافت محصولات:", error);
      }
    },
  },
};
</script>

<style scoped>
.category-products {
  flex: 3;
  padding: 20px;
}
.products {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 0;
  list-style: none;
}
.product-card {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}
.product-card img {
  width: 100px;
  height: 100px;
}
</style>
