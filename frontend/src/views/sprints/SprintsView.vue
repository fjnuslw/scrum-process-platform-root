<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import { api } from "@/api/services.js";

const router = useRouter();
const loading = ref(false);
const dialogVisible = ref(false);
const assignDialogVisible = ref(false);
const saving = ref(false);
const sprints = ref([]);
const backlogStories = ref([]);
const editingId = ref(null);
const selectedSprintId = ref(null);
const selectedStoryIds = ref([]);

const form = reactive({
  name: "",
  startDate: "",
  endDate: "",
  goal: ""
});

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.startDate = "";
  form.endDate = "";
  form.goal = "";
}

async function fetchData() {
  loading.value = true;
  try {
    const [sprintList, backlogList] = await Promise.all([
      api.getSprints(),
      api.getBacklog("pending")
    ]);
    sprints.value = sprintList;
    backlogStories.value = backlogList;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(item) {
  editingId.value = item.id;
  form.name = item.name;
  form.startDate = item.startDate;
  form.endDate = item.endDate;
  form.goal = item.goal || "";
  dialogVisible.value = true;
}

async function submitSprint() {
  saving.value = true;
  try {
    if (editingId.value) {
      await api.updateSprint(editingId.value, form);
      ElMessage.success("迭代已更新");
    } else {
      await api.createSprint(form);
      ElMessage.success("迭代已创建");
    }
    dialogVisible.value = false;
    resetForm();
    await fetchData();
  } finally {
    saving.value = false;
  }
}

async function removeSprint(item) {
  await ElMessageBox.confirm(
    `确认删除迭代“${item.name}”吗？相关故事会回到 backlog，回顾和燃尽图日志会一起移除。`,
    "删除确认",
    { type: "warning" }
  );
  await api.deleteSprint(item.id);
  ElMessage.success("迭代已删除");
  await fetchData();
}

function openAssign(item) {
  selectedSprintId.value = item.id;
  selectedStoryIds.value = [];
  assignDialogVisible.value = true;
}

async function assignStories() {
  if (!selectedStoryIds.value.length) {
    ElMessage.warning("请至少选择一个故事");
    return;
  }
  await api.assignStoriesToSprint(selectedSprintId.value, selectedStoryIds.value);
  assignDialogVisible.value = false;
  ElMessage.success("故事已加入迭代");
  await fetchData();
}

onMounted(fetchData);
</script>

<template>
  <div class="stack-page">
    <section class="toolbar-card">
      <div class="toolbar-row">
        <div>
          <h3>迭代计划管理</h3>
          <p>创建迭代、分配故事，再进入看板和燃尽图进行开发管理。</p>
        </div>
        <el-button type="primary" @click="openCreate">新建迭代</el-button>
      </div>
    </section>

    <section class="sprint-grid" v-loading="loading">
      <article v-for="item in sprints" :key="item.id" class="sprint-card">
        <div class="sprint-card__top">
          <div>
            <p class="card-kicker">Sprint {{ item.id }}</p>
            <h4>{{ item.name }}</h4>
          </div>
          <el-tag type="success" round>{{ item.storyCount }} 个故事</el-tag>
        </div>

        <p class="sprint-dates">{{ item.startDate }} ~ {{ item.endDate }}</p>
        <p class="sprint-goal">{{ item.goal || "未填写迭代目标" }}</p>

        <div class="sprint-metrics">
          <span>总故事点：{{ item.totalPoints }}</span>
        </div>

        <div class="card-actions">
          <el-button size="small" @click="openAssign(item)">加入故事</el-button>
          <el-button size="small" @click="router.push(`/board/${item.id}`)">看板</el-button>
          <el-button size="small" @click="router.push(`/burndown/${item.id}`)">燃尽图</el-button>
          <el-button size="small" @click="router.push(`/retrospectives/${item.id}`)">回顾</el-button>
        </div>

        <div class="card-actions">
          <el-button link type="primary" @click="openEdit(item)">编辑</el-button>
          <el-button link type="danger" @click="removeSprint(item)">删除</el-button>
        </div>
      </article>

      <el-empty v-if="!sprints.length && !loading" description="还没有迭代，请先新建一个 Sprint。" />
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑迭代' : '新建迭代'"
      width="560px"
    >
      <el-form label-position="top">
        <el-form-item label="迭代名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="迭代目标">
          <el-input v-model="form.goal" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitSprint">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignDialogVisible" title="将故事加入迭代" width="640px">
      <el-checkbox-group v-model="selectedStoryIds" class="assign-grid">
        <el-checkbox
          v-for="story in backlogStories"
          :key="story.id"
          :label="story.id"
          class="assign-item"
        >
          <div>
            <strong>{{ story.title }}</strong>
            <p>{{ story.description }}</p>
          </div>
        </el-checkbox>
      </el-checkbox-group>

      <el-empty
        v-if="!backlogStories.length"
        description="当前 backlog 中没有可分配故事。"
      />

      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="assignStories">确认加入</el-button>
      </template>
    </el-dialog>
  </div>
</template>
