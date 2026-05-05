# 天命筆相 総合鑑定アプリ

四柱推命・姓名判断・天命筆相（天命筆相）三法統合占いアプリ  
**System developed by RingMoo（輪夢）**

---

## 🚀 Vercel へのデプロイ手順

### 前提条件
- [Node.js](https://nodejs.org/) 18以上がインストールされていること
- [Git](https://git-scm.com/) がインストールされていること
- [GitHub](https://github.com/) アカウント
- [Vercel](https://vercel.com/) アカウント（無料）
- [Anthropic](https://console.anthropic.com/) APIキー

---

### ① APIキーの取得

1. https://console.anthropic.com/ にアクセス
2. アカウント作成 / ログイン
3. 左メニュー「API Keys」→「Create Key」
4. 生成されたキー（`sk-ant-...`）をコピーして保存

---

### ② プロジェクトのセットアップ

```bash
# このフォルダに移動
cd tenmei-hissou

# 依存パッケージをインストール
npm install

# 動作確認（ローカル開発）
# .env.local ファイルを作成
echo "ANTHROPIC_API_KEY=sk-ant-あなたのAPIキー" > .env.local

# 開発サーバー起動
npm run dev
# → http://localhost:5173 でアクセス可能
```

---

### ③ GitHub にプッシュ

```bash
# Gitリポジトリを初期化
git init
git add .
git commit -m "first commit"

# GitHubで新しいリポジトリを作成後
git remote add origin https://github.com/あなたのユーザー名/tenmei-hissou.git
git branch -M main
git push -u origin main
```

---

### ④ Vercel にデプロイ

1. https://vercel.com/ にログイン
2. 「New Project」をクリック
3. GitHubリポジトリ「tenmei-hissou」を選択
4. 「Import」をクリック
5. **Environment Variables（環境変数）** を設定：
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-あなたのAPIキー`
6. 「Deploy」をクリック
7. デプロイ完了！URLが発行されます（例：`https://tenmei-hissou-xxx.vercel.app`）

---

### ⑤ カスタムドメインの設定（任意）

1. Vercel ダッシュボード → プロジェクト → 「Settings」→「Domains」
2. 取得済みドメインを入力して追加
3. DNSの設定をドメイン会社で行う

---

## 📁 プロジェクト構成

```
tenmei-hissou/
├── api/
│   └── chat.js          # Vercel Serverless Function（APIキー保護プロキシ）
├── src/
│   ├── main.jsx         # Reactエントリーポイント
│   └── App.jsx          # メインアプリ（天命筆相 全機能）
├── public/              # 静的ファイル（favicon等）
├── index.html           # HTMLテンプレート
├── package.json
├── vite.config.js
├── vercel.json          # Vercel設定
├── .env.example         # 環境変数のサンプル
└── .gitignore
```

---

## 🔒 セキュリティについて

- APIキーは `api/chat.js`（サーバーサイド）でのみ使用されます
- フロントエンド（ブラウザ）にはAPIキーは一切公開されません
- `/api/chat` エンドポイントが Anthropic API へのプロキシとして機能します

---

## 💰 コスト目安

| 項目 | 内容 |
|------|------|
| Vercel ホスティング | 無料プランで運用可能 |
| Anthropic API | 1回の鑑定あたり約 $0.01〜$0.03 程度 |
| 月間100名利用 | 約 $1〜$3 程度 |

---

## 📞 サポート

System developed by **RingMoo（輪夢）**  
天命筆相は輪夢が開発した独自の筆跡鑑定手法です。
