<template>
  <aside class="filter-box">
    <div class="filter-header">
      <h3>دسته‌بندی‌ها</h3>
      <button class="reset-btn" @click="resetFilters">پاک کردن فیلترها</button>
    </div>

    <div v-if="categories.length === 0">
      <p>دسته‌بندی‌ها وجود ندارد</p>
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
      :value="shopSearchQuery"
      @input="$emit('update:shopSearchQuery', $event.target.value)"
      placeholder="جستجو فروشگاه"
      class="shop-search-box"
    />
    <ul class="shops">
      <li v-for="shop in filteredShops" :key="shop.id">
        <input
          type="checkbox"
          :id="'shop-' + shop.id"
          :value="shop.id"
          :checked="selectedShops.includes(shop.id)"
          @change="updateSelectedShops(shop.id, $event.target.checked)"
        />
        <label :for="'shop-' + shop.id">{{ shop.name }}</label>
      </li>
    </ul>
  </aside>
</template>

<script>
export default {
  name: "FilterBox",
  props: {
    categories: {
      type: Array,
      required: true,
    },
    shops: {
      type: Array,
      required: true,
    },
    selectedCategoryId: {
      type: Number,
      default: null,
    },
    selectedShops: {
      type: Array,
      required: true,
    },
    shopSearchQuery: {
      type: String,
      required: true,
    },
  },
  computed: {
    filteredShops() {
      return this.shops.filter((shop) =>
        shop.name.toLowerCase().includes(this.shopSearchQuery.toLowerCase())
      );
    },
  },
  methods: {
    toggleCategory(category) {
      this.$emit("toggle-category", category);
    },
    selectCategory(id, slug) {
      this.$emit("select-category", { id, slug });
    },
    isActiveCategory(name) {
      return (
        name.toLowerCase() === (this.selectedCategoryName || "").toLowerCase()
      );
    },
    applyFilters() {
      this.$emit("apply-filters");
    },
    resetFilters() {
      this.$emit("reset-filters");
    },
    updateSelectedShops(id, checked) {
      this.$emit(
        "update:selectedShops",
        checked
          ? [...this.selectedShops, id]
          : this.selectedShops.filter((i) => i !== id)
      );
    },
  },
};
</script>

<style scoped>
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

h3 {
  font-weight: bold;
  padding-bottom: 12px;
  color: var(--color-heading);
  margin: 0;
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

hr {
  margin: 20px 0;
  border: 0;
  border-top: 1px solid var(--color-border);
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
</style> 