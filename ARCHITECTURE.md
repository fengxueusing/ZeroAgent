# ShortPlayAI - AI 爆款短剧短故事制作器架构文档

## 1. 项目愿景
打造一个全流程自动化的 AI 短视频生产平台，让用户只需输入一个灵感或关键词，即可生成高质量的短剧/短故事视频。

## 2. 技术架构 (Stack)

### 2.1 后端 (Backend)
- **Framework**: FastAPI (Python 3.10+) - 高性能异步框架，适合 I/O 密集型的 AI 任务。
- **Task Queue**: Celery + Redis - 处理耗时的视频渲染和 AI 生成任务。
- **Database**: SQLite (Dev) / PostgreSQL (Prod) - 存储剧本、分镜数据。
- **AI Integration**:
    - **LLM**: LangChain + OpenAI/DeepSeek (剧本生成、分镜拆解)。
    - **Image**: Stable Diffusion WebUI API / ComfyUI / Midjourney Proxy (分镜绘图)。
    - **Audio**: Edge-TTS / CosyVoice (语音合成)。
    - **Video**: MoviePy / FFmpeg (视频合成)。

### 2.2 前端 (Frontend)
- **Framework**: Next.js (React) - 现代化的全栈前端框架。
- **UI Library**: TailwindCSS + Shadcn/ui - 快速构建美观的界面。
- **State Management**: Zustand / TanStack Query。

## 3. 核心模块设计

### 3.1 剧本引擎 (Script Engine)
- **IdeaGenerator**: 创意发散，生成爆款选题。
- **ScriptWriter**: 生成标准剧本结构（开端、发展、高潮、结局）。
- **StoryboardSplitter**: 将剧本拆解为分镜描述（画面、景别、运镜、音效）。

### 3.2 视觉引擎 (Visual Engine)
- **PromptEngineer**: 将分镜描述转化为绘画提示词 (Stable Diffusion Prompts)。
- **ImageGenerator**: 批量生成分镜图，支持一致性控制 (ReferenceNet/IP-Adapter)。

### 3.3 音频引擎 (Audio Engine)
- **VoiceActor**: 多角色语音合成。
- **BGMSelector**: 根据情绪自动匹配背景音乐。

### 3.4 导演引擎 (Director Engine)
- **TimelineManager**: 管理时间轴。
- **VideoComposer**: 渲染最终视频，添加字幕、特效、转场。

## 4. 目录结构

```
ShortPlayAI/
├── backend/            # Python 后端
│   ├── app/
│   │   ├── api/        # API 路由
│   │   ├── core/       # 配置与核心工具
│   │   ├── models/     # 数据库模型
│   │   ├── services/   # 业务逻辑 (LLM, Image, Audio, Video)
│   │   └── utils/      # 通用工具
│   ├── main.py         # 入口文件
│   └── requirements.txt
├── frontend/           # Next.js 前端 (规划中)
├── docs/               # 文档
└── snowtools/          # 研天雪的自动化工具箱
```
