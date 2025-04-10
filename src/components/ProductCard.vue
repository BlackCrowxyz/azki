<template>
  <div class="product-item">
    <img
      :src="product.imageUrl || defaultImage"
      class="product-image"
      width="250"
      height="250"
      @error="(e) => handleImageError(e, defaultImage)"
    />
    <h4>{{ product.name }}</h4>
    <p>شروع قیمت از: {{ formatPrice(product.minPrice) }} تومان</p>
  </div>
</template>

<script>
import { formatPrice, handleImageError } from "../utils/utils";

export default {
  name: "ProductCard",
  props: {
    product: {
      type: Object,
      required: true,
    },
    defaultImage: {
      type: String,
      required: true,
    },
  },
  methods: {
    formatPrice,
    handleImageError,
  },
};
</script>

<style scoped>
.product-item {
  background-color: var(--color-background);
  padding: 15px;
  border-radius: 8px;
  text-align: right;
  flex: 0 0 calc(25% - 20px);
  min-width: 200px;
  max-width: 300px;
  max-height: 400px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s ease;
}

.product-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 250px;
  max-width: 100%;
  border-radius: 8px;
  object-fit: contain;
  margin-bottom: 10px;
}

.product-image[src*="azki-logo-simple"] {
  opacity: 0.3;
  background-color: var(--color-background-soft);
  padding: 20px;
}

h4 {
  font-weight: bold;
  margin: 10px 0;
  color: var(--color-heading);
  font-size: 0.8rem;
}

@media screen and (max-width: 1400px) {
  .product-item {
    flex: 0 0 calc(33.333% - 20px);
  }
}

@media screen and (max-width: 1080px) {
  .product-item {
    flex: 0 0 calc(50% - 20px);
  }
}

@media screen and (max-width: 750px) {
  .product-item {
    flex: 0 0 100%;
    min-width: 100%;
  }

  .product-image {
    height: 200px;
  }
}

@media screen and (max-width: 480px) {
  .product-item {
    padding: 10px;
  }

  .product-image {
    height: 180px;
  }
}
</style> 