@echo off
echo 🌈 Starting VIP Rainbow Bot...

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo 📝 Please copy .env.example to .env and configure it
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the bot
echo 🚀 Launching VIP Rainbow Bot...
node index.js

pause
