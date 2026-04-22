import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";
import BacklogView from "@/views/backlog/BacklogView.vue";
import BoardView from "@/views/board/BoardView.vue";
import BurndownView from "@/views/burndown/BurndownView.vue";
import RetrospectiveDetailView from "@/views/retrospectives/RetrospectiveDetailView.vue";
import RetrospectiveListView from "@/views/retrospectives/RetrospectiveListView.vue";
import SprintsView from "@/views/sprints/SprintsView.vue";
import StoriesView from "@/views/stories/StoriesView.vue";

const routes = [
  {
    path: "/",
    component: AppLayout,
    redirect: "/stories",
    children: [
      {
        path: "stories",
        name: "stories",
        component: StoriesView,
        meta: { title: "用户故事管理" }
      },
      {
        path: "backlog",
        name: "backlog",
        component: BacklogView,
        meta: { title: "产品待办列表" }
      },
      {
        path: "sprints",
        name: "sprints",
        component: SprintsView,
        meta: { title: "迭代计划管理" }
      },
      {
        path: "board/:sprintId",
        name: "board",
        component: BoardView,
        meta: { title: "迭代看板" }
      },
      {
        path: "burndown/:sprintId",
        name: "burndown",
        component: BurndownView,
        meta: { title: "燃尽图" }
      },
      {
        path: "retrospectives",
        name: "retrospectives",
        component: RetrospectiveListView,
        meta: { title: "迭代回顾列表" }
      },
      {
        path: "retrospectives/:sprintId",
        name: "retrospective-detail",
        component: RetrospectiveDetailView,
        meta: { title: "迭代回顾" }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
