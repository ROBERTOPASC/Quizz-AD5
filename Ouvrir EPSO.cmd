@echo off
cd /d "%~dp0"
node scripts/open-epso.mjs
if errorlevel 1 pause
