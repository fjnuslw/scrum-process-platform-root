import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/api/services.js";

export const useMetaStore = defineStore("meta", () => {
  const storyPoints = ref([0.5, 1, 2, 3, 5, 8, 20, 40]);
  const ready = ref(false);

  async function fetchMeta() {
    if (ready.value) {
      return;
    }
    const meta = await api.getMeta();
    storyPoints.value = meta.storyPoints;
    ready.value = true;
  }

  return {
    storyPoints,
    ready,
    fetchMeta
  };
});
