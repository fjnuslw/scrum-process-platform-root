import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "tmp-db.json");

process.env.DATA_FILE = dataFile;
process.env.NODE_ENV = "test";

const { default: app } = await import("../src/app.js");

function resetTestDb() {
  const state = {
    meta: {
      nextIds: {
        story: 1,
        sprint: 1,
        retrospective: 1,
        burndownLog: 1,
        issue: 1
      }
    },
    stories: [],
    sprints: [],
    retrospectives: [],
    burndownLogs: [],
    issues: []
  };

  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf8");
}

beforeEach(() => {
  resetTestDb();
});

afterAll(() => {
  if (fs.existsSync(dataFile)) {
    fs.unlinkSync(dataFile);
  }
});

async function createStory(overrides = {}) {
  const payload = {
    title: "用户登录故事",
    description: "作为用户，我想要登录，以便进入系统",
    storyPoints: 3,
    ...overrides
  };

  const response = await request(app).post("/api/stories").send(payload);
  return response.body.data;
}

async function createSprint(overrides = {}) {
  const payload = {
    name: "Sprint 1",
    startDate: "2026-04-20",
    endDate: "2026-04-26",
    goal: "完成核心流程",
    ...overrides
  };

  const response = await request(app).post("/api/sprints").send(payload);
  return response.body.data;
}

async function createIssue(overrides = {}) {
  const payload = {
    title: "测试问题",
    description: "这是一个测试问题",
    sprintId: null,
    status: "todo",
    ...overrides
  };

  const response = await request(app).post("/api/issues").send(payload);
  return response.body.data;
}

test("用户故事 CRUD 可用", async () => {
  const created = await createStory();
  expect(created.title).toBe("用户登录故事");

  const listResponse = await request(app).get("/api/stories");
  expect(listResponse.body.data).toHaveLength(1);

  const updateResponse = await request(app)
    .put(`/api/stories/${created.id}`)
    .send({
      title: "用户注册故事",
      description: "作为用户，我想要注册，以便创建账号",
      storyPoints: 5
    });
  expect(updateResponse.body.data.storyPoints).toBe(5);

  const deleteResponse = await request(app).delete(`/api/stories/${created.id}`);
  expect(deleteResponse.body.message).toBe("删除成功");
});

test("backlog 查询与排序更新可用", async () => {
  const story1 = await createStory({ title: "故事 A" });
  const story2 = await createStory({ title: "故事 B" });

  const reorderResponse = await request(app)
    .patch("/api/stories/reorder")
    .send({
      items: [
        { id: story2.id, priorityOrder: 1 },
        { id: story1.id, priorityOrder: 2 }
      ]
    });

  expect(reorderResponse.body.code).toBe(0);

  const backlogResponse = await request(app).get("/api/backlog").query({ filter: "all" });
  expect(backlogResponse.body.data[0].id).toBe(story2.id);
});

test("迭代 CRUD 与故事加入迭代可用", async () => {
  const sprint = await createSprint();
  const story = await createStory();

  const detailResponse = await request(app).get(`/api/sprints/${sprint.id}`);
  expect(detailResponse.body.data.name).toBe("Sprint 1");

  const assignResponse = await request(app)
    .post(`/api/sprints/${sprint.id}/stories`)
    .send({ storyIds: [story.id] });
  expect(assignResponse.body.data[0].sprintId).toBe(sprint.id);

  const updateResponse = await request(app)
    .put(`/api/sprints/${sprint.id}`)
    .send({
      name: "Sprint 1 Updated",
      startDate: "2026-04-21",
      endDate: "2026-04-27",
      goal: "更新后目标"
    });
  expect(updateResponse.body.data.name).toBe("Sprint 1 Updated");

  const deleteResponse = await request(app).delete(`/api/sprints/${sprint.id}`);
  expect(deleteResponse.body.message).toBe("删除成功");
});

test("看板状态更新会驱动燃尽图数据", async () => {
  const sprint = await createSprint();
  const story = await createStory({ storyPoints: 8 });

  await request(app).post(`/api/sprints/${sprint.id}/stories`).send({ storyIds: [story.id] });
  const statusResponse = await request(app)
    .patch(`/api/stories/${story.id}/status`)
    .send({ status: "done" });

  expect(statusResponse.body.data.status).toBe("done");

  const burndownResponse = await request(app).get(`/api/sprints/${sprint.id}/burndown`);
  const actual = burndownResponse.body.data.actual;
  const today = new Date().toISOString().slice(0, 10);
  const todayPoint = actual.find((item) => item.date === today);
  expect(todayPoint?.remaining).toBe(0);
});

test("回顾新增与查询可用", async () => {
  const sprint = await createSprint();

  const saveResponse = await request(app).post("/api/retrospectives").send({
    sprintId: sprint.id,
    good1: "沟通顺畅",
    good2: "任务清晰",
    good3: "测试及时",
    improve1: "估时更准",
    improve2: "拆分更细",
    improve3: "文档更全"
  });

  expect(saveResponse.body.message).toBe("回顾已保存");

  const queryResponse = await request(app).get(`/api/retrospectives/${sprint.id}`);
  expect(queryResponse.body.data.good1).toBe("沟通顺畅");
});

test("问题追踪管理接口可用", async () => {
  // 测试 POST /api/issues
  const created = await createIssue();
  expect(created.title).toBe("测试问题");
  expect(created.status).toBe("todo");

  // 测试 GET /api/issues
  const listResponse = await request(app).get("/api/issues");
  expect(listResponse.body.data).toHaveLength(1);

  // 测试 PUT /api/issues/:id
  const updateResponse = await request(app)
    .put(`/api/issues/${created.id}`)
    .send({
      title: "更新的测试问题",
      description: "这是一个更新后的测试问题",
      sprintId: null,
      status: "in_progress"
    });
  expect(updateResponse.body.data.title).toBe("更新的测试问题");
  expect(updateResponse.body.data.status).toBe("in_progress");

  // 测试 PATCH /api/issues/:id/status
  const statusResponse = await request(app)
    .patch(`/api/issues/${created.id}/status`)
    .send({ status: "closed" });
  expect(statusResponse.body.data.status).toBe("closed");
});
