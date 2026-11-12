import express from "express";
import cors from "cors";
import { createMessage, listMessages } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;
// 管理金鑰:設定環境變數 ADMIN_KEY 後,用 x-admin-key header 讀取留言列表
const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin-key";

app.use(cors()); // 讓 personal-page 前端可以跨域呼叫
app.use(express.json({ limit: "16kb" }));
// 無 JS 環境的原生表單退化(enctype 為 urlencoded)
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// ── 健康檢查 ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ── 新增留言(公開)──────────────────────────────────────
app.post("/api/messages", (req, res) => {
  const { name, email, message } = req.body ?? {};
  const errors = {};

  if (!name || typeof name !== "string" || name.trim().length < 1 || name.trim().length > 80) {
    errors.name = "姓名為必填,長度 1-80 字";
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    errors.email = "請提供有效的 email";
  }
  if (!message || typeof message !== "string" || message.trim().length < 1 || message.length > 2000) {
    errors.message = "訊息為必填,長度 1-2000 字";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  const created = createMessage({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(201).json({ ok: true, data: created });
});

// ── 讀取留言(需要 ADMIN_KEY)───────────────────────────
app.get("/api/messages", (req, res) => {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  const { limit, offset, email } = req.query;
  const result = listMessages({ limit, offset });
  if (email) {
    result.rows = result.rows.filter((r) => r.email === String(email).toLowerCase());
  }
  res.json({ ok: true, ...result });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "not found" });
});

// 統一錯誤處理
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`✓ API server listening on http://localhost:${PORT}`);
  console.log(`  POST /api/messages  — 送出留言`);
  console.log(`  GET  /api/messages  — 讀取留言(需 x-admin-key)`);
});
