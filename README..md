# 项目简介

本项目为三维点云深度估计与可视化系统，包含后端（FoundationStereo）和前端（stereo3d-cloud-web）两部分，支持从双目图片自动推理生成高质量点云、深度图，并提供专业级点云交互与导出体验。

## 整体功能
- 支持上传双目图片，自动推理生成深度图、点云（PLY/TXT）
- 点云可视化，支持三维旋转、缩放、平移、自动居中、全屏、导出等
- 支持多种点云着色模式（原始、统一、高度、距离）
- 支持点云导出（TXT/PLY）、下载、MeshLab 兼容
- 支持深度图、点云的公网访问与分享（ngrok/内网穿透）
- 前后端分离，易于二次开发与部署

## 前端功能（stereo3d-cloud-web）
- 现代化 React+Vite 架构，UI 响应式自适应
- 支持点云三维交互（旋转、缩放、平移、自动缩放、全屏、空格键旋转）
- 点云控制条悬浮，支持点大小、颜色、导出、全屏等操作
- 支持 TXT/PLY 点云渲染与导出，兼容 MeshLab
- 支持深度图、点云结果的可视化与下载
- 支持 ngrok 等公网访问，便于远程演示

## 后端功能（FoundationStereo）
- 基于深度学习的双目立体匹配与点云生成，支持高分辨率推理
- 支持多种模型权重与配置，推理速度快，精度高
- 自动输出深度图（npy/可视化）、点云（PLY/TXT）、可选点云去噪
- RESTful API，支持图片上传、结果下载、CORS 跨域
- 支持内网穿透与公网部署，便于远程调用

---

# 项目部署与启动说明

本项目包含后端（FoundationStereo）和前端（stereo3d-cloud-web），支持三维点云推理与可视化。以下为服务器端一站式启动流程。

---

## 1. 启动后端（FoundationStereo）

### 1.1 环境准备
- 推荐 Ubuntu 20.04/22.04，已安装 Python 3.8+ 和 conda/miniconda

### 1.2 安装依赖（首次部署时执行）
```bash
cd FoundationStereo
conda env create -f environment.yml
conda activate foundationstereo
```

### 1.3 启动后端服务
```bash
export https_proxy="http://10.250.123.226:7897" 
export http_proxy="http://10.250.123.226:7897"
python server.py
```
- 默认监听 5000 端口
- 推理结果（如点云文件）会保存在指定目录

---

## 2. 启动前端（stereo3d-cloud-web）

### 2.1 环境准备
- Node.js 16+，npm 8+

### 2.2 安装依赖（首次部署时执行）
```bash
cd stereo3d-cloud-web
npm install
```

### 2.3 启动前端开发服务器
```bash
npm run dev -- --host
```
- 默认端口 5173
- 访问 http://服务器IP:5173 即可打开前端页面

---

## 3. 内网穿透（公网访问）

### 3.1 安装 ngrok
- [ngrok 官网下载](https://ngrok.com/download)
- 注册 ngrok 账号，获取 authtoken

### 3.2 启动 ngrok 隧道
```bash
ngrok authtoken <你的token>
ngrok http 5173
```
- 启动后会显示一个公网 https 地址，外网可直接访问前端页面

> 如需公网访问后端（如 http://服务器IP:5000），可再开一个 ngrok 隧道：
> ```bash
> ngrok http 5000
> ```

---

## 4. 常见问题

- **前端访问不到后端**：检查端口、ngrok 隧道、防火墙设置，确保后端已启动且允许 CORS。
- **点云显示异常**：请检查点云文件格式，建议优先使用标准 PLY 格式。
- **ngrok 访问慢或不稳定**：可考虑使用 frp、cloudflared 等其他内网穿透工具。

---

如有问题请提交 issue