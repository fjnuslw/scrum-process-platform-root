<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "@/api/services.js";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const sprint = ref(null);
const burndown = ref(null);
const chartRef = ref(null);
let chart;

const sprintId = computed(() => Number(route.params.sprintId));

function renderChart() {
  if (!chartRef.value || !burndown.value) {
    return;
  }

  if (!chart) {
    chart = echarts.init(chartRef.value);
  }

  chart.setOption({
    tooltip: {
      trigger: "axis"
    },
    legend: {
      data: ["计划线", "实际线"]
    },
    grid: {
      left: 24,
      right: 24,
      bottom: 24,
      top: 48,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: burndown.value.planned.map((item) => item.date)
    },
    yAxis: {
      type: "value",
      name: "剩余故事点"
    },
    series: [
      {
        name: "计划线",
        type: "line",
        smooth: true,
        data: burndown.value.planned.map((item) => item.remaining),
        lineStyle: {
          width: 3
        }
      },
      {
        name: "实际线",
        type: "line",
        smooth: true,
        data: burndown.value.actual.map((item) => item.remaining),
        lineStyle: {
          width: 3
        }
      }
    ]
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const [sprintDetail, burndownData] = await Promise.all([
      api.getSprint(sprintId.value),
      api.getBurndown(sprintId.value)
    ]);
    sprint.value = sprintDetail;
    burndown.value = burndownData;
    await nextTick();
    renderChart();
  } finally {
    loading.value = false;
  }
}

async function recalculate() {
  await api.recalculateBurndown(sprintId.value);
  ElMessage.success("燃尽图数据已重算");
  await fetchData();
}

watch(
  () => route.params.sprintId,
  () => fetchData()
);

onMounted(fetchData);

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<template>
  <div class="stack-page">
    <section class="toolbar-card">
      <div class="toolbar-row">
        <div>
          <h3>{{ sprint?.name || `Sprint ${sprintId}` }} 燃尽图</h3>
          <p>计划线按迭代天数线性生成，实际线根据故事完成状态的剩余点数计算。</p>
        </div>
        <div class="toolbar-group">
          <el-button @click="router.push(`/board/${sprintId}`)">返回看板</el-button>
          <el-button type="primary" @click="recalculate">重算燃尽图</el-button>
        </div>
      </div>
    </section>

    <section class="chart-card" v-loading="loading">
      <div class="metric-strip">
        <div class="metric-box">
          <span>总故事点</span>
          <strong>{{ burndown?.totalPoints ?? 0 }}</strong>
        </div>
        <div class="metric-box">
          <span>开始日期</span>
          <strong>{{ sprint?.startDate || "-" }}</strong>
        </div>
        <div class="metric-box">
          <span>结束日期</span>
          <strong>{{ sprint?.endDate || "-" }}</strong>
        </div>
      </div>

      <div ref="chartRef" class="chart-canvas"></div>
    </section>
  </div>
</template>
