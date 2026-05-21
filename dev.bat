@echo off
set "PATH=%APPDATA%\nvm\nodejs;%PATH%"
cd /d "%~dp0"
node node_modules\vite\bin\vite.js --port 5174
