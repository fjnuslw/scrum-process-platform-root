<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { api } from "@/api/services.js";
import StatusTag from "@/components/StatusTag.vue";
import { useMetaStore } from "@/stores/meta.js";

const metaStore = useMetaStore();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const stories = ref([]);
const editingId = ref(null);

const filters = reactive({
  status: "",
  keyword: ""
});

const form = reactive({
  title: "",
  description: "",
  storyPoints: 3
});

function resetForm() {
  editingId.value = null;
  form.title = "";
  form.description = "";
  form.storyPoints = metaStore.storyPoints[0] || 3;
}

async function fetchStories() {
  loading.value = true;
  try {
    stories.value = await api.getStories({
      status: filters.status || undefined,
      keyword: filters.keyword || undefined
    });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row) {
  editingId.value = row.id;
  form.title = row.title;
  form.description = row.description;
  form.storyPoints = row.storyPoints;
  dialogVisible.value = true;
}

async function submitStory() {
  saving.value = true;
  try {
    if (editingId.value) {
      await api.updateStory(editingId.value, form);
      ElMessage.success("故事已更新");
    } else {
      await api.createStory(form);
      ElMessage.success("故事已创建");
    }
    dialogVisible.value = false;
    resetForm();
    await fetchStories();
  } finally {
    saving.value = false;
  }
}

async function removeStory(row) {
  await ElMessageBox.confirm(
    `确认删除故事“${row.title}”吗？该操作会影响 backlog 与燃尽图数据。`,
    "删除确认",
    { type: "warning" }
  );

  await api.deleteStory(row.id);
  ElMessage.success("故事已删除");
  await fetchStories();
}

onMounted(async () => {
  await metaStore.fetchMeta();
  resetForm();
  await fetchStories();
});
</script>

<template>
  <div class="stack-page">
    <section class="toolbar-card">
      <div class="toolbar-row">
        <div class="toolbar-group">
          <el-select v-model="filters.status" clearable placeholder="按状态筛选" style="width: 180px">
            <el-option label="未开始" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="done" />
          </el-select>
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题或描述"
            clearable
            style="width: 260px"
          />
          <el-button @click="fetchStories">查询</el-button>
        </div>

        <el-button type="primary" @click="openCreate">新建用户故事</el-button>
      </div>
    </section>

    <section class="panel-card">
      <div class="section-head">
        <div>
          <h3>用户故事列表</h3>
          <p>先完成最基础的 CRUD，为 backlog、迭代和燃尽图提供数据来源。</p>
        </div>
      </div>

      <el-table :data="stories" v-loading="loading" border stripe>
        <el-table-column prop="priorityOrder" label="优先级" width="90" />
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="280" />
        <el-table-column prop="storyPoints" label="故事点" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="所属迭代" width="120">
          <template #default="{ row }">
            {{ row.sprintId ? `Sprint ${row.sprintId}` : "未加入" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="removeStory(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑用户故事' : '新建用户故事'"
      width="640px"
    >
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="作为……我想要……以便……"
          />
        </el-form-item>
        <el-form-item label="故事点数">
          <el-select v-model="form.storyPoints" style="width: 200px">
            <el-option
              v-for="point in metaStore.storyPoints"
              :key="point"
              :label="String(point)"
              :value="point"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitStory">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
