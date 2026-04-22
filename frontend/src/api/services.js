import client from "./client.js";

export const api = {
  getMeta() {
    return client.get("/meta");
  },
  getStories(params) {
    return client.get("/stories", { params });
  },
  createStory(payload) {
    return client.post("/stories", payload);
  },
  updateStory(id, payload) {
    return client.put(`/stories/${id}`, payload);
  },
  deleteStory(id) {
    return client.delete(`/stories/${id}`);
  },
  reorderStories(items) {
    return client.patch("/stories/reorder", { items });
  },
  updateStoryStatus(id, status) {
    return client.patch(`/stories/${id}/status`, { status });
  },
  updateStorySprint(id, sprintId) {
    return client.patch(`/stories/${id}/sprint`, { sprintId });
  },
  getBacklog(filter = "all") {
    return client.get("/backlog", { params: { filter } });
  },
  getSprints() {
    return client.get("/sprints");
  },
  getSprint(id) {
    return client.get(`/sprints/${id}`);
  },
  createSprint(payload) {
    return client.post("/sprints", payload);
  },
  updateSprint(id, payload) {
    return client.put(`/sprints/${id}`, payload);
  },
  deleteSprint(id) {
    return client.delete(`/sprints/${id}`);
  },
  assignStoriesToSprint(id, storyIds) {
    return client.post(`/sprints/${id}/stories`, { storyIds });
  },
  getBoard(id) {
    return client.get(`/sprints/${id}/board`);
  },
  getBurndown(id) {
    return client.get(`/sprints/${id}/burndown`);
  },
  recalculateBurndown(id) {
    return client.post(`/sprints/${id}/burndown/recalculate`);
  },
  getRetrospectives() {
    return client.get("/retrospectives");
  },
  getRetrospectiveBySprint(sprintId) {
    return client.get(`/retrospectives/${sprintId}`);
  },
  saveRetrospective(payload) {
    return client.post("/retrospectives", payload);
  },
  updateRetrospective(id, payload) {
    return client.put(`/retrospectives/${id}`, payload);
  }
};
