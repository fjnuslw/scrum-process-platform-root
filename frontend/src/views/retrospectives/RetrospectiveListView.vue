<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/api/services.js";

const router = useRouter();
const loading = ref(false);
const retrospectives = ref([]);
const sprints = ref([]);

async function fetchData() {
  loading.value = true;
  try {
    const [retrospectiveList, sprintList] = await Promise.all([
      api.getRetrospectives(),
      api.getSprints()
    ]);
    retrospectives.value = retrospectiveList;
    sprints.value = sprintList;
  } finally {
    loading.value = false;
  }
}

function openSprint(sprintId) {
  router.push(`/retrospectives/${sprintId}`);
}

onMounted(fetchData);
</script>

<template>
  <div class="stack-page">
    <section class="panel-card" v-loading="loading">
      <div class="section-head">
        <div>
          <h3>按迭代填写回顾</h3>
          <p>每个 Sprint 记录 3 条做得好的事项和 3 条待改进事项。</p>
        </div>
      </div>

      <div class="sprint-list-grid">
        <article v-for="sprint in sprints" :key="sprint.id" class="mini-sprint-card">
          <div>
            <p class="card-kicker">Sprint {{ sprint.id }}</p>
            <h4>{{ sprint.name }}</h4>
            <p>{{ sprint.startDate }} ~ {{ sprint.endDate }}</p>
          </div>
          <el-button type="primary" plain @click="openSprint(sprint.id)">
            填写 / 查看回顾
          </el-button>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="section-head">
        <div>
          <h3>历史回顾记录</h3>
          <p>便于演示与汇报课程实验过程。</p>
        </div>
      </div>

      <el-table :data="retrospectives" border stripe>
        <el-table-column prop="sprintName" label="迭代" min-width="180" />
        <el-table-column prop="good1" label="做得好的第 1 项" min-width="220" />
        <el-table-column prop="improve1" label="待改进第 1 项" min-width="220" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSprint(row.sprintId)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>
