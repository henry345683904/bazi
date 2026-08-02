# 八字网页 GitHub Pages 发布说明

推荐发布仓库：`https://github.com/henry345683904/bazi`

## 发布文件

仓库根目录需要这些文件：

- `index.html`
- `bazi-fortune-optimized.html`
- `bazi-knowledge-base.json`
- `number-knowledge-base.json`
- `bazi-supabase-schema.sql`

## GitHub Pages

1. 进入仓库 `Settings` -> `Pages`。
2. `Build and deployment` 选择 `Deploy from a branch`。
3. `Branch` 选择 `main`，目录选择 `/root`，保存。
4. 生成的网址通常是：
   `https://henry345683904.github.io/bazi/`

## Supabase 登录和记录

网页已经改为 Supabase 登录和云端记录，不再需要 Netlify Blobs。

1. 在 Supabase SQL Editor 运行 `bazi-supabase-schema.sql`。
2. 在 Authentication -> Providers 确认 Email 和 Google 已启用。
3. 在 Authentication -> URL Configuration 添加：
   - Site URL: `https://henry345683904.github.io/bazi/`
   - Redirect URLs: `https://henry345683904.github.io/bazi/**`

邮箱确认开启时，新用户注册后需要先点击验证邮件。
