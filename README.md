# CCF Timeline - CCF会议/期刊时间线查询

[![CCF Version](https://img.shields.io/badge/CCF-7th%20Edition%20(2026)-blue)](https://www.ccf.org.cn/Academic_Evaluation/By_category/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

双语（中文/English）网页应用，用于查询中国计算机学会（CCF）推荐国际学术会议和期刊的投稿截止时间、Rebuttal时间、录用通知时间和会议召开时间。

A bilingual web app to look up submission deadlines, rebuttal periods, acceptance notifications, and conference dates for CCF-recommended international conferences and journals.

## ✨ Features / 功能

- 🔄 **会议/期刊切换** — 一键切换查看会议或期刊
- 🏷️ **CCF等级筛选** — 按A/B/C等级过滤，支持多选
- 🔍 **实时搜索** — 按名称或缩写快速查找
- 📂 **领域分类** — 按10个CCF领域分类浏览
- 🌐 **中英双语** — 一键切换中文/英文界面
- 🌙 **深色模式** — 自动跟随系统主题
- 📱 **响应式设计** — 完美适配桌面和移动端
- 🏷️ **期刊型会议** — CHES/TCHES等特殊标识

## 🚀 Quick Start / 快速开始

```bash
# 本地运行
cd ccfddl
npx serve .        # 或 python -m http.server 8000
# 打开 http://localhost:8000
```

## 📊 Data / 数据

数据来源：CCF推荐国际学术会议和期刊目录第七版（2026年3月发布）

- 会议: 386个 (A=58, B=132, C=196)
- 期刊: 297个
- 覆盖10个计算机科学领域

## 🛠️ Tech Stack / 技术栈

- 纯 HTML/CSS/JavaScript（无框架依赖）
- JSON数据驱动
- Python脚本（数据清洗和爬取）

## 📂 Project Structure / 项目结构

```
ccfddl/
├── index.html              # 主页面
├── css/style.css           # 样式
├── js/                     # JavaScript模块
│   ├── app.js              # 主入口
│   ├── i18n.js             # 国际化
│   ├── data-loader.js      # 数据加载
│   ├── renderer.js         # 卡片渲染
│   ├── search.js           # 搜索筛选
│   └── timeline.js         # 时间线工具
├── data/                   # JSON数据
│   ├── conferences.json    # 会议数据
│   ├── journals.json       # 期刊数据
│   └── metadata.json       # 元数据
├── scripts/                # Python工具
│   └── build_data.py       # Excel→JSON转换
├── conference_map.xlsx     # 原始会议数据
└── journal_map.xlsx        # 原始期刊数据
```

## 📝 License

MIT
