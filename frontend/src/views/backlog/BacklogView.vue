<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { api } from "@/api/services.js";
import StatusTag from "@/components/StatusTag.vue";

const loading = ref(false);
const filter = ref("all");
const stories = ref([]);
const dragId = ref(null);

async function fetchBacklog() {
  loading.value = true;
  try {
    stories.value = await api.getBacklog(filter.value);
  } finally {
    loading.value = false;
  }
}

function onDragStart(id) {
  dragId.value = id;
}

async function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) {
    return;
  }

  const fromIndex = stories.value.findIndex((item) => item.id === dragId.value);
  const toIndex = stories.value.findIndex((item) => item.id === targetId);

  if (fromIndex === -1 || toIndex === -1) {
    return;
  }

  const reordered = [...stories.value];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  stories.value = reordered.map((item, index) => ({
    ...item,
    priorityOrder: index + 1
  }));

  await api.reorderStories(
    stories.value.map((item, index) => ({
      id: item.id,
      priorityOrder: index + 1
    }))
  );
  ElMessage.success("backlog 排序已保存");
}

onMounted(fetchBacklog);
</script>

<template>
  <div class="stack-page">
    <section class="toolbar-card">
      <div class="toolbar-row">
        <div>
          <h3>产品待办列表</h3>
          <p>支持按优先级展示和拖拽排序，排序结果会持久化保存。</p>
        </div>

        <el-radio-group v-model="filter" @change="fetchBacklog">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="pending">待开发</el-radio-button>
        </el-radio-group>
      </div>
    </section>

    <section class="backlog-board" v-loading="loading">
      <article
        v-for="story in stories"
        :key="story.id"
        class="story-card"
        draggable="true"
        @dragstart="onDragStart(story.id)"
        @dragover.prevent
        @drop="onDrop(story.id)"
      >
        <div class="story-card__head">
          <div>
            <p class="story-order">优先级 {{ story.priorityOrder }}</p>
            <h4>{{ story.title }}</h4>
          </div>
          <span class="story-points">{{ story.storyPoints }} SP</span>
        </div>
        <p class="story-desc">{{ story.description }}</p>
        <div class="story-card__foot">
          <StatusTag :status="story.status" />
          <span class="drag-tip">拖拽卡片调整顺序</span>
        </div>
      </article>

      <el-empty
        v-if="!stories.length && !loading"
        description="当前没有待办故事，请先去用户故事页面新增。"
      />
    </section>
  </div>
</template>
