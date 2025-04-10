<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <p class="empty-text">{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: "EmptyState",
  props: {
    message: {
      type: String,
      default: "محصولی یافت نشد",
    },
  },
};
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  min-height: 300px;
  width: 100%;
}

.empty-icon {
  color: var(--color-text-light);
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: var(--color-text-light);
  font-size: 1.1rem;
  margin: 0;
}
</style> 