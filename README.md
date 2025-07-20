<<<<<<< HEAD
# Rotation-Bot
=======
# VIP Rainbow Bot 🌈

A Discord bot that gives VIP users rotating colored names, creating a beautiful rainbow effect!

## ✨ Features

- **VIP Status System**: Grant users special VIP status with `!vipname @user`
- **Rainbow Names**: VIP users get automatically rotating colored roles
- **Customizable Colors**: 8 beautiful default colors (Red, Blue, Yellow, Green, Purple, Orange, Pink, Cyan)
- **Smart Management**: Automatic role creation and cleanup
- **Persistent Data**: VIP status survives bot restarts
- **Rate Limit Safe**: Efficient role management to avoid Discord rate limits
- **Auto-cleanup**: Removes VIP status when users leave the server

## 🚀 Setup

### 1. Prerequisites
- Node.js 16 or higher
- A Discord application/bot token

### 2. Installation
```bash
cd VIP-Rainbow-Bot
npm install
```

### 3. Configuration
1. Copy `.env.example` to `.env`
2. Fill in your bot token and owner ID:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
BOT_OWNER_ID=your_discord_user_id_here
```

### 4. Bot Permissions
Your bot needs these permissions:
- `Manage Roles` - To create and assign color roles
- `Send Messages` - To respond to commands
- `Read Message History` - To see commands

### 5. Start the Bot
```bash
npm start
```

## 🎮 Commands

### `!vipname @user`
Grants VIP status to the mentioned user. They will immediately start getting rotating colored names!

**Example:**
```
!vipname @John#1234
```

### `!vipname remove @user`
Removes VIP status from the mentioned user and cleans up their color roles.

**Example:**
```
!vipname remove @John#1234
```

## 🎨 How It Works

1. **Role Creation**: When the bot joins a server, it automatically creates 8 colored VIP roles
2. **VIP Assignment**: When you grant someone VIP status, they're added to the rotation system
3. **Color Rotation**: Every 2 seconds, VIP users get their current color role removed and the next color added
4. **Cycling Effect**: This creates a smooth rainbow name effect as colors continuously change

## ⚙️ Configuration Options

You can customize these settings in your `.env` file:

| Setting | Default | Description |
|---------|---------|-------------|
| `ROTATION_INTERVAL` | `2000` | Milliseconds between color changes |
| `MAX_VIP_USERS` | `50` | Maximum VIP users per server |
| `BOT_PREFIX` | `!` | Command prefix |
| `COMMAND_NAME` | `vipname` | Command name |

## 🛡️ Permissions

Only these users can grant/remove VIP status:
- Bot owner (set in `BOT_OWNER_ID`)
- Users with Administrator permission in the server

## 📁 File Structure

```
VIP-Rainbow-Bot/
├── index.js           # Main bot code
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .env              # Your configuration (create this)
├── data/             # Persistent data storage
│   ├── vip_users.json    # VIP user tracking
│   └── guild_settings.json # Server settings
└── README.md         # This file
```

## 🎨 Default Colors

The bot creates these beautiful color roles:
- 🔴 VIP-Red (`#FF0000`)
- 🔵 VIP-Blue (`#0000FF`) 
- 🟡 VIP-Yellow (`#FFFF00`)
- 🟢 VIP-Green (`#00FF00`)
- 🟣 VIP-Purple (`#800080`)
- 🟠 VIP-Orange (`#FFA500`)
- 🩷 VIP-Pink (`#FFC0CB`)
- 🩵 VIP-Cyan (`#00FFFF`)

## 🔧 Troubleshooting

### Bot not creating roles?
- Check that the bot has `Manage Roles` permission
- Ensure the bot's role is higher than the VIP color roles in the server hierarchy

### Colors not changing?
- Verify the bot is online and connected
- Check console for any error messages
- Make sure the user still has VIP status

### Command not working?
- Ensure you have Administrator permission or are the bot owner
- Check that the command syntax is correct: `!vipname @user`

## 📊 Performance

- **Memory Usage**: Very low - only stores user IDs and role IDs
- **Rate Limits**: Smart role management prevents Discord rate limiting
- **Scalability**: Can handle up to 50 VIP users per server (configurable)

## 🛠️ Development

### Running in development mode:
```bash
npm run dev
```

This uses nodemon for automatic restarts when you make changes.

### Log Output
The bot provides detailed console logging:
- ✅ Successful operations (green)
- ⚠️ Warnings (yellow) 
- ❌ Errors (red)
- 🌈 VIP-related actions
- 🔧 Setup and configuration

## 📝 License

MIT License - feel free to modify and use however you want!

## 🎉 Enjoy!

Your VIP users will love their fancy rainbow names! The smooth color transitions create a really cool effect that makes VIP status feel special and exclusive.

For questions or issues, check the console output - the bot provides detailed logging to help troubleshoot any problems.
>>>>>>> f34ce60 (rotation bot)
