# Wu Xing Engine

一个面向手机端的“今日心象”互动网站原型。项目围绕五行与七情设计三种情绪入口：语音输入、面容识情、七情微测，最后统一跳转到随机气象卡结果页。

## 功能

- 首页：展示 IP 形象、三种测评入口和底部导航。
- 说说此刻：语音输入页面，带动态声纹与话题按钮。
- 面容识情：调用浏览器摄像头，进入识别中页面并显示进度。
- 七情微测：左右滑动选择不同情志动漫，确认后查看推荐。
- 气象卡：从七张结果卡中随机展示一张，并支持返回首页。

## 技术栈

- 前端：React、TypeScript、Vite
- 后端：Python、FastAPI
- 部署：Docker、本地静态构建、CloudBase 静态网站托管

## 项目结构

```text
.
├── backend/              # FastAPI 接口与情绪分析占位逻辑
├── frontend/             # React 移动端页面
├── Dockerfile            # 前后端一体化镜像
├── docker-compose.yml    # 本地 Docker 运行
└── README.md
```

## 本地运行前端

```bash
cd frontend
npm install
npm run dev
```

Vite 会输出本地访问地址，通常是：

```text
http://localhost:5173
```

## 本地运行完整项目

先安装后端依赖：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

启动后端：

```bash
uvicorn backend.app.main:app --reload
```

如果只访问前端开发服务，前端会在接口不可用时使用静态兜底数据，仍可完成演示流程。

## Docker 运行

```bash
docker compose up --build
```

打开：

```text
http://localhost:8000
```

Docker 会先构建前端静态文件，再由 FastAPI 托管前端页面和 API。

## 静态部署

项目可以只部署前端静态版，适合 GitHub Pages 或腾讯云 CloudBase 静态网站托管。

构建命令：

```bash
cd frontend
npm install
npm run build
```

构建产物目录：

```text
frontend/dist
```

CloudBase 静态托管部署示例：

```bash
cd frontend
npm run build
npx @cloudbase/cli login
npx @cloudbase/cli hosting deploy dist -e <你的环境ID>
```

静态部署只包含前端页面。语音、面容、七情微测会使用本地静态兜底数据和随机结果卡，适合演示；如果需要真实大模型分析，需要单独部署后端服务。

## 环境变量

Docker 运行时可传入：

```text
OPENAI_API_KEY
```

当前项目已预留大模型 API 接入位置，但演示版不依赖该变量。

## 注意事项

- 不要提交 `frontend/dist`、`node_modules`、`.venv`、`.env` 等本地文件。
- 部署到 CloudBase 静态托管时，只上传 `frontend/dist`。
- 如果使用 Git 仓库部署，构建命令填写 `npm run build`，输出目录填写 `dist`，项目目录选择 `frontend`。
