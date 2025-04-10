import { createRouter, createWebHistory } from "vue-router";
import ProductList from "@/components/ProductList.vue";

const routes = [
  {
    path: "/",
    redirect: "/products"
  },
  // Explain: This route is used to display the product list and filters
  {
    path: "/products",
    name: "products",
    component: ProductList
  },
  // Explain: This route is used to display the product list for a specific category and subcategory.
  // and it's used for filtering products by category and subcategory.
  {
    path: "/products/:categoryId/:slug",
    name: "product-list",
    component: ProductList,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
