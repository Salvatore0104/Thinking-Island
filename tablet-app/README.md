# 思维岛平板应用

一个无需登录、面向4–6岁儿童的本地思维课程应用。

## 当前内容

- 10个能力类别，每类80题，共800道图片式逻辑题
- 主页只显示10张类别卡片，并记录每类当前做到的题目
- 分类、规律、类比、排序、空间、数量、图形、工作记忆、规则控制与综合逻辑
- 儿童端采用大图标选项和极短文字，完整任务由普通话语音讲解
- 普通话语音开场、任务朗读、分级提示、正确解释和鼓励反馈
- 儿童课程地图、家长中心、阶段报告和离屏任务
- 学习进度只保存在当前浏览器的 `localStorage`

## 本地运行

需要 Node.js 22.13或更高版本。

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址，通常为：

```text
http://localhost:3000
```

应用不需要账号、登录、数据库或云服务。

## 生成语音

首次准备环境：

```powershell
python -m venv .voice-venv
.\.voice-venv\Scripts\python.exe -m pip install edge-tts==7.2.3
```

生成缺失音频：

```powershell
.\.voice-venv\Scripts\python.exe scripts\generate_voice.py
```

重新生成全部音频：

```powershell
.\.voice-venv\Scripts\python.exe scripts\generate_voice.py --force
```

生成脚本会从 `app/page.tsx` 提取课程文字，将音频和可复查的文字清单写入 `public/audio/`。网页运行时只读取静态MP3，不会实时连接文字转语音服务。

## 构建检查

```bash
pnpm build
```

## 数据说明

- 不收集儿童姓名、照片或录音
- 不包含广告、聊天或公开排名
- 清除浏览器站点数据会同时清除学习进度
- 若换设备，需要重新开始；当前版本不做云同步
