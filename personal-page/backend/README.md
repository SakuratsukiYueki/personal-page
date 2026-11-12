# 個人頁後端 API

Express + SQLite(使用 Node 內建 `node:sqlite`,零原生依賴)的訪客留言服務。

## 啟動

```bash
npm install
npm start          # 或 npm run dev(檔案變更自動重啟)
```

設定環境變數(可選):複製 `.env.example` 為 `.env` 後,用 `node --env-file=.env server.js` 啟動。

## API

| Method | Path             | 說明 |
| ------ | ---------------- | ---- |
| GET    | `/api/health`    | 健康檢查 |
| POST   | `/api/messages`  | 送出留言(公開) |
| GET    | `/api/messages`  | 讀取留言列表(需 `x-admin-key` header) |

### POST /api/messages

```json
{ "name": "Ada", "email": "ada@example.com", "message": "你好!" }
```

- `name`:1–80 字(必填)
- `email`:有效格式,最長 254 字(必填)
- `message`:1–2000 字(必填)
- 回傳 `201` 與建立的資料;驗證失敗回 `400` 帶 `errors`
- 同時接受 `application/json` 與 `application/x-www-form-urlencoded`(無 JS 的原生表單退化)

### GET /api/messages

Header 帶 `x-admin-key: <ADMIN_KEY>`,查詢參數:`?limit=50&offset=0`(limit 上限 200)。

## 資料庫

SQLite 檔案位於 `data/messages.db`(WAL 模式),schema:

```sql
CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## 前端串接範例

```js
await fetch("http://localhost:3000/api/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, message }),
});
```
