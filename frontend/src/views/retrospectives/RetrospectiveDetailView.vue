<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "@/api/services.js";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const sprint = ref(null);
const currentRecordId = ref(null);

const sprintId = computed(() => Number(route.params.sprintId));

const form = reactive({
  good1: "",
  good2: "",
  good3: "",
  improve1: "",
  improve2: "",
  improve3: ""
});

function applyRecord(record) {
  currentRecordId.value = record?.id || null;
  form.good1 = record?.good1 || "";
  form.good2 = record?.good2 || "";
  form.good3 = record?.good3 || "";
  form.improve1 = record?.improve1 || "";
  form.improve2 = record?.improve2 || "";
  form.improve3 = record?.improve3 || "";
}

async function fetchData() {
  loading.value = true;
  try {
    const [sprintDetail, record] = await Promise.all([
      api.getSprint(sprintId.value),
      api.getRetrospectiveBySprint(sprintId.value)
    ]);
    sprint.value = sprintDetail;
    applyRecord(record);
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const payload = {
      sprintId: sprintId.value,
      ...form
    };
    if (currentRecordId.value) {
      await api.updateRetrospective(currentRecordId.value, payload);
    } else {
      await api.saveRetrospective(payload);
    }
    ElMessage.success("回顾内容已保存");
    await fetchData();
  } finally {
    saving.value = false;
  }
}

watch(
  () => route.params.sprintId,
  () => fetchData()
);

onMounted(fetchData);
</script>

<template>
  <div class="stack-page">
    <section class="toolbar-card">
      <div class="toolbar-row">
        <div>
          <h3>{{ sprint?.name || `Sprint ${sprintId}` }} 回顾</h3>
          <p>保持最小可交付：记录 3 条做得好和 3 条待改进，支持后续报告整理。</p>
        </div>
        <el-button @click="router.push('/retrospectives')">返回回顾列表</el-button>
      </div>
    </section>

    <section class="retro-form-card" v-loading="loading">
      <div class="retro-grid">
        <div class="retro-column">
          <h4>做得好的三件事</h4>
          <el-input v-model="form.good1" type="textarea" :rows="3" />
          <el-input v-model="form.good2" type="textarea" :rows="3" />
          <el-input v-model="form.good3" type="textarea" :rows="3" />
        </div>

        <div class="retro-column">
          <h4>待改进的三件事</h4>
          <el-input v-model="form.improve1" type="textarea" :rows="3" />
          <el-input v-model="form.improve2" type="textarea" :rows="3" />
          <el-input v-model="form.improve3" type="textarea" :rows="3" />
        </div>
      </div>

      <div class="retro-actions">
        <el-button type="primary" :loading="saving" @click="save">保存回顾</el-button>
      </div>
    </section>
  </div>
</template>
