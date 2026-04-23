import { ok, fail } from "../utils/response.js";
import { readData, writeData, getNextId, now } from "../lib/store.js";

function validateIssue(issue) {
  if (!issue.title || typeof issue.title !== "string" || issue.title.trim() === "") {
    return { valid: false, message: "标题不能为空" };
  }
  if (!issue.description || typeof issue.description !== "string") {
    return { valid: false, message: "描述不能为空" };
  }
  if (issue.sprintId !== undefined && issue.sprintId !== null && typeof issue.sprintId !== "number") {
    return { valid: false, message: "sprintId 必须是数字或 null" };
  }
  if (!issue.status || !["todo", "in_progress", "closed"].includes(issue.status)) {
    return { valid: false, message: "状态必须是 todo、in_progress 或 closed" };
  }
  return { valid: true };
}

export default function issuesRouter(router) {
  // GET /api/issues
  router.get("/issues", (req, res) => {
    try {
      const data = readData();
      const issues = data.issues;
      ok(res, issues);
    } catch (error) {
      fail(res, "获取问题列表失败");
    }
  });

  // POST /api/issues
  router.post("/issues", (req, res) => {
    try {
      const issue = req.body;
      const validation = validateIssue(issue);
      
      if (!validation.valid) {
        return fail(res, validation.message);
      }

      const data = readData();
      const newIssue = {
        id: getNextId(data, "issue"),
        title: issue.title.trim(),
        description: issue.description,
        sprintId: issue.sprintId || null,
        status: issue.status,
        createdAt: now(),
        updatedAt: now()
      };

      data.issues.push(newIssue);
      writeData(data);
      ok(res, newIssue);
    } catch (error) {
      fail(res, "创建问题失败");
    }
  });

  // PUT /api/issues/:id
  router.put("/issues/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const issue = req.body;
      const validation = validateIssue(issue);
      
      if (!validation.valid) {
        return fail(res, validation.message);
      }

      const data = readData();
      const issueIndex = data.issues.findIndex(i => i.id === id);
      
      if (issueIndex === -1) {
        return fail(res, "问题不存在");
      }

      const updatedIssue = {
        ...data.issues[issueIndex],
        title: issue.title.trim(),
        description: issue.description,
        sprintId: issue.sprintId || null,
        status: issue.status,
        updatedAt: now()
      };

      data.issues[issueIndex] = updatedIssue;
      writeData(data);
      ok(res, updatedIssue);
    } catch (error) {
      fail(res, "更新问题失败");
    }
  });

  // PATCH /api/issues/:id/status
  router.patch("/issues/:id/status", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      
      if (!status || !["todo", "in_progress", "closed"].includes(status)) {
        return fail(res, "状态必须是 todo、in_progress 或 closed");
      }

      const data = readData();
      const issueIndex = data.issues.findIndex(i => i.id === id);
      
      if (issueIndex === -1) {
        return fail(res, "问题不存在");
      }

      const updatedIssue = {
        ...data.issues[issueIndex],
        status,
        updatedAt: now()
      };

      data.issues[issueIndex] = updatedIssue;
      writeData(data);
      ok(res, updatedIssue);
    } catch (error) {
      fail(res, "更新问题状态失败");
    }
  });
}
