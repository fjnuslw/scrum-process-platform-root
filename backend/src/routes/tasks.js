import { readData, writeData, getNextId, now } from "../lib/store.js";
import { ok, fail } from "../utils/response.js";

function validateTask(task) {
  if (!task.title || typeof task.title !== "string" || task.title.trim() === "") {
    return { valid: false, message: "任务标题不能为空" };
  }
  if (task.estimatedHours === undefined || typeof task.estimatedHours !== "number" || task.estimatedHours < 0) {
    return { valid: false, message: "工时估算必须大于等于 0" };
  }
  if (!task.status || !["todo", "in_progress", "done"].includes(task.status)) {
    return { valid: false, message: "状态必须是 todo、in_progress 或 done" };
  }
  return { valid: true };
}

export default function tasksRouter(router) {
  // 获取某个故事的任务列表
  router.get("/stories/:id/tasks", (req, res) => {
    try {
      const { id } = req.params;
      const data = readData();
      const tasks = data.tasks.filter((task) => task.storyId === Number(id));
      ok(res, tasks);
    } catch (error) {
      fail(res, "获取任务列表失败");
    }
  });

  // 为某个故事创建新任务
  router.post("/stories/:id/tasks", (req, res) => {
    try {
      const { id } = req.params;
      const task = req.body;
      const validation = validateTask(task);
      
      if (!validation.valid) {
        return fail(res, validation.message);
      }

      const data = readData();
      const story = data.stories.find((s) => s.id === Number(id));

      if (!story) {
        return fail(res, "故事不存在");
      }

      const newTask = {
        id: getNextId(data, "task"),
        storyId: Number(id),
        title: task.title.trim(),
        estimatedHours: task.estimatedHours,
        status: task.status,
        createdAt: now(),
        updatedAt: now()
      };

      data.tasks.push(newTask);
      writeData(data);
      ok(res, newTask);
    } catch (error) {
      fail(res, "创建任务失败");
    }
  });

  // 更新任务
  router.put("/tasks/:id", (req, res) => {
    try {
      const { id } = req.params;
      const task = req.body;
      const validation = validateTask(task);
      
      if (!validation.valid) {
        return fail(res, validation.message);
      }

      const data = readData();
      const taskIndex = data.tasks.findIndex((t) => t.id === Number(id));

      if (taskIndex === -1) {
        return fail(res, "任务不存在");
      }

      const updatedTask = {
        ...data.tasks[taskIndex],
        title: task.title.trim(),
        estimatedHours: task.estimatedHours,
        status: task.status,
        updatedAt: now()
      };

      data.tasks[taskIndex] = updatedTask;
      writeData(data);
      ok(res, updatedTask);
    } catch (error) {
      fail(res, "更新任务失败");
    }
  });

  // 更新任务状态
  router.patch("/tasks/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["todo", "in_progress", "done"].includes(status)) {
        return fail(res, "状态必须是 todo、in_progress 或 done");
      }

      const data = readData();
      const taskIndex = data.tasks.findIndex((t) => t.id === Number(id));

      if (taskIndex === -1) {
        return fail(res, "任务不存在");
      }

      const updatedTask = {
        ...data.tasks[taskIndex],
        status,
        updatedAt: now()
      };

      data.tasks[taskIndex] = updatedTask;
      writeData(data);
      ok(res, updatedTask);
    } catch (error) {
      fail(res, "更新任务状态失败");
    }
  });
}
