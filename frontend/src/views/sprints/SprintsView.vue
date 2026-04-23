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
const dragId = ref(null);
const dragOverSprintId = ref(null);

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
    `确认删除迭代"${item.name}"吗？相关故事会回到 backlog，回顾和燃尽图日志会一起移除。`,
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

function onDragStart(id) {
  dragId.value = id;
}

function onDragOver(sprintId) {
  dragOverSprintId.value = sprintId;
}

function onDragLeave() {
  dragOverSprintId.value = null;
}

async function onDrop(sprintId) {
  if (!dragId.value) {
    return;
  }
  
  await api.updateStorySprint(dragId.value, sprintId);
  ElMessage.success("故事已加入迭代");
  await fetchData();
  dragId.value = null;
  dragOverSprintId.value = null;
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

    <div class="sprints-container">
      <section class="backlog-section" v-loading="loading">
        <h4>待办故事（拖拽到迭代中）</h4>
        <div class="backlog-list">
          <article
            v-for="story in backlogStories"
            :key="story.id"
            class="story-card"
            draggable="true"
            @dragstart="onDragStart(story.id)"
          >
            <div class="story-card__head">
              <h4>{{ story.title }}</h4>
              <span class="story-points">{{ story.storyPoints }} SP</span>
            </div>
            <p class="story-desc">{{ story.description }}</p>
            <div class="story-card__foot">
              <span class="drag-tip">拖拽到下方迭代中</span>
            </div>
          </article>
          <el-empty
            v-if="!backlogStories.length && !loading"
            description="当前 backlog 中没有可分配故事。"
          />
        </div>
      </section>

      <section class="sprint-grid" v-loading="loading">
        <h4>迭代列表</h4>
        <article 
          v-for="item in sprints" 
          :key="item.id" 
          class="sprint-card"
          :class="{ 'drag-over': dragOverSprintId === item.id }"
          @dragover.prevent="onDragOver(item.id)"
          @dragleave="onDragLeave"
          @drop="onDrop(item.id)"
        >
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

          <div class="drop-zone">
            <el-icon class="drop-icon"><i class="el-icon-upload"></i></el-icon>
            <p>拖拽故事到此处加入迭代</p>
          </div>

          <div class="card-actions">
            <el-button size="small" @click="openAssign(item)">选择加入</el-button>
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
    </div>

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

<style scoped>
.sprints-container {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.backlog-section {
  flex: 1;
  min-width: 300px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
}

.backlog-section h4,
.sprint-grid h4 {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.backlog-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.story-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  cursor: grab;
  transition: all 0.3s ease;
}

.story-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.story-card:active {
  cursor: grabbing;
}

.story-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.story-card__head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.story-points {
  background: #f0f9ff;
  color: #1677ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.story-desc {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.story-card__foot {
  margin-top: 12px;
  text-align: right;
}

.drag-tip {
  font-size: 12px;
  color: #999;
}

.sprint-grid {
  flex: 2;
  min-width: 400px;
}

.sprint-card {
  background: white;
  border: 2px dashed transparent;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.sprint-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #1677ff;
}

.sprint-card.drag-over {
  border-color: #1677ff;
  background: rgba(22, 119, 255, 0.05);
}

.drop-zone {
  margin: 16px 0;
  padding: 20px;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  text-align: center;
  transition: all 0.3s ease;
}

.drop-zone:hover {
  border-color: #1677ff;
  background: rgba(22, 119, 255, 0.05);
}

.drop-icon {
  font-size: 24px;
  color: #1677ff;
  margin-bottom: 8px;
}

.drop-zone p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.sprint-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-kicker {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #999;
}

.sprint-card__top h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.sprint-dates {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
}

.sprint-goal {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.sprint-metrics {
  margin: 12px 0;
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.card-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.assign-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assign-item {
  display: block;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.assign-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .sprints-container {
    flex-direction: column;
  }
  
  .backlog-section,
  .sprint-grid {
    min-width: auto;
  }
}
</style>
