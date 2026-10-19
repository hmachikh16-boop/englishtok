@echo off
chcp 65001 >nul
title EnglishTok - GitHub updates setup
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\GitHub CLI"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\setup-github-release.ps1"
echo.
echo If the window closed too fast, scroll up to read any error.
pause
