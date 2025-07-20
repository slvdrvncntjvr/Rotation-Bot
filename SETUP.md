# VIP Rainbow Bot - Setup Guide 🌈

## Quick Start

### 1. Install Dependencies
```bash
cd VIP-Rainbow-Bot
npm install
```

### 2. Configure Bot
1. Copy `.env.example` to `.env`
2. Get your Discord bot token from https://discord.com/developers/applications
3. Fill in the `.env` file:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
BOT_OWNER_ID=your_discord_user_id_here
ROTATION_INTERVAL=2000
MAX_VIP_USERS=50
BOT_PREFIX=!
COMMAND_NAME=vipname
```

### 3. Invite Bot to Server
Use this permission calculator: https://discordapi.com/permissions.html

**Required Permissions:**
- Manage Roles (268435456)
- Send Messages (2048)
- Read Message History (65536)

**Invite URL format:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=268500992&scope=bot
```

### 4. Start the Bot

**Windows:**
```cmd
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Or manually:**
```bash
node index.js
```

## 🎮 Usage

### Grant VIP Status
```
!vipname @username
```

### Remove VIP Status  
```
!vipname remove @username
```

### Check Status
The bot will automatically show VIP count in its status!

## 🎨 How It Works

1. **Setup Phase**: Bot creates 8 colored roles when it joins a server
2. **VIP Assignment**: Use `!vipname @user` to give someone VIP status
3. **Color Rotation**: Every 2 seconds, VIP users cycle through colors:
   - Red → Blue → Yellow → Green → Purple → Orange → Pink → Cyan → Red...
4. **Cleanup**: Automatically removes VIP status when users leave

## 🛡️ Permissions

**Who can use VIP commands:**
- Bot owner (set in BOT_OWNER_ID)
- Users with Administrator permission

**Bot needs these permissions:**
- Manage Roles (to create and assign color roles)
- Send Messages (to respond to commands)
- Read Message History (to see commands)

## 📊 Features

- ✅ **Persistent Storage** - VIP status survives restarts
- ✅ **Rate Limit Safe** - Smart role management
- ✅ **Auto Cleanup** - Removes VIP when users leave
- ✅ **Multi-Server** - Works in multiple servers simultaneously
- ✅ **Configurable** - Customize colors, timing, limits
- ✅ **Logging** - Detailed console output for debugging

## 🎨 Color Customization

Want different colors? Edit the `defaultColors` array in `index.js`:

```javascript
this.defaultColors = [
    { name: 'VIP-Red', color: '#FF0000' },
    { name: 'VIP-Blue', color: '#0000FF' },
    // Add your own colors here!
    { name: 'VIP-Custom', color: '#123456' }
];
```

## 🔧 Troubleshooting

### "Missing Manage Roles permission"
- Check bot role hierarchy - bot role must be above VIP color roles
- Verify bot has "Manage Roles" permission

### "Colors not changing"
- Check console for errors
- Verify users have VIP status: VIP users will have one of the VIP-Color roles

### "Command not working"
- Make sure you have Administrator permission or are the bot owner
- Check command syntax: `!vipname @user` (with space between command and mention)

### "Bot not responding"
- Check bot is online in server member list
- Verify bot can read messages in the channel
- Check console for connection errors

## 📈 Performance Tips

1. **Role Hierarchy**: Keep bot role near top of role list
2. **VIP Limits**: Default 50 VIP users per server prevents rate limits
3. **Timing**: 2-second intervals are optimal for smooth effect without spam

## 🚀 Production Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

### Using systemd (Linux)
Create `/etc/systemd/system/vip-rainbow-bot.service`:
```ini
[Unit]
Description=VIP Rainbow Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/VIP-Rainbow-Bot
ExecStart=/usr/bin/node index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable vip-rainbow-bot
sudo systemctl start vip-rainbow-bot
```

## 🎉 Enjoy!

Your VIP users will love their fancy rainbow names! The smooth color transitions create a really cool effect that makes VIP status feel special and exclusive.
