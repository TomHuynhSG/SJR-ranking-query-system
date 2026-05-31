@echo off
title SJR Ranking Query System
echo =========================================
echo   Starting SJR Ranking Query System...
echo =========================================

:: Change to the directory where this .bat file is located
cd /d "%~dp0"

:: Check if node_modules exists, if not, run npm install
if not exist "node_modules\" (
    echo First time setup: Installing dependencies...
    echo This might take a minute.
    call npm install
)

:: Open the default web browser to the local server
echo Opening browser...
start http://localhost:3000

:: Start the server
echo Starting the Node server...
call npm start

pause
