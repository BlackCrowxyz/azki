<template>
  <div class="products-page">
    <div class="content">
      <!-- Filtering Box -->
      <aside class="filter-box">
        <div class="filter-header">
          <h3>دسته‌بندی‌ها</h3>
          <button class="reset-btn" @click="resetFilters">
            پاک کردن فیلترها
          </button>
        </div>

        <div v-if="categories.length === 0">
          <p>No categories available</p>
        </div>

        <ul class="categories">
          <li v-for="category in categories" :key="category.id">
            <div
              class="category-header"
              :class="{
                active:
                  isActiveCategory(category.name) ||
                  category.subcategories.some(
                    (sub) => selectedCategoryId === sub.id
                  ),
                expanded: category.expanded,
              }"
              @click="toggleCategory(category)"
            >
              {{ category.name }}
              <span class="chevron"></span>
            </div>
            <ul v-if="category.expanded" class="subcategories">
              <li
                v-for="sub in category.subcategories"
                :key="sub.id"
                @click="selectCategory(sub.id, sub.slug)"
                :class="{ active: selectedCategoryId === sub.id }"
              >
                {{ sub.name }}
              </li>
            </ul>
          </li>
        </ul>
        <hr />
        <h3>فیلتر بر اساس فروشگاه‌ها</h3>
        <input
          type="text"
          v-model="shopSearchQuery"
          placeholder="جستجو فروشگاه"
          class="shop-search-box"
        />
        <ul class="shops">
          <li v-for="shop in filteredShops" :key="shop.id">
            <input
              type="checkbox"
              :id="'shop-' + shop.id"
              :value="shop.id"
              v-model="selectedShops"
              @change="applyFilters"
            />
            <label :for="'shop-' + shop.id">{{ shop.name }}</label>
          </li>
        </ul>
      </aside>
    </div>

    <!-- Product List Section -->
    <section class="product-list-section">
      <div class="product-list">
        <div class="empty-state" v-if="products.length === 0">
          <svg
            class="empty-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path
              d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
            ></path>
          </svg>
          <p class="empty-text">کالایی برای نمایش وجود ندارد</p>
        </div>
        <div
          v-else
          v-for="product in products"
          :key="product.id"
          class="product-item"
        >
          <img
            :src="product.imageUrl"
            class="product-image"
            width="250"
            height="250"
          />
          <h4>{{ product.name }}</h4>
          <p>شروع قیمت از: {{ formatPrice(product.minPrice) }} تومان</p>
        </div>
      </div>

      <div ref="loadMoreTrigger" class="load-more-trigger"></div>
    </section>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      categories: [],
      selectedCategoryName: null,
      shops: [],
      selectedShops: [],
      shopSearchQuery: "",
      products: [],
      currentPage: 1,
      loading: false,
      totalPages: 1,
      selectedCategoryId: null,
    };
  },
  computed: {
    filteredShops() {
      return this.shops.filter((shop) =>
        shop.name.toLowerCase().includes(this.shopSearchQuery.toLowerCase())
      );
    },
  },
  /*
    TODO - Pouya: This is the watch that is used to update the route when the user changes the filters
    This is used to ensure that the URL is updated with the new filters
    This is also used to initialize the component with the correct filters from the URL when the component is mounted
  */
  watch: {
    // Watch for route changes
    $route: {
      immediate: true,
      handler(to) {
        this.handleRouteChange(to);
      },
    },
    selectedShops: {
      handler() {
        this.updateRoute();
      },
    },
  },
  mounted() {
    this.fetchCategories();
    this.fetchAllProducts();
    this.initializeFromURL();
    window.onscroll = this.handleScroll;
  },
  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat("fa-IR").format(price);
    },
    handleRouteChange(to) {
      console.log("to", to);

      // Extract parameters from route params instead of query
      const { categoryId, slug } = to.params;

      // Handle category ID from params
      if (categoryId) {
        this.selectedCategoryId = Number(categoryId);
      } else {
        this.selectedCategoryId = null;
      }

      // Update selected shops from query (keeping this part unchanged)
      const { merchantIds } = to.query;
      if (merchantIds) {
        this.selectedShops = merchantIds.split(",").map(Number);
      } else {
        this.selectedShops = [];
      }

      // Update category name based on the selected category
      if (this.selectedCategoryId) {
        // First try to find the category in parent categories
        const category = this.categories.find(
          (cat) => cat.id === this.selectedCategoryId
        );
        if (category) {
          this.selectedCategoryName = category.name;
        } else {
          // If not found in parent categories, search in subcategories
          for (const parentCat of this.categories) {
            const subcat = parentCat.subcategories.find(
              (sub) => sub.id === this.selectedCategoryId
            );
            if (subcat) {
              this.selectedCategoryName = subcat.name;
              break;
            }
          }
        }
      } else {
        this.selectedCategoryName = null;
      }

      // Reset pagination
      this.currentPage = 1;
      this.products = [];

      // Fetch products with new filters
      this.fetchAllProducts();
    },

    selectCategory(id, slug) {
      console.log("selectCategory", id, slug);
      this.selectedCategoryId = id;

      // Find the category name from the categories list
      let categoryName = null;
      const category = this.categories.find((cat) => cat.id === id);
      if (category) {
        categoryName = category.name;
      } else {
        // If not found in parent categories, search in subcategories
        for (const parentCat of this.categories) {
          const subcat = parentCat.subcategories.find((sub) => sub.id === id);
          if (subcat) {
            categoryName = subcat.name;
            break;
          }
        }
      }

      this.selectedCategoryName = categoryName || slug;
      this.currentPage = 1;
      this.products = [];
      this.updateRoute();
      this.fetchAllProducts();
    },

    updateRoute() {
      const query = {};
      const params = {};

      if (this.selectedCategoryId) {
        params.categoryId = this.selectedCategoryId;
        params.slug = this.selectedCategoryName;
      }

      if (this.selectedShops.length) {
        query.merchantIds = this.selectedShops.join(",");
      }

      console.log("params", params);
      console.log("query", query);
      console.log(
        "this.selectedCategoryId",
        this.selectedCategoryId,
        this.selectedCategoryId ? "product-list" : "products"
      );
      // Use replace to avoid building up history
      this.$router.replace({
        name: this.selectedCategoryId ? "product-list" : "products",
        params,
        query,
      });
    },

    isActiveCategory(name) {
      return (
        name.toLowerCase() === (this.selectedCategoryName || "").toLowerCase()
      );
    },

    async fetchCategories() {
      try {
        const res = await axios.get(
          "https://interview-api.azkivam.com/api/v1/categories"
        );
        // console.log("API Response:", res);

        const allCategories = res.data.data;
        if (!allCategories || allCategories.length === 0) {
          console.error("No categories data found.");
          return;
        }

        console.log("All Categories:", allCategories);
        const categoriesWithSubcategories = [];

        allCategories.forEach((category) => {
          // Find parent category
          if (category.parent === null) {
            categoriesWithSubcategories.push({
              id: category.id,
              name: category.name, // Use 'name' as the category name
              expanded: false,
              subcategories: [], // Initialize subcategories array
            });
          }
        });

        // Now, for each category, check if it has a parent and add it to the parent's subcategories
        allCategories.forEach((category) => {
          if (category.parent !== null) {
            const parentCategory = categoriesWithSubcategories.find(
              (parent) => parent.id === category.parent
            );
            if (parentCategory) {
              parentCategory.subcategories.push({
                id: category.id,
                name: category.name, // Use 'name' as the subcategory name
                slug: category.slug,
              });
            }
          }
        });

        // Now the categoriesWithSubcategories array holds the parent categories with their children (subcategories)
        this.categories = categoriesWithSubcategories;

        console.log(
          "Processed Categories with Subcategories:",
          this.categories
        );
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    },

    toggleCategory(category) {
      category.expanded = !category.expanded; // Toggle the expanded state
    },

    // New method to fetch shops
    async fetchShops() {
      try {
        const res = await axios.get(
          "https://interview-api.azkivam.com/api/v1/merchants"
        );
        console.log("API Response (Shops):", res);

        const allShops = res.data.data;
        if (!allShops || allShops.length === 0) {
          console.error("No shops data found.");
          return;
        }

        console.log("All Shops:", allShops);

        this.shops = allShops.map((shop) => ({
          id: shop.id,
          name: shop.name, // Use 'name' from the data
        }));

        console.log("Processed Shops:", this.shops);
      } catch (error) {
        console.error("Failed to fetch shops:", error);
      }
    },

    async fetchAllProducts() {
      console.log(
        "fetchAllProducts",
        this.loading,
        this.currentPage,
        this.totalPages
      );
      if (
        this.loading ||
        (this.currentPage > this.totalPages && this.totalPages !== 0)
      )
        return;

      this.loading = true;
      const query = {};
      query.size = 20;
      query.page = this.currentPage;

      let url = "https://interview-api.azkivam.com/api/v1/products";
      let categoryIds = [];

      if (this.selectedCategoryId) {
        url += `/${this.selectedCategoryId}`;

        categoryIds = [this.selectedCategoryId];

        const hasChildren = this.categories.some(
          (cat) => cat.parent === this.selectedCategoryId
        );
        if (hasChildren) {
          const childIds = this.categories
            .filter((cat) => cat.parent === this.selectedCategoryId)
            .map((cat) => cat.id);
          categoryIds = [...categoryIds, ...childIds];
        }

        const parentCategory = this.categories.find(
          (cat) => cat.id === this.selectedCategoryId
        )?.parent;
        if (parentCategory) {
          // If parent exists, add the parent category ID to the categoryIds
          categoryIds.push(parentCategory);
        }
      }

      let merchantIds = [];
      if (this.selectedShops.length) {
        merchantIds = this.selectedShops;
      }

      try {
        const res = await axios.post(
          `${url}?${new URLSearchParams(query).toString()}`
        );
        const data = res.data.data;

        console.log("API Response:", data);
        if (this.currentPage === 1) {
          this.products = data;
        } else {
          this.products = [...this.products, ...data];
        }

        if (merchantIds.length > 0) {
          // TODO - Pouya: Filter products by merchantIds
          this.products = this.products.filter((p) =>
            merchantIds.includes(p.merchantId)
          );
        }

        const uniqueShops = new Map();
        data.forEach((p) => {
          if (p.merchantName && !uniqueShops.has(p.merchantName)) {
            uniqueShops.set(p.merchantName, {
              id: p.merchantId,
              name: p.merchantName,
            });
          }
        });

        this.totalPages = Math.ceil(res.data.totalItems / 20);
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
        } else {
          this.currentPage = this.totalPages + 1;
        }

        // TODO - Pouya: This ensures that the shops are sorted by id before adding them to the shops array
        const newShops = Array.from(uniqueShops.values());
        // Only add shops that don't already exist in this.shops
        newShops.forEach((shop) => {
          if (!this.shops.some((existingShop) => existingShop.id === shop.id)) {
            this.shops.push(shop);
          }
        });
      } catch (e) {
        console.error("Error fetching products", e);
      } finally {
        this.loading = false;
      }
    },

    async loadAllPagesBeforeFiltering() {
      while (this.currentPage <= this.totalPages && !this.loading) {
        await this.fetchAllProducts();
      }
    },

    handleScroll() {
      if (
        window.scrollY + window.innerHeight >=
          document.body.offsetHeight * 0.8 &&
        this.currentPage <= this.totalPages
      ) {
        this.fetchAllProducts();
      }
    },

    applyFilters() {
      const query = {};
      const params = {};

      // Update the query with selected shops
      if (this.selectedShops.length) {
        query.merchantIds = this.selectedShops.join(",");
      }

      // Preserve category params if they exist
      if (this.selectedCategoryId) {
        params.categoryId = this.selectedCategoryId;
        params.slug = this.selectedCategoryName;
      }

      // Update the URL with both params and query parameters
      this.$router.push({
        name: this.selectedCategoryId ? "product-list" : "products",
        params,
        query,
      });

      // Fetch products with the updated filters
      this.fetchAllProducts();
    },

    initializeFromURL() {
      this.handleRouteChange(this.$route);
      this.expandSelectedCategory();
    },

    expandSelectedCategory() {
      if (!this.selectedCategoryName) return;
      this.categories.forEach((category) => {
        const matchInParent =
          category.name.toLowerCase() ===
          this.selectedCategoryName.toLowerCase();
        const matchInChild = category.subcategories.some(
          (sub) =>
            sub.name.toLowerCase() === this.selectedCategoryName.toLowerCase()
        );

        if (matchInParent || matchInChild) {
          category.expanded = true;
        }
      });
    },

    resetFilters() {
      this.selectedCategoryId = null;
      this.selectedCategoryName = null;
      this.selectedShops = [];
      this.shopSearchQuery = "";
      this.currentPage = 1;
      this.products = [];
      this.totalPages = 1;
      this.shops = [];
      this.updateRoute();
      this.fetchAllProducts();
    },
  },
};
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css");

/* Color Classes */
.text-primary {
  color: var(--vt-c-blue);
}

.text-secondary {
  color: var(--vt-c-text-light-2);
}

.bg-primary-light {
  background-color: var(--vt-c-blue-light);
}

.bg-primary-hover:hover {
  background-color: var(--vt-c-blue-light);
}

.border-primary {
  border-color: var(--vt-c-blue);
}

/* Base Styles */
.products-page,
.content,
.filter-box,
.product-list,
.product-item,
.category-header,
.subcategories li,
.shops li,
.reset-btn,
.shop-search-box,
.empty-state,
.empty-text,
h3,
h4,
p {
  font-family: "Vazir", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
}

.d-flex {
  display: flex;
}
.justify-center {
  justify-content: center;
}
.align-center {
  align-items: center;
}
.ma-auto {
  margin: auto;
}
.w-100 {
  width: 100%;
}

.products-page {
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  min-height: 100vh;
}

.content {
  display: flex;
  gap: 20px;
  width: 100%;
  position: relative;
}

.filter-box {
  background-color: var(--color-background-soft);
  padding: 20px;
  border-radius: 8px;
  width: 280px;
  text-align: right;
  align-self: flex-start;
  z-index: 10;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  position: sticky;
  top: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.reset-btn {
  background-color: var(--vt-c-blue-light);
  color: var(--vt-c-blue);
  border: 1px solid var(--vt-c-blue);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background-color: var(--vt-c-blue);
  color: white;
}

.reset-btn:active {
  background-color: var(--vt-c-blue-active);
  border-color: var(--vt-c-blue-active);
}

h3 {
  font-weight: bold;
  padding-bottom: 12px;
  color: var(--color-heading);
  margin: 0;
}

.product-list-section {
  flex: 1;
  min-width: calc(100% - 300px);
  display: flex;
  flex-direction: column;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  justify-content: flex-start;
  width: 100%;
  min-height: calc(100vh - 100px);
  @media screen and (max-width: 750px) {
    min-height: calc(100vh - 430px);
  }
  position: relative;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 40px;
  text-align: right;
  background-color: var(--color-background-soft);
  border-radius: 8px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--vt-c-text-light-2);
  margin-bottom: 16px;
}

.empty-text {
  color: var(--vt-c-text-light-2);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

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

hr {
  margin: 20px 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}

.shop-search-box {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  text-align: right;
  border-radius: 10px;
  border: 1px solid var(--color-border);
}

.shop-search-box:focus {
  outline: none;
  border-color: var(--vt-c-blue);
  box-shadow: 0 0 0 2px var(--vt-c-blue-light);
}

.load-more-trigger {
  height: 1px;
  width: 100%;
  margin-top: 20px;
}

.categories,
.subcategories {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: right;
  margin-bottom: 4px;
}

.categories li,
.subcategories li {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.subcategories li {
  color: var(--vt-c-text-light-2);
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-radius: 4px;
}

.subcategories li:hover {
  color: var(--vt-c-blue);
  background-color: var(--vt-c-blue-light);
}

.subcategories li.active {
  color: var(--vt-c-blue);
  background-color: var(--vt-c-blue-light);
  font-weight: 500;
}

.subcategories li.active::before {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 100%;
  background-color: var(--vt-c-blue);
  border-radius: 0 4px 4px 0;
}

.categories li {
  display: block;
}

.category-header {
  font-weight: 600;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
  position: relative;
  margin-bottom: 2px;
}

.category-header:hover {
  color: var(--vt-c-blue);
  background-color: var(--vt-c-blue-light);
}

.category-header.active {
  color: var(--vt-c-blue);
  background-color: var(--vt-c-blue-light);
}

.category-header.active::before {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 100%;
  background-color: var(--vt-c-blue);
  border-radius: 0 4px 4px 0;
}

.chevron {
  width: 12px;
  height: 12px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.3s ease;
  margin-right: 8px;
}

.category-header.expanded .chevron {
  transform: rotate(-135deg);
}

.subcategories {
  margin-top: 5px;
  padding-right: 15px;
}

.shops {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: right;
  max-height: 160px;
  overflow-y: auto;
}

.shops li {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
}

.shops li:hover {
  background-color: var(--vt-c-blue-light);
  border-radius: 4px;
}

.shops input[type="checkbox"] {
  order: -1;
  cursor: pointer;
}

/* Custom Scrollbar */
.shops::-webkit-scrollbar {
  width: 6px;
}

.shops::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: 3px;
}

.shops::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.shops::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}

/* Responsive Design */
@media screen and (max-width: 1400px) {
  .product-item {
    flex: 0 0 calc(33.333% - 20px);
  }
}

@media screen and (max-width: 1080px) {
  .products-page {
    flex-direction: column;
  }

  .content {
    flex-direction: column;
  }

  .filter-box {
    width: 100%;
    position: relative;
    max-height: none;
    top: 0;
  }

  .product-list-section {
    min-width: 100%;
  }

  .product-list {
    margin-top: 0;
  }

  .product-item {
    flex: 0 0 calc(50% - 20px);
  }
}

@media screen and (max-width: 750px) {
  .products-page {
    flex-direction: column;
  }

  .product-item {
    flex: 0 0 100%;
    min-width: 100%;
  }

  .filter-box {
    padding: 15px;
  }

  .shops {
    max-height: 160px;
  }

  .product-image {
    height: 200px;
  }
}

@media screen and (max-width: 480px) {
  .product-item {
    padding: 10px;
  }

  .filter-box {
    padding: 10px;
  }

  .product-image {
    height: 180px;
  }
}

h4 {
  font-weight: bold;
  margin: 10px 0;
  color: var(--color-heading);
  font-size: 0.8rem;
}
</style>
