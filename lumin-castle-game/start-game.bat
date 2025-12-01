@echo off
echo 正在启动 LUMIN城堡 游戏服务器...
echo.
echo 游戏将在浏览器中自动打开
echo 如果没有自动打开，请手动访问: http://localhost:8000
echo.
echo 按 Ctrl+C 停止服务器
echo.

cd /d "%~dp0"
python -m http.server 8000

pause