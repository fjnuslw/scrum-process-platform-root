<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => {
  if (route.name === "board" || route.name === "burndown") {
    return "sprints";
  }
  if (route.name === "retrospective-detail") {
    return "retrospectives";
  }
  return route.name;
});

const menus = [
  { index: "stories", label: "用户故事", path: "/stories" },
  { index: "backlog", label: "产品待办", path: "/backlog" },
  { index: "sprints", label: "迭代计划", path: "/sprints" },
  { index: "retrospectives", label: "迭代回顾", path: "/retrospectives" },
  { index: "issues", label: "问题追踪", path: "/issues" }
];

function navigate(path) {
  router.push(path);
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand-card">
        <p class="brand-kicker">课程实验项目</p>
        <h1>Scrum 过程管理平台</h1>
        <p class="brand-subtitle">
          聚焦基本版功能、可运行、可演示、可测试、可留痕。
        </p>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="nav-menu"
        @select="(key) => navigate(menus.find((item) => item.index === key)?.path || '/stories')"
      >
        <el-menu-item
          v-for="item in menus"
          :key="item.index"
          :index="item.index"
        >
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </aside>

    <main class="app-main">
      <header class="page-banner">
        <div>
          <p class="banner-label">Builder 模式</p>
          <h2>{{ route.meta.title || "Scrum 平台" }}</h2>
        </div>
        <p class="banner-note">
          已实现课程要求中的基础版功能，并新增问题追踪管理模块。
        </p>
      </header>

      <section class="page-content">
        <router-view />
      </section>
    </main>
  </div>
</template>
