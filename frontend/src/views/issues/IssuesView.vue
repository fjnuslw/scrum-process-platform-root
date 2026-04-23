<template>
  <div class="issues-view">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-header">
          <h2>问题追踪管理</h2>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新建问题
          </el-button>
        </div>
      </template>

      <!-- 问题列表 -->
      <el-table v-loading="loading" :data="issues" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="scope">
            <span class="issue-title">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="300">
          <template #default="scope">
            <span class="issue-description">{{ scope.row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sprintId" label="所属迭代" width="120">
          <template #default="scope">
            <span>{{ scope.row.sprintId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)" 
              effect="plain"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'closed' ? 'info' : 'success'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 'closed' ? '重新打开' : '关闭' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑问题' : '新建问题'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入问题标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            rows="4"
            placeholder="请输入问题描述"
          />
        </el-form-item>
        <el-form-item label="所属迭代">
          <el-input-number
            v-model="form.sprintId"
            placeholder="请输入迭代ID，可为空"
            :min="0"
            :step="1"
            :precision="0"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="待处理" value="todo" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getIssues, createIssue, updateIssue, updateIssueStatus } from '@/api/services';

// 响应式数据
const loading = ref(false);
const issues = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 对话框相关
const dialogVisible = ref(false);
const isEditing = ref(false);
const formRef = ref(null);
const form = ref({
  title: '',
  description: '',
  sprintId: null,
  status: 'todo'
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入问题标题', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// 状态类型映射
const getStatusType = (status) => {
  switch (status) {
    case 'todo': return 'info';
    case 'in_progress': return 'warning';
    case 'closed': return 'success';
    default: return '';
  }
};

// 状态文本映射
const getStatusText = (status) => {
  switch (status) {
    case 'todo': return '待处理';
    case 'in_progress': return '处理中';
    case 'closed': return '已关闭';
    default: return status;
  }
};

// 加载问题列表
const loadIssues = async () => {
  loading.value = true;
  try {
    const issuesData = await getIssues();
    issues.value = issuesData;
    total.value = issuesData.length;
  } catch (error) {
    ElMessage.error('获取问题列表失败');
    console.error('Error loading issues:', error);
  } finally {
    loading.value = false;
  }
};

// 处理新建问题
const handleCreate = () => {
  isEditing.value = false;
  form.value = {
    title: '',
    description: '',
    sprintId: null,
    status: 'todo'
  };
  dialogVisible.value = true;
};

// 处理编辑问题
const handleEdit = (row) => {
  isEditing.value = true;
  form.value = {
    ...row
  };
  dialogVisible.value = true;
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditing.value) {
          await updateIssue(form.value.id, form.value);
          ElMessage.success('问题更新成功');
        } else {
          await createIssue(form.value);
          ElMessage.success('问题创建成功');
        }
        dialogVisible.value = false;
        loadIssues();
      } catch (error) {
        ElMessage.error(isEditing.value ? '问题更新失败' : '问题创建失败');
        console.error('Error submitting issue:', error);
      }
    }
  });
};

// 处理状态变更
const handleStatusChange = async (row) => {
  try {
    const newStatus = row.status === 'closed' ? 'todo' : 'closed';
    await updateIssueStatus(row.id, newStatus);
    ElMessage.success('状态更新成功');
    loadIssues();
  } catch (error) {
    ElMessage.error('状态更新失败');
    console.error('Error updating status:', error);
  }
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  loadIssues();
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
  loadIssues();
};

// 组件挂载时加载数据
onMounted(() => {
  loadIssues();
});
</script>

<style scoped>
.issues-view {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.issue-title {
  font-weight: 500;
}

.issue-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>
