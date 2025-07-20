const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class VIPRainbowBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        // Configuration
        this.prefix = process.env.BOT_PREFIX || '!';
        this.commandName = process.env.COMMAND_NAME || 'vipname';
        this.rotationInterval = parseInt(process.env.ROTATION_INTERVAL) || 2000; // 2 seconds
        this.maxVipUsers = parseInt(process.env.MAX_VIP_USERS) || 50;
        this.ownerId = process.env.BOT_OWNER_ID;

        // Data storage
        this.dataPath = path.join(__dirname, 'data');
        this.vipDataPath = path.join(this.dataPath, 'vip_users.json');
        this.guildDataPath = path.join(this.dataPath, 'guild_settings.json');

        // VIP tracking
        this.vipUsers = new Map(); // guildId -> Set of userIds
        this.guildSettings = new Map(); // guildId -> { colorRoles: [], currentIndex: Map }
        this.rotationTimers = new Map(); // guildId -> interval timer
        this.currentRoleIndex = new Map(); // guildId -> Map(userId -> currentColorIndex)

        // Default color roles to create
        this.defaultColors = [
            { name: 'VIP-Red', color: '#FF0000' },
            { name: 'VIP-Blue', color: '#0000FF' },
            { name: 'VIP-Yellow', color: '#FFFF00' },
            { name: 'VIP-Green', color: '#00FF00' },
            { name: 'VIP-Purple', color: '#800080' },
            { name: 'VIP-Orange', color: '#FFA500' },
            { name: 'VIP-Pink', color: '#FFC0CB' },
            { name: 'VIP-Cyan', color: '#00FFFF' }
        ];

        this.setupDirectories();
        this.loadData();
        this.setupEventHandlers();
    }

    setupDirectories() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }

    loadData() {
        try {
            // Load VIP users
            if (fs.existsSync(this.vipDataPath)) {
                const data = JSON.parse(fs.readFileSync(this.vipDataPath, 'utf8'));
                Object.entries(data).forEach(([guildId, userIds]) => {
                    this.vipUsers.set(guildId, new Set(userIds));
                });
                console.log(`Loaded VIP data for ${this.vipUsers.size} guilds`);
            }

            // Load guild settings
            if (fs.existsSync(this.guildDataPath)) {
                const data = JSON.parse(fs.readFileSync(this.guildDataPath, 'utf8'));
                Object.entries(data).forEach(([guildId, settings]) => {
                    this.guildSettings.set(guildId, {
                        colorRoles: settings.colorRoles || [],
                        currentIndex: new Map(settings.currentIndex || [])
                    });
                });
                console.log(`Loaded guild settings for ${this.guildSettings.size} guilds`);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            // Save VIP users
            const vipData = {};
            this.vipUsers.forEach((userSet, guildId) => {
                vipData[guildId] = Array.from(userSet);
            });
            fs.writeFileSync(this.vipDataPath, JSON.stringify(vipData, null, 2));

            // Save guild settings
            const guildData = {};
            this.guildSettings.forEach((settings, guildId) => {
                guildData[guildId] = {
                    colorRoles: settings.colorRoles,
                    currentIndex: Array.from(settings.currentIndex.entries())
                };
            });
            fs.writeFileSync(this.guildDataPath, JSON.stringify(guildData, null, 2));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    setupEventHandlers() {
        this.client.on('ready', () => this.onReady());
        this.client.on('messageCreate', (message) => this.onMessage(message));
        this.client.on('guildCreate', (guild) => this.onGuildJoin(guild));
        this.client.on('guildMemberRemove', (member) => this.onMemberLeave(member));
        
        // Graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    async onReady() {
        console.log(`🌈 VIP Rainbow Bot is ready! Logged in as ${this.client.user.tag}`);
        console.log(`📊 Serving ${this.client.guilds.cache.size} guilds`);

        // Set bot status
        this.client.user.setActivity('VIP Rainbow Names 🌈', { type: 'WATCHING' });

        // Initialize all guilds
        for (const guild of this.client.guilds.cache.values()) {
            await this.initializeGuild(guild);
        }

        // Start rotation for guilds with VIP users
        this.startAllRotations();
    }

    async initializeGuild(guild) {
        try {
            console.log(`🔧 Initializing guild: ${guild.name}`);
            
            // Ensure we have guild settings
            if (!this.guildSettings.has(guild.id)) {
                this.guildSettings.set(guild.id, {
                    colorRoles: [],
                    currentIndex: new Map()
                });
            }

            // Create color roles if they don't exist
            await this.ensureColorRoles(guild);
            
        } catch (error) {
            console.error(`Error initializing guild ${guild.name}:`, error);
        }
    }

    async ensureColorRoles(guild) {
        const settings = this.guildSettings.get(guild.id);
        const existingRoles = new Set(settings.colorRoles);
        const botMember = guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            console.warn(`⚠️ Missing Manage Roles permission in ${guild.name}`);
            return;
        }

        let rolesCreated = 0;
        
        for (const colorConfig of this.defaultColors) {
            // Check if role already exists
            let role = guild.roles.cache.find(r => r.name === colorConfig.name);
            
            if (!role) {
                try {
                    // Create the role
                    role = await guild.roles.create({
                        name: colorConfig.name,
                        color: colorConfig.color,
                        reason: 'VIP Rainbow Bot - Color role for VIP users',
                        mentionable: false,
                        hoist: false
                    });
                    
                    rolesCreated++;
                    console.log(`✅ Created role ${colorConfig.name} in ${guild.name}`);
                } catch (error) {
                    console.error(`❌ Failed to create role ${colorConfig.name} in ${guild.name}:`, error);
                    continue;
                }
            }

            // Add to our tracking if not already there
            if (!existingRoles.has(role.id)) {
                settings.colorRoles.push(role.id);
            }
        }

        if (rolesCreated > 0) {
            console.log(`🎨 Created ${rolesCreated} color roles in ${guild.name}`);
            this.saveData();
        }
    }

    async onMessage(message) {
        if (message.author.bot || !message.guild) return;

        const content = message.content.toLowerCase();
        const command = `${this.prefix}${this.commandName}`;

        if (content.startsWith(command)) {
            await this.handleVipCommand(message);
        }
    }

    async handleVipCommand(message) {
        // Check permissions
        if (!this.isAuthorized(message.author.id, message.member)) {
            return message.reply('❌ You need Administrator permissions or be the bot owner to use this command!');
        }

        const args = message.content.split(/\s+/);
        if (args.length < 2) {
            return message.reply(`📝 Usage: \`${this.prefix}${this.commandName} @user\` or \`${this.prefix}${this.commandName} remove @user\``);
        }

        const isRemove = args[1].toLowerCase() === 'remove';
        const userMention = isRemove ? args[2] : args[1];

        if (!userMention) {
            return message.reply('❌ Please mention a user!');
        }

        // Extract user ID from mention
        const userId = userMention.replace(/[<@!>]/g, '');
        const targetMember = await message.guild.members.fetch(userId).catch(() => null);

        if (!targetMember) {
            return message.reply('❌ User not found in this server!');
        }

        if (isRemove) {
            await this.removeVipUser(message, targetMember);
        } else {
            await this.addVipUser(message, targetMember);
        }
    }

    async addVipUser(message, targetMember) {
        const guildId = message.guild.id;
        
        // Initialize guild VIP set if needed
        if (!this.vipUsers.has(guildId)) {
            this.vipUsers.set(guildId, new Set());
        }

        const vipSet = this.vipUsers.get(guildId);

        // Check if already VIP
        if (vipSet.has(targetMember.id)) {
            return message.reply(`🌈 ${targetMember.displayName} is already a VIP member!`);
        }

        // Check VIP limit
        if (vipSet.size >= this.maxVipUsers) {
            return message.reply(`❌ Maximum VIP users (${this.maxVipUsers}) reached for this server!`);
        }

        // Add to VIP
        vipSet.add(targetMember.id);
        
        // Initialize their color index
        const settings = this.guildSettings.get(guildId);
        if (settings) {
            settings.currentIndex.set(targetMember.id, 0);
        }

        // Save data
        this.saveData();

        // Start rotation for this guild if not already running
        this.startRotation(guildId);

        // Give them their first color immediately
        await this.rotateUserColor(targetMember, guildId);

        message.reply(`🌈 ${targetMember.displayName} is now a VIP member with rainbow name colors!`);
        console.log(`✅ Added VIP: ${targetMember.displayName} in ${message.guild.name}`);
    }

    async removeVipUser(message, targetMember) {
        const guildId = message.guild.id;
        const vipSet = this.vipUsers.get(guildId);

        if (!vipSet || !vipSet.has(targetMember.id)) {
            return message.reply(`❌ ${targetMember.displayName} is not a VIP member!`);
        }

        // Remove from VIP
        vipSet.delete(targetMember.id);

        // Remove their color index
        const settings = this.guildSettings.get(guildId);
        if (settings) {
            settings.currentIndex.delete(targetMember.id);
        }

        // Remove all VIP color roles from user
        await this.removeAllColorRoles(targetMember, guildId);

        // Save data
        this.saveData();

        // Stop rotation if no more VIP users
        if (vipSet.size === 0) {
            this.stopRotation(guildId);
        }

        message.reply(`✅ Removed VIP status from ${targetMember.displayName}`);
        console.log(`❌ Removed VIP: ${targetMember.displayName} in ${message.guild.name}`);
    }

    async removeAllColorRoles(member, guildId) {
        const settings = this.guildSettings.get(guildId);
        if (!settings || !settings.colorRoles.length) return;

        try {
            const rolesToRemove = settings.colorRoles.filter(roleId => 
                member.roles.cache.has(roleId)
            );

            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove, 'VIP Rainbow Bot - Removed VIP status');
            }
        } catch (error) {
            console.error(`Error removing color roles for ${member.displayName}:`, error);
        }
    }

    startRotation(guildId) {
        if (this.rotationTimers.has(guildId)) return; // Already running

        const timer = setInterval(async () => {
            await this.rotateColorsForGuild(guildId);
        }, this.rotationInterval);

        this.rotationTimers.set(guildId, timer);
        console.log(`🔄 Started color rotation for guild ${guildId}`);
    }

    stopRotation(guildId) {
        const timer = this.rotationTimers.get(guildId);
        if (timer) {
            clearInterval(timer);
            this.rotationTimers.delete(guildId);
            console.log(`⏹️ Stopped color rotation for guild ${guildId}`);
        }
    }

    startAllRotations() {
        for (const [guildId, vipSet] of this.vipUsers.entries()) {
            if (vipSet.size > 0) {
                this.startRotation(guildId);
            }
        }
    }

    async rotateColorsForGuild(guildId) {
        const vipSet = this.vipUsers.get(guildId);
        if (!vipSet || vipSet.size === 0) return;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        // Rotate colors for each VIP user
        for (const userId of vipSet) {
            try {
                const member = await guild.members.fetch(userId).catch(() => null);
                if (member) {
                    await this.rotateUserColor(member, guildId);
                }
            } catch (error) {
                console.error(`Error rotating color for user ${userId}:`, error);
            }
        }
    }

    async rotateUserColor(member, guildId) {
        const settings = this.guildSettings.get(guildId);
        if (!settings || !settings.colorRoles.length) return;

        try {
            // Get current color index for this user
            let currentIndex = settings.currentIndex.get(member.id) || 0;
            
            // Remove current color role
            const currentRoleId = settings.colorRoles[currentIndex];
            if (member.roles.cache.has(currentRoleId)) {
                await member.roles.remove(currentRoleId, 'VIP Rainbow Bot - Color rotation');
            }

            // Move to next color
            currentIndex = (currentIndex + 1) % settings.colorRoles.length;
            settings.currentIndex.set(member.id, currentIndex);

            // Add new color role
            const newRoleId = settings.colorRoles[currentIndex];
            const newRole = member.guild.roles.cache.get(newRoleId);
            
            if (newRole) {
                await member.roles.add(newRole, 'VIP Rainbow Bot - Color rotation');
            }

        } catch (error) {
            console.error(`Error rotating color for ${member.displayName}:`, error);
        }
    }

    isAuthorized(userId, member) {
        // Bot owner can always use commands
        if (userId === this.ownerId) return true;
        
        // Check for Administrator permission
        if (member && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        
        return false;
    }

    async onGuildJoin(guild) {
        console.log(`📥 Joined new guild: ${guild.name}`);
        await this.initializeGuild(guild);
    }

    async onMemberLeave(member) {
        const guildId = member.guild.id;
        const vipSet = this.vipUsers.get(guildId);
        
        if (vipSet && vipSet.has(member.id)) {
            // Auto-remove VIP status when member leaves
            vipSet.delete(member.id);
            
            const settings = this.guildSettings.get(guildId);
            if (settings) {
                settings.currentIndex.delete(member.id);
            }
            
            this.saveData();
            
            // Stop rotation if no more VIP users
            if (vipSet.size === 0) {
                this.stopRotation(guildId);
            }
            
            console.log(`🚪 Auto-removed VIP status for ${member.displayName} (left server)`);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down VIP Rainbow Bot...');
        
        // Stop all rotations
        for (const timer of this.rotationTimers.values()) {
            clearInterval(timer);
        }
        
        // Save data
        this.saveData();
        
        // Destroy client
        this.client.destroy();
        
        console.log('✅ Shutdown complete');
        process.exit(0);
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_BOT_TOKEN);
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }
}

// Start the bot
const bot = new VIPRainbowBot();
bot.start();
