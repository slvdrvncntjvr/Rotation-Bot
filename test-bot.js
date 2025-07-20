const fs = require('fs');
const path = require('path');

// Test script to validate bot configuration and potential issues
console.log('🧪 VIP Rainbow Bot - Health Check\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
require('dotenv').config();
const token = process.env.DISCORD_BOT_TOKEN;
const ownerId = process.env.BOT_OWNER_ID;
const rotationInterval = process.env.ROTATION_INTERVAL || '5000';
const maxVipUsers = process.env.MAX_VIP_USERS || '50';

console.log(`   ✅ Bot Token: ${token ? 'Present' : '❌ Missing'}`);
console.log(`   ✅ Owner ID: ${ownerId || '❌ Missing'}`);
console.log(`   ✅ Rotation Interval: ${rotationInterval}ms`);

// Check timing recommendations
const intervalMs = parseInt(rotationInterval);
if (intervalMs < 3000) {
    console.log('   ⚠️ Warning: Rotation interval is very fast (<3s) - may cause rate limits');
} else if (intervalMs >= 6000) {
    console.log('   ✅ Good: Rotation interval is optimal for rainbow effect');
} else {
    console.log('   ⚠️ Consider: 6+ seconds provides better stability while maintaining effect');
}

console.log(`   ✅ Max VIP Users: ${maxVipUsers}`);

// 2. Check dependencies
console.log('\n2. Dependencies:');
try {
    const discordjs = require('discord.js');
    console.log(`   ✅ discord.js: v${discordjs.version || 'unknown'}`);
} catch (error) {
    console.log('   ❌ discord.js: Not installed');
}

try {
    require('dotenv');
    console.log('   ✅ dotenv: Installed');
} catch (error) {
    console.log('   ❌ dotenv: Not installed');
}

// 3. Check data directory
console.log('\n3. Data Directory:');
const dataPath = path.join(__dirname, 'data');
if (fs.existsSync(dataPath)) {
    console.log('   ✅ Data directory exists');
    const files = fs.readdirSync(dataPath);
    console.log(`   📁 Files: ${files.length > 0 ? files.join(', ') : 'Empty'}`);
} else {
    console.log('   ⚠️ Data directory will be created on first run');
}

// 4. Check permissions setup
console.log('\n4. Discord Permissions Required:');
const { PermissionFlagsBits } = require('discord.js');
const requiredPerms = [
    { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles },
    { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
    { name: 'Read Message History', flag: PermissionFlagsBits.ReadMessageHistory }
];

requiredPerms.forEach(perm => {
    console.log(`   📋 ${perm.name}: ${perm.flag.toString()}`);
});

// 5. Check bot invite URL
console.log('\n5. Bot Invite URL:');
if (token) {
    try {
        // Extract bot ID from token (first part before the dot)
        const botId = Buffer.from(token.split('.')[0], 'base64').toString();
        const permissions = requiredPerms.reduce((sum, perm) => sum + BigInt(perm.flag), 0n);
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=${permissions}&scope=bot`;
        console.log(`   🔗 ${inviteUrl}`);
    } catch (error) {
        console.log('   ❌ Could not generate invite URL - invalid token format');
    }
} else {
    console.log('   ❌ Cannot generate invite URL - no token provided');
}

// 6. Syntax check
console.log('\n6. Syntax Check:');
try {
    // Don't actually start the bot, just check if it can be required
    const childProcess = require('child_process');
    const result = childProcess.execSync('node -c index.js', { encoding: 'utf8' });
    console.log('   ✅ Syntax OK');
} catch (error) {
    console.log(`   ❌ Syntax Error: ${error.message}`);
}

console.log('\n🎉 Health check complete!');
console.log('\n💡 To start the bot: npm start');
console.log('💡 To run in development mode: npm run dev');
console.log('💡 To debug role assignments: node debug-roles.js');

console.log('\n🌈 Rainbow Effect Tips:');
console.log('   • 6+ second intervals provide smooth rainbow effect');
console.log('   • Users should only have ONE color role at a time');
console.log('   • Bot role must be ABOVE VIP color roles in hierarchy');
console.log('   • Use debug-roles.js to check for multiple role issues');
