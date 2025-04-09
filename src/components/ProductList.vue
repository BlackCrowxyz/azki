<template>
  <div class="products-page">
    <div class="content">
      <CategoryProductPage :categoryName="selectedCategoryName" />

      <!-- Filtering Box -->
      <aside class="filter-box">
        <h3>دسته‌بندی‌ها</h3>

        <div v-if="categories.length === 0">
          <p>No categories available</p>
        </div>

        <ul class="categories">
          <li v-for="category in categories" :key="category.id">
            <div
              class="category-header"
              :class="{ active: isActiveCategory(category.name) }"
              @click="toggleCategory(category)"
            >
              {{ category.name }}
            </div>
            <ul v-if="category.expanded" class="subcategories">
              <li v-for="sub in category.subcategories" :key="sub.id">
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
    <div class="product-list">
      <div v-for="product in products" :key="product.id" class="product-item">
        <small class="merchant-badge">{{ product.merchantName }}</small>
        <img :src="product.imageUrl" class="product-image" />
        <h4>{{ product.name }}</h4>
        <p>قیمت:</p>
        <p>{{ product.minPrice }} تومان</p>
      </div>
    </div>

    <div ref="loadMoreTrigger" class="load-more-trigger"></div>
  </div>
</template>

<script>
import axios from "axios";
import CategoryProductPage from "@/components/CategoryProductPage.vue";

export default {
  components: {
    CategoryProductPage,
  },
  data() {
    return {
      baseUrl: "https://interview-api.azkivam.com/api/v1/products",
      categories: [],
      // selectedCategoryId: null,
      // selectedSubcategoryId: null,
      // selectedSubcategorySlug: "",
      selectedCategoryName: null,
      shops: [],
      selectedShops: [],
      shopSearchQuery: "",
      allProducts: [],
      products: [],
      currentPage: 1,
      loading: false,
      totalPages: 1,
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
    // selectedSubcategoryId: {
    //   handler() {
    //     this.updateRoute();
    //   },
    // },
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
    handleRouteChange(to) {
      console.log("to", to);
      // Extract parameters from route
      const { merchantIds, subcategoryId, categoryName } = to.query;

      // Update selected shops
      if (merchantIds) {
        this.selectedShops = merchantIds.split(",").map(Number);
      } else {
        this.selectedShops = [];
      }

      // Update subcategory
      // if (subcategoryId) {
      //   this.selectedSubcategoryId = Number(subcategoryId);
      // } else {
      //   this.selectedSubcategoryId = null;
      // }

      // Update category name
      if (categoryName) {
        this.selectedCategoryName = categoryName;
      } else {
        this.selectedCategoryName = null;
      }

      // Reset pagination
      this.currentPage = 1;
      this.allProducts = [];
      this.products = [];

      // Fetch products with new filters
      this.fetchAllProducts();
    },

    updateRoute() {
      const query = {};

      if (this.selectedShops.length) {
        query.merchantIds = this.selectedShops.join(",");
      }

      // if (this.selectedSubcategoryId) {
      //   query.subcategoryId = this.selectedSubcategoryId;
      // }

      if (this.selectedCategoryName) {
        query.categoryName = this.selectedCategoryName;
      }

      // Use replace to avoid building up history
      this.$router.replace({
        path: "/products",
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
      if (this.loading || this.currentPage > this.totalPages) return;

      this.loading = true;
      const query = {};
      query.size = 20;
      query.page = this.currentPage;

      // if (this.selectedSubcategoryId) {
      //   query.subcategoryId = this.selectedSubcategoryId;
      // }

      let merchantIds = [];
      if (this.selectedShops.length) {
        merchantIds = this.selectedShops;
      }

      try {
        const res = await axios.post(
          `${this.baseUrl}?${new URLSearchParams(query).toString()}`
        );
        const data = res.data.data;
        console.log("API Response:", data);
        if (this.currentPage === 1) {
          this.allProducts = data;
          this.products = data;
        } else {
          this.allProducts = [...this.allProducts, ...data];
          this.products = [...this.allProducts];
        }

        // TODO - Pouya: Filter products by merchantIds
        this.products = this.products.filter((p) =>
          merchantIds.includes(p.merchantId)
        );

        const uniqueShops = new Map();
        res.data.data.forEach((p) => {
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

    // async filterBySubcategory(id, slug, categoryId) {
    //   this.selectedCategoryId = categoryId;
    //   this.selectedSubcategoryId = id;
    //   this.selectedSubcategorySlug = slug;

    //   await this.loadAllPagesBeforeFiltering();
    //   this.applyFilters();
    // },

    // selectCategory(category) {
    //   this.categories.forEach((c) => (c.expanded = false));
    //   category.expanded = !category.expanded;
    // },

    applyFilters() {
      const query = {};

      // Update the query with selected shops and subcategory
      if (this.selectedShops.length) {
        query.merchantIds = this.selectedShops.join(",");
      }

      // if (this.selectedSubcategoryId) {
      //   query.subcategoryId = this.selectedSubcategoryId;
      // }

      // Update the URL with query parameters
      this.$router.push({
        path: "/products", // Adjust this path as per your routing
        query,
      });

      // Fetch products with the updated URL query
      this.fetchAllProducts();
    },

    initializeFromURL() {
      this.handleRouteChange(this.$route);
      this.expandSelectedCategory();
    },

    expandSelectedCategory() {
      if (!this.selectedCategoryName) return;
      const match = this.categories.find(
        (cat) =>
          cat.name.toLowerCase() === this.selectedCategoryName.toLowerCase()
      );

      if (match) {
        this.categories.forEach((c) => (c.expanded = false));
        match.expanded = true;
      }
    },
  },
};
</script>

<style scoped>
.products-page {
  padding: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.content {
  display: flex;
  gap: 20px;
  flex-grow: 1;
}

.filter-box {
  background-color: #f4f4f4;
  padding: 20px;
  border-radius: 8px;
  position: fixed;
  top: 20px;
  right: 10px;
  text-align: right;
  align-self: flex-start;
  z-index: 10;
  max-height: 100%;
  overflow-y: auto;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Create 4 columns */
  gap: 20px; /* Add space between the products */
  margin-top: 20px;
  width: calc(100% - 320px);
}

.product-item {
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  width: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: auto;
  position: relative;
}

.product-image {
  width: 100%;
  height: auto;
  max-width: 100%;
  border-radius: 8px;
}

hr {
  margin: 20px 0;
  border: 0;
  border-top: 1px solid #ddd;
}

.shop-search-box {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  text-align: right;
  border-radius: 10px;
}

.load-more-trigger {
  height: 1px;
}

.categories,
.subcategories {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: right;
}

.categories li,
.subcategories li {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.subcategories li {
  color: rgb(157, 158, 158);
}
.categories li {
  display: block;
  margin-bottom: 15px;
}
h3 {
  font-weight: bold;
  padding-bottom: 12px;
}

.shops {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: right;
  max-height: 200px;
  overflow-y: auto;
}

.shops li {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding-bottom: 5px;
  padding-top: 5px;
}
.shops input[type="checkbox"] {
  order: -1; /* Move the checkbox before the text */
}

.category-header {
  font-weight: 600;
  padding-bottom: 8px;
}

.merchant-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  z-index: 1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

@media screen and (max-width: 1215.98px) {
  .product-list {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    width: 100%; /* Products get smaller */
  }
  .product.item {
    width: auto;
  }
}

@media screen and (max-width: 1024px) {
  .product-list {
    grid-template-columns: repeat(3, 1fr); /* 3 products in a row */
    width: 100%;
  }

  .content {
    margin-right: 280px; /* Adjust content margin for smaller screen */
  }
}

@media screen and (max-width: 768px) {
  .product-list {
    grid-template-columns: repeat(1, 1fr); /* 2 products in a row */
    width: 100%;
  }

  .filter-box {
    width: 100%; /* Take full width on smaller screens */
    position: relative; /* Change to normal flow on small screens */
    margin-top: 20px; /* Space above the box */
    right: 0; /* Align to the left on small screens */
  }

  .content {
    flex-direction: column; /* Stack the content on top of each other */
    align-items: center; /* Center the content */
    margin-right: 0; /* Remove margin on smaller screens */
    margin-right: 260px;
  }
}
@media screen and (max-width: 480px) {
  .product-list {
    grid-template-columns: 1fr; /* 1 product per row */
    width: 100%;
  }

  .content {
    margin-right: 0; /* Remove margin for the smallest screens */
  }

  .filter-box {
    position: relative; /* Reset filter box position */
    width: 100%; /* Make filter box take full width */
    margin-top: 20px; /* Space between filter box and products */
  }
}
h4 {
  font-weight: bold;
}
</style>
