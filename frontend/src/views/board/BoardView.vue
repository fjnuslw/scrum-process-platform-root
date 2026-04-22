<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "@/api/services.js";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const board = ref(null);
const dragStory = ref(null);

const sprintId = computed(() => Number(route.params.sprintId));

async function fetchBoard() {
  loading.value = true;
  try {
    board.value = await api.getBoard(sprintId.value);
  } finally {
    loading.value = false;
  }
}

function onDragStart(story) {
  dragStory.value = story;
}

async function onDrop(status) {
  if (!dragStory.value || dragStory.value.status === status) {
    return;
  }

  await api.updateStoryStatus(dragStory.value.id, status);
  ElMessage.success("看板状态已更新");
  dragStory.value = null;
  await fetchBoard();
}

watch(
  () => route.params.sprintId,
  () => fetchBoard()
);

onMounted(fetchBoard);
</script>

<template>
  <div class="stack-page">
    <section class="toolbar-card">
      <div class="toolbar-row">
        <div>
          <h3>{{ board?.sprint?.name || `Sprint ${sprintId}` }} 看板</h3>
          <p>将故事拖拽到不同列，状态变更会同步驱动燃尽图剩余点数。</p>
        </div>
        <div class="toolbar-group">
          <el-button @click="router.push(`/burndown/${sprintId}`)">查看燃尽图</el-button>
          <el-button @click="router.push('/sprints')">返回迭代列表</el-button>
        </div>
      </div>
    </section>

    <section class="board-grid" v-loading="loading">
      <article
        v-for="column in board?.columns || []"
        :key="column.key"
        class="board-column"
        @dragover.prevent
        @drop="onDrop(column.key)"
      >
        <div class="board-column__head">
          <h4>{{ column.label }}</h4>
          <span>{{ column.stories.length }}</span>
        </div>

        <div class="board-column__list">
          <div
            v-for="story in column.stories"
            :key="story.id"
            class="board-card"
            draggable="true"
            @dragstart="onDragStart(story)"
          >
            <p class="card-kicker">优先级 {{ story.priorityOrder }}</p>
            <h5>{{ story.title }}</h5>
            <p>{{ story.description }}</p>
            <span class="story-points">{{ story.storyPoints }} SP</span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
