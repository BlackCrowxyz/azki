import { createRouter, createWebHistory } from "vue-router";
import ProductList from "@/components/ProductList.vue";
import CategoryProductPage from "@/components/CategoryProductPage.vue";

const routes = [
  {
    path: "/products/:categoryId/:subcategoryId",
    name: "product-list",
    component: ProductList,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
