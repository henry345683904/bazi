# 八字网页 GitHub Pages 发布说明

发布仓库：
`https://github.com/henry345683904/bazi`

## 发布文件

仓库根目录需要这些文件：

- `index.html`
- `bazi-fortune-optimized.html`
- `bazi-knowledge-base.json`
- `number-knowledge-base.json`
- `bazi-supabase-schema.sql`
- `CNAME`

## GitHub Pages

1. 进入仓库 `Settings` -> `Pages`。
2. `Build and deployment` 选择 `Deploy from a branch`。
3. `Branch` 选择 `main`，目录选择 `/root`，保存。
4. GitHub Pages 地址：
   `https://henry345683904.github.io/bazi/`
5. 当前仓库已绑定自定义域名：
   `https://myfate.nz/`

## Supabase 登录和记录

由于 Supabase 免费项目数量已到上限，八字网页暂时复用 `HAPPY FARM` Supabase 项目：

- Project ref: `gxgeakhhqfhgcsgmmocj`
- Project URL: `https://gxgeakhhqfhgcsgmmocj.supabase.co`
- 八字记录表：`public.bazi_query_records`

八字数据和农场数据不共用表。八字网页只读写 `bazi_query_records`，并通过 RLS 限制每个用户只能访问自己的记录。

首次配置时，在 `HAPPY FARM` 项目的 Supabase SQL Editor 运行一次 `bazi-supabase-schema.sql`。

Authentication 设置：

1. 在 `Authentication -> Providers` 确认 Email 已启用。
2. Google 登录需要先在 Google Cloud 配好 OAuth，再在 Supabase Providers 启用 Google。
3. 在 `Authentication -> URL Configuration` 添加 Redirect URLs：
   - `https://myfate.nz/**`
   - `https://henry345683904.github.io/bazi/**`

邮箱确认开启时，新用户注册后需要先点击验证邮件。
