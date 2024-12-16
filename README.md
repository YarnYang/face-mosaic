# 合照贴纸工具

这是一个简单的网页应用，可以自动检测合照中的人脸并添加贴纸。

## 功能特点

- 上传照片
- 自动检测人脸
- 选择贴纸
- 自动将贴纸应用到所有检测到的人脸上
- 保存编辑后的图片

## 使用说明

1. 克隆或下载本项目
2. 下载face-api.js模型文件:
   - 访问 https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   - 下载 `tiny_face_detector_model-weights_manifest.json` 和 `tiny_face_detector_model-shard1`
   - 将这些文件放在项目的 `models` 目录下

3. 准备贴纸图片:
   - 将你想要使用的贴纸图片放在 `stickers` 目录下
   - 支持PNG格式（推荐使用透明背景）

4. 使用本地服务器运行项目:
   - 可以使用 Python 的简单 HTTP 服务器:
     ```bash
     python -m http.server 8000
     ```
   - 或者使用 VS Code 的 Live Server 插件

5. 在浏览器中访问 `http://localhost:8000`

## 注意事项

- 请确保照片清晰，人脸朝向正面效果最好
- 建议使用现代浏览器（Chrome、Firefox、Safari 等）
- 贴纸图片最好是正方形，且大小适中

## 技术栈

- HTML5
- CSS3
- JavaScript
- face-api.js (人脸检测)
