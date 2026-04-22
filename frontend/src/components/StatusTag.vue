<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true
  }
});

const map = {
  todo: { label: "未开始", type: "info" },
  in_progress: { label: "进行中", type: "warning" },
  done: { label: "已完成", type: "success" }
};

const meta = computed(() => map[props.status] || map.todo);
</script>

<template>
  <el-tag :type="meta.type" effect="light" round>
    {{ meta.label }}
  </el-tag>
</template>
