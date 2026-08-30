const API_BASE = "/api";

async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("lq_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const api = {
  parentSignup: (payload) => apiRequest("/auth/parent/signup", { method: "POST", body: payload, auth: false }),
  parentLogin: (payload) => apiRequest("/auth/parent/login", { method: "POST", body: payload, auth: false }),
  childCreate: (payload) => apiRequest("/auth/child/create", { method: "POST", body: payload }),
  childList: () => apiRequest("/auth/child/list"),
  childLogin: (payload) => apiRequest("/auth/child/login", { method: "POST", body: payload, auth: false }),

  childMe: () => apiRequest("/child/me"),
  childUpdate: (payload) => apiRequest("/child/me", { method: "PUT", body: payload }),

  questions: (subject, count = 3) => apiRequest(`/questions?subject=${encodeURIComponent(subject)}&count=${count}`),

  gateAttempt: (payload) => apiRequest("/game/gate/attempt", { method: "POST", body: payload }),

  rewards: () => apiRequest("/rewards"),
  rewardUnlock: (id) => apiRequest(`/rewards/${id}/unlock`, { method: "POST" }),

  parentDashboard: (childId) => apiRequest(`/parent/dashboard/${childId}`),
  parentAssignTask: (payload) => apiRequest("/parent/tasks", { method: "POST", body: payload }),
  parentTaskList: (childId) => apiRequest(`/parent/tasks/${childId}`),

  myTasks: () => apiRequest("/tasks/mine"),
  completeTask: (id) => apiRequest(`/tasks/${id}/complete`, { method: "POST" }),
};

function requireChildAuth() {
  if (!localStorage.getItem("lq_token") || localStorage.getItem("lq_role") !== "child") {
    window.location.href = "child-login.html";
  }
}

function requireParentAuth() {
  if (!localStorage.getItem("lq_token") || localStorage.getItem("lq_role") !== "parent") {
    window.location.href = "parent.html";
  }
}

function saveSession(token, role) {
  localStorage.setItem("lq_token", token);
  localStorage.setItem("lq_role", role);
}

function clearSession() {
  localStorage.removeItem("lq_token");
  localStorage.removeItem("lq_role");
}

function showToast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
