import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useCart = defineStore("cart", () => {
  const items = ref<{ sku: string; price: number; qty: number }[]>([]);
  const total = computed(() => items.value.reduce((n, i) => n + i.price * i.qty, 0));
  function add(sku: string, price: number) {
    const hit = items.value.find((i) => i.sku === sku);
    if (hit) hit.qty++; else items.value.push({ sku, price, qty: 1 });
  }
  async function checkout(api: (items: unknown) => Promise<string>) {
    const id = await api(items.value);
    items.value = [];
    return id;
  }
  return { items, total, add, checkout };
});
