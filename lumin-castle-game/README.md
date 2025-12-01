# LUMIN城堡游戏

这是一个经过汉化的益智解谜游戏，原名为Super Castle Game。

## 如何运行

### 方法一：使用启动脚本（推荐）

**Windows用户：**
- 双击运行 `start-game.bat` 文件
- 服务器将自动启动并在浏览器中打开游戏

**跨平台用户：**
- 在命令行中运行：`node server.js`
- 然后在浏览器中访问 http://localhost:8000

### 方法二：使用本地服务器

**Python 3:**
```bash
python -m http.server 8000
```

**Node.js:**
```bash
npx serve .
```

**然后在浏览器中访问：**
http://localhost:8000

### 方法三：直接打开HTML文件
⚠️ 注意：直接双击 `index.html` 可能因CORS策略被阻止，建议使用方法一或二。

## 快速开始

1. 下载游戏文件夹
2. 双击运行 `start-game.bat`（Windows）或 `node server.js`（其他系统）
3. 等待浏览器自动打开游戏页面
4. 开始游戏！

## 游戏操作

- 使用方向键移动鸭子
- 或者点击屏幕控制
- 连接鸭子获得更多鸭子
- 将所有鸭子移到目标位置即可过关

## 汉化内容

- 游戏标题：SUPER CASTLE GAME → LUMIN城堡
- 关卡选择文本：CLICK HERE FOR MORE LEVELS → LUMIN由爱制造
- 关卡编号：A, B, C... → 1, 2, 3...
- 使用现代字体替代像素字体，视觉效果更佳

## 文件说明

- `index.html` - 主页面
- `app.js` - 游戏主逻辑（包含汉化内容）
- `app.css` - 样式文件
- `start-game.bat` - Windows一键启动脚本
- `server.js` - 跨平台Node.js服务器脚本
- `audio/` - 音频文件目录
- `pictures/` - 关卡数据文件目录

## 故障排除

### 端口占用错误
如果遇到 "EADDRINUSE: address already in use :::8000" 错误：
1. 停止所有node进程：`taskkill /f /im node.exe`
2. 或者使用其他端口：`python -m http.server 3000`

### CORS错误
如果遇到CORS错误：
1. 确保使用HTTP服务器而不是直接打开HTML文件
2. 检查防火墙是否阻止了8000端口
3. 尝试使用不同的端口：`python -m http.server 3000`

### 游戏无法启动
1. 确保已安装Node.js（推荐v14+）
2. 检查8000端口是否被其他程序占用
3. 尝试使用管理员权限运行

## 完整汉化内容

✅ 游戏标题：SUPER CASTLE GAME → LUMIN城堡
✅ 关卡选择：CLICK HERE FOR MORE LEVELS → LUMIN由爱制造
✅ 关卡编号：A,B,C... → 1,2,3...
✅ 字体系统：现代Canvas文本渲染

祝您游戏愉快！🎮