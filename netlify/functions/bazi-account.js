import { getStore } from "@netlify/blobs";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
};

const STORE_NAME = "bazi-accounts";
const STATE_KEY = "state.json";
const PBKDF2_ROUNDS = 160000;
const MAX_RECORDS = 80;

function json(statusCode, data) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(data)
  };
}

function nowIso() {
  return new Date().toISOString();
}

function newToken(bytes = 32) {
  return randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function normalizeAccount(value) {
  return String(value || "").trim().toLowerCase();
}

function newState() {
  return { version: 1, users: {}, sessions: {} };
}

function normalizeState(value) {
  const state = value && typeof value === "object" ? value : newState();
  if (!state.users || typeof state.users !== "object") state.users = {};
  if (!state.sessions || typeof state.sessions !== "object") state.sessions = {};
  if (!state.version) state.version = 1;
  return state;
}

function getBlobStore() {
  try {
    return getStore(STORE_NAME);
  } catch (error) {
    throw new Error(`Netlify Blobs 未启用：${error.message}`);
  }
}

async function readState() {
  const store = getBlobStore();
  try {
    const state = await store.get(STATE_KEY, { type: "json" });
    return normalizeState(state);
  } catch (error) {
    throw new Error(`读取云端账号库失败：${error.message}`);
  }
}

async function writeState(state) {
  const store = getBlobStore();
  try {
    if (typeof store.setJSON === "function") {
      await store.setJSON(STATE_KEY, state);
    } else {
      await store.set(STATE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    throw new Error(`保存云端账号库失败：${error.message}`);
  }
}

function hashPassword(password, salt) {
  return pbkdf2Sync(String(password || ""), Buffer.from(salt, "base64"), PBKDF2_ROUNDS, 32, "sha256").toString("base64");
}

function passwordMatches(password, user) {
  const expected = Buffer.from(String(user.passwordHash || ""), "base64");
  const actual = Buffer.from(hashPassword(password, user.salt), "base64");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function publicUser(id, user) {
  return {
    id,
    name: user.name,
    createdAt: user.createdAt
  };
}

function getRecords(user) {
  return (Array.isArray(user.records) ? user.records : [])
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, MAX_RECORDS);
}

function safeRecord(record) {
  const source = record && typeof record === "object" ? record : {};
  const state = source.state && typeof source.state === "object" ? source.state : {};
  const birth = state.birth && typeof state.birth === "object" ? state.birth : {};
  const pillars = source.pillars || state.pillars || "";
  const birthText = source.birthText || [birth.date, birth.time].filter(Boolean).join(" ");
  const id = String(source.id || `rec_${Date.now()}_${newToken(8)}`);

  return {
    ...source,
    id,
    createdAt: source.createdAt || nowIso(),
    signature: source.signature || `${birthText}|${pillars}|${source.focus || ""}`,
    title: source.title || source.name || birth.name || birthText || "未命名记录",
    birthText,
    pillars,
    focus: source.focus || "",
    summary: source.summary || ""
  };
}

function saveRecord(state, userId, record) {
  const user = state.users[userId];
  const item = safeRecord(record);
  const signature = item.signature || item.id;
  const records = getRecords(user).filter((entry) => entry.signature !== signature && entry.id !== item.id);
  user.records = [item, ...records].slice(0, MAX_RECORDS);
  state.users[userId] = user;
  return getRecords(user);
}

function getAuth(event, state) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const userId = state.sessions[token];
  if (!userId || !state.users[userId]) return null;
  return { token, userId, user: state.users[userId] };
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    const text = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    return JSON.parse(text || "{}");
  } catch (error) {
    return {};
  }
}

function routeFromEvent(event) {
  const route = event.queryStringParameters?.route || "/ping";
  return route.startsWith("/") ? route : `/${route}`;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(204, {});

  const method = event.httpMethod || "GET";
  const route = routeFromEvent(event);

  try {
    if (route === "/ping" && method === "GET") {
      return json(200, {
        ok: true,
        service: "bazi-account-netlify",
        storage: "netlify-blobs",
        time: nowIso()
      });
    }

    const state = await readState();

    if (route === "/register" && method === "POST") {
      const data = parseBody(event);
      const account = String(data.account || "").trim();
      const password = String(data.password || "");
      const userId = normalizeAccount(account);

      if (account.length < 2) return json(400, { error: "账号至少需要2个字符" });
      if (password.length < 4) return json(400, { error: "密码至少需要4个字符" });
      if (state.users[userId]) return json(400, { error: "账号已存在" });

      const salt = randomBytes(16).toString("base64");
      state.users[userId] = {
        name: account,
        salt,
        passwordHash: hashPassword(password, salt),
        createdAt: nowIso(),
        records: []
      };

      const token = newToken();
      state.sessions[token] = userId;
      await writeState(state);

      return json(200, { token, user: publicUser(userId, state.users[userId]), records: [] });
    }

    if (route === "/login" && method === "POST") {
      const data = parseBody(event);
      const userId = normalizeAccount(data.account);
      const user = state.users[userId];

      if (!user || !passwordMatches(data.password, user)) return json(401, { error: "账号或密码不正确" });

      const token = newToken();
      state.sessions[token] = userId;
      await writeState(state);

      return json(200, { token, user: publicUser(userId, user), records: getRecords(user) });
    }

    if (route === "/logout" && method === "POST") {
      const auth = getAuth(event, state);
      if (auth) {
        delete state.sessions[auth.token];
        await writeState(state);
      }
      return json(200, { ok: true });
    }

    if (route === "/me" && method === "GET") {
      const auth = getAuth(event, state);
      if (!auth) return json(401, { error: "请先登录账号" });
      return json(200, { user: publicUser(auth.userId, auth.user), records: getRecords(auth.user) });
    }

    if (route === "/records" && method === "GET") {
      const auth = getAuth(event, state);
      if (!auth) return json(401, { error: "请先登录账号" });
      return json(200, { records: getRecords(auth.user) });
    }

    if (route === "/records" && method === "POST") {
      const auth = getAuth(event, state);
      if (!auth) return json(401, { error: "请先登录账号" });
      const data = parseBody(event);
      const records = saveRecord(state, auth.userId, data.record);
      await writeState(state);
      return json(200, { records });
    }

    if (route === "/records" && method === "DELETE") {
      const auth = getAuth(event, state);
      if (!auth) return json(401, { error: "请先登录账号" });
      auth.user.records = [];
      state.users[auth.userId] = auth.user;
      await writeState(state);
      return json(200, { records: [] });
    }

    if (route.startsWith("/records/") && method === "DELETE") {
      const auth = getAuth(event, state);
      if (!auth) return json(401, { error: "请先登录账号" });
      const recordId = decodeURIComponent(route.slice("/records/".length));
      auth.user.records = getRecords(auth.user).filter((record) => record.id !== recordId);
      state.users[auth.userId] = auth.user;
      await writeState(state);
      return json(200, { records: getRecords(auth.user) });
    }

    return json(404, { error: `账号接口不存在：${route}` });
  } catch (error) {
    return json(500, {
      error: error.message || "账号服务器返回异常",
      hint: "请确认部署的是整个项目文件夹，并且 Netlify 已安装 package.json 里的 @netlify/blobs。"
    });
  }
}
