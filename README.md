# Scrum 过程管理平台

本项目用于完成《AI 辅助软件过程实验》课程作业，目标是开发一个 Web 版 Scrum 过程管理平台，并保留 Builder 模式下的开发、测试、修正与留痕材料。

## 1. 项目范围

当前只实现课程要求中的基本版功能：

1. 用户故事管理
2. 产品待办列表管理
3. 迭代计划管理
4. 迭代开发管理（看板 + 燃尽图）
5. 迭代回顾管理

不包含权限系统、复杂登录注册、消息通知、多租户或课程要求之外的大型增强功能。

## 2. 技术选型

- 前端：Vue 3 + Vite + Element Plus + Vue Router + Pinia + ECharts
- 后端：Node.js + Express
- 接口测试：Vitest + Supertest
- 数据持久化：
  - 当前仓库默认使用 `backend/data/db.json` 做本地持久化，保证项目开箱即可运行
  - 同时提供 `backend/sql/schema.mysql.sql`，保留与课程文档一致的 MySQL 表结构脚本，便于后续迁移

> 说明：由于当前本地环境没有可直接使用的 MySQL 命令行与服务，为优先满足“可运行、可演示、可测试”，仓库默认采用轻量持久化方案；数据字段、接口范围和业务流程仍按文档约束实现。

## 3. 目录结构

```text
backend/
  data/                 本地持久化数据
  sql/                  MySQL 表结构脚本
  src/                  Express 接口实现
  tests/                接口自动化测试
frontend/
  src/
    api/                前端接口封装
    layouts/            页面布局
    router/             路由配置
    stores/             Pinia 状态
    views/              六个核心页面
docs/                   课程说明文档与过程材料
prompts/                Builder 模式提示词
Screenshot/             开发留痕截图
```

## 4. 已实现内容

### 后端接口

- `GET /api/stories`
- `POST /api/stories`
- `PUT /api/stories/:id`
- `DELETE /api/stories/:id`
- `PATCH /api/stories/reorder`
- `PATCH /api/stories/:id/status`
- `PATCH /api/stories/:id/sprint`
- `GET /api/backlog`
- `GET /api/sprints`
- `GET /api/sprints/:id`
- `POST /api/sprints`
- `PUT /api/sprints/:id`
- `DELETE /api/sprints/:id`
- `POST /api/sprints/:id/stories`
- `GET /api/sprints/:id/board`
- `GET /api/sprints/:id/burndown`
- `POST /api/sprints/:id/burndown/recalculate`
- `GET /api/retrospectives`
- `GET /api/retrospectives/:sprintId`
- `POST /api/retrospectives`
- `PUT /api/retrospectives/:id`

统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 前端页面

- `/stories` 用户故事管理
- `/backlog` 产品待办列表与拖拽排序
- `/sprints` 迭代计划管理
- `/board/:sprintId` 迭代看板
- `/burndown/:sprintId` 燃尽图
- `/retrospectives` 回顾列表
- `/retrospectives/:sprintId` 回顾填写页

## 5. 本地启动

### 5.1 启动后端

```powershell
cd backend
npm install
npm run dev
```

默认地址：`http://127.0.0.1:3000`

### 5.2 启动前端

```powershell
cd frontend
npm install
npm run dev
```

默认地址：`http://127.0.0.1:5173`

## 6. 测试与构建

### 后端接口测试

```powershell
cd backend
npm test
```

### 前端构建验证

```powershell
cd frontend
npm run build
```

## 7. 当前完成度

按照课程文档对应的阶段，大致完成情况如下：

- P0 项目初始化：已完成
- P1 后端基础与数据持久化：已完成
- P2 前端基础框架：已完成
- P3 核心模块开发：已完成基础版
- P4 接口测试：已完成核心接口测试
- P5 收尾与可演示化：已完成 README、SQL 脚本、AI 错误修正记录和留痕截图

## 8. 留痕材料

- Git 初始化与阶段提交截图：`Screenshot/`
- AI 错误修正记录：`docs/AI错误修正记录.md`
- 数据库结构脚本：`backend/sql/schema.mysql.sql`

## 9. 建议演示顺序

1. 用户故事管理
2. backlog 拖拽排序
3. 创建迭代并加入故事
4. 看板状态切换
5. 燃尽图查看与重算
6. 回顾填写与历史回顾查看
7. 展示接口测试结果
