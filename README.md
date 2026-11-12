# personal-page

個人形象網頁（磷光終端風）+ 訪客留言後端。

讓訪客在幾秒內記住這個人——強烈的視覺識別：磷光綠、精密、深夜工作檯的 CRT 氣質。頁面尾端附有訪客留言表單，留言由後端 API 收進 SQLite 資料庫。

> 產品定位與品牌設定詳見 [PRODUCT.md](PRODUCT.md)

## 專案結構

```
personal-page/
├── index.html              # 前端單頁（純 HTML，無建置流程）
└── backend/                # Express + SQLite 留言 API
    ├── server.js           # API 伺服器
    ├── db.js               # 資料庫操作（node:sqlite）
    ├── .env.example        # 環境變數範本
    └── data/messages.db    # SQLite 檔案（本地執行時產生，不進版控）
```

## 快速開始

### 後端

需求：Node.js 22+（使用內建 `node:sqlite`，零原生依賴）

```bash
cd personal-page/backend
npm install

# （可選）設定環境變數
cp .env.example .env
#   PORT=3000
#   ADMIN_KEY=<你的管理金鑰，正式環境一定要改>

npm start        # 啟動，預設 http://localhost:3000
npm run dev      # 開發模式（檔案變更自動重啟）
```

### 前端

直接用瀏覽器開啟 `personal-page/index.html` 即可；留言功能需先啟動後端。

## API

Base URL：`http://localhost:3000`

| Method | Path            | 說明                             |
| ------ | --------------- | -------------------------------- |
| GET    | `/api/health`   | 健康檢查                         |
| POST   | `/api/messages` | 送出留言（公開）                 |
| GET    | `/api/messages` | 讀取留言列表（需管理金鑰）       |

### 送出留言

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","message":"你好!"}'
```

- 欄位驗證：`name` 1–80 字、`email` 有效格式、`message` 1–2000 字
- 驗證失敗回 `400` 帶 `errors` 物件
- 同時支援 `application/x-www-form-urlencoded`（無 JS 環境的原生表單退化）

### 讀取留言

```bash
curl "http://localhost:3000/api/messages?limit=50&offset=0" \
  -H "x-admin-key: <ADMIN_KEY>"
```

## 資料庫

SQLite（WAL 模式）位於 `backend/data/messages.db`：

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

## 部署注意事項

- 正式環境務必設定 `ADMIN_KEY` 環境變數，不要使用預設的 `dev-admin-key`
- `data/` 目錄與 `.env` 已在 `.gitignore` 中排除，不會被推上 GitHub
- 資料庫檔案會在第一次寫入留言時自動建立

## 授權

MIT
