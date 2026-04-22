# API 接口草案

## 1. 用户故事管理

### GET /api/stories
- 查询用户故事列表
- 支持参数：`status`、`sprintId`、`keyword`

### POST /api/stories
- 新增用户故事

### PUT /api/stories/:id
- 编辑用户故事

### DELETE /api/stories/:id
- 删除用户故事

### PATCH /api/stories/reorder
- 批量更新优先级顺序

请求体示例：

```json
{
  "items": [
    { "id": 1, "priorityOrder": 1 },
    { "id": 2, "priorityOrder": 2 }
  ]
}
```

## 2. 产品待办列表管理

### GET /api/backlog
- 按优先级返回 backlog
- 支持筛选：all / pending

## 3. 迭代计划管理

### GET /api/sprints
- 查询迭代列表

### POST /api/sprints
- 创建迭代

### PUT /api/sprints/:id
- 更新迭代

### DELETE /api/sprints/:id
- 删除迭代

### POST /api/sprints/:id/stories
- 将用户故事加入迭代

请求体示例：

```json
{
  "storyIds": [1, 2, 3]
}
```

## 4. 看板管理

### GET /api/sprints/:id/board
- 获取某个迭代的看板数据

### PATCH /api/stories/:id/status
- 更新故事状态

请求体示例：

```json
{
  "status": "in_progress"
}
```

## 5. 燃尽图

### GET /api/sprints/:id/burndown
- 获取某个迭代的燃尽图数据
- 返回计划线与实际线所需数据

### POST /api/sprints/:id/burndown/recalculate
- 根据当前故事完成情况重新计算燃尽数据

## 6. 迭代回顾管理

### GET /api/retrospectives
- 查询历史回顾列表

### GET /api/retrospectives/:sprintId
- 查询某个迭代的回顾

### POST /api/retrospectives
- 新增或保存回顾

## 7. 统一响应格式建议

成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败：

```json
{
  "code": 1,
  "message": "参数错误",
  "data": null
}
```
