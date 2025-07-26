const { Client, GatewayIntentBits, PermissionFlagsBits, ActivityType } = require('discord.js');
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
        this.shapeshiftCommandName = 'shapeshiftname';
        this.rotationInterval = parseInt(process.env.ROTATION_INTERVAL) || 5000; // 5 seconds for better stability
        this.shapeshiftInterval = 6000; // 6 seconds for nickname shapeshifting
        this.maxVipUsers = parseInt(process.env.MAX_VIP_USERS) || 50;
        this.ownerId = process.env.BOT_OWNER_ID;

        // Data storage
        this.dataPath = path.join(__dirname, 'data');
        this.vipDataPath = path.join(this.dataPath, 'vip_users.json');
        this.guildDataPath = path.join(this.dataPath, 'guild_settings.json');
        this.shapeshiftDataPath = path.join(this.dataPath, 'shapeshift_users.json');

        // VIP tracking
        this.vipUsers = new Map(); // guildId -> Set of userIds
        this.guildSettings = new Map(); // guildId -> { colorRoles: [], currentIndex: Map }
        this.rotationTimers = new Map(); // guildId -> interval timer

        // Shapeshift tracking
        this.shapeshiftUsers = new Map(); // guildId -> Set of userIds
        this.shapeshiftTimers = new Map(); // guildId -> interval timer
        this.shapeshiftIndex = new Map(); // guildId -> Map(userId -> currentShapeIndex)
        this.originalNicknames = new Map(); // guildId -> Map(userId -> originalNickname)

        // Shapeshift tracking
        this.shapeshiftUsers = new Map(); // guildId -> Set of userIds
        this.shapeshiftTimers = new Map(); // guildId -> interval timer
        this.shapeshiftIndex = new Map(); // guildId -> Map(userId -> currentShapeIndex)
        this.originalNicknames = new Map(); // guildId -> Map(userId -> originalNickname)

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

        // Shapeshift font variations
        this.shapeshiftFonts = [
            { name: 'Normal', transform: (text) => text },
            { name: 'Gothic', transform: (text) => this.toGothic(text) },
            { name: 'Underline', transform: (text) => this.toUnderline(text) },
            { name: 'Squared', transform: (text) => this.toSquared(text) },
            { name: 'Script', transform: (text) => this.toScript(text) },
            { name: 'Bold', transform: (text) => this.toBold(text) }
        ];

        // Shapeshift font variations
        this.shapeshiftFonts = [
            { name: 'Normal', transform: (text) => text },
            { name: 'Gothic', transform: (text) => this.toGothic(text) },
            { name: 'Underline', transform: (text) => this.toUnderline(text) },
            { name: 'Squared', transform: (text) => this.toSquared(text) },
            { name: 'Script', transform: (text) => this.toScript(text) },
            { name: 'Bold', transform: (text) => this.toBold(text) }
        ];

        this.setupDirectories();
        this.loadData();
        this.setupEventHandlers();
    }

    // Font transformation methods for shapeshifting
    toGothic(text) {
        const gothicMap = {
            'a': '𝖆', 'b': '𝖇', 'c': '𝖈', 'd': '𝖉', 'e': '𝖊', 'f': '𝖋', 'g': '𝖌', 'h': '𝖍', 'i': '𝖎', 'j': '𝖏',
            'k': '𝖐', 'l': '𝖑', 'm': '𝖒', 'n': '𝖓', 'o': '𝖔', 'p': '𝖕', 'q': '𝖖', 'r': '𝖗', 's': '𝖘', 't': '𝖙',
            'u': '𝖚', 'v': '𝖛', 'w': '𝖜', 'x': '𝖝', 'y': '𝖞', 'z': '𝖟',
            'A': '𝕬', 'B': '𝕭', 'C': '𝕮', 'D': '𝕯', 'E': '𝕰', 'F': '𝕱', 'G': '𝕲', 'H': '𝕳', 'I': '𝕴', 'J': '𝕵',
            'K': '𝕶', 'L': '𝕷', 'M': '𝕸', 'N': '𝕹', 'O': '𝕺', 'P': '𝕻', 'Q': '𝕼', 'R': '𝕽', 'S': '𝕾', 'T': '𝕿',
            'U': '𝖀', 'V': '𝖁', 'W': '𝖂', 'X': '𝖃', 'Y': '𝖄', 'Z': '𝖅'
        };
        return text.split('').map(char => gothicMap[char] || char).join('');
    }

    toUnderline(text) {
        const underlineMap = {
            'a': 'a̲', 'b': 'b̲', 'c': 'c̲', 'd': 'd̲', 'e': 'e̲', 'f': 'f̲', 'g': 'g̲', 'h': 'h̲', 'i': 'i̲', 'j': 'j̲',
            'k': 'k̲', 'l': 'l̲', 'm': 'm̲', 'n': 'n̲', 'o': 'o̲', 'p': 'p̲', 'q': 'q̲', 'r': 'r̲', 's': 's̲', 't': 't̲',
            'u': 'u̲', 'v': 'v̲', 'w': 'w̲', 'x': 'x̲', 'y': 'y̲', 'z': 'z̲',
            'A': 'A̲', 'B': 'B̲', 'C': 'C̲', 'D': 'D̲', 'E': 'E̲', 'F': 'F̲', 'G': 'G̲', 'H': 'H̲', 'I': 'I̲', 'J': 'J̲',
            'K': 'K̲', 'L': 'L̲', 'M': 'M̲', 'N': 'N̲', 'O': 'O̲', 'P': 'P̲', 'Q': 'Q̲', 'R': 'R̲', 'S': 'S̲', 'T': 'T̲',
            'U': 'U̲', 'V': 'V̲', 'W': 'W̲', 'X': 'X̲', 'Y': 'Y̲', 'Z': 'Z̲'
        };
        return text.split('').map(char => underlineMap[char] || char).join('');
    }

    toSquared(text) {
        const squaredMap = {
            'a': '🄰', 'b': '🄱', 'c': '🄲', 'd': '🄳', 'e': '🄴', 'f': '🄵', 'g': '🄶', 'h': '🄷', 'i': '🄸', 'j': '🄹',
            'k': '🄺', 'l': '🄻', 'm': '🄼', 'n': '🄽', 'o': '🄾', 'p': '🄿', 'q': '🅀', 'r': '🅁', 's': '🅂', 't': '🅃',
            'u': '🅄', 'v': '🅅', 'w': '🅆', 'x': '🅇', 'y': '🅈', 'z': '🅉',
            'A': '🅰', 'B': '🅱', 'C': '🅲', 'D': '🅳', 'E': '🅴', 'F': '🅵', 'G': '🅶', 'H': '🅷', 'I': '🅸', 'J': '🅹',
            'K': '🅺', 'L': '🅻', 'M': '🅼', 'N': '🅽', 'O': '🅾', 'P': '🅿', 'Q': '🆀', 'R': '🆁', 'S': '🆂', 'T': '🆃',
            'U': '🆄', 'V': '🆅', 'W': '🆆', 'X': '🆇', 'Y': '🆈', 'Z': '🆉'
        };
        return text.split('').map(char => squaredMap[char] || char).join('');
    }

    toScript(text) {
        const scriptMap = {
            'a': '𝒶', 'b': '𝒷', 'c': '𝒸', 'd': '𝒹', 'e': '𝑒', 'f': '𝒻', 'g': '𝑔', 'h': '𝒽', 'i': '𝒾', 'j': '𝒿',
            'k': '𝓀', 'l': '𝓁', 'm': '𝓂', 'n': '𝓃', 'o': '𝑜', 'p': '𝓅', 'q': '𝓆', 'r': '𝓇', 's': '𝓈', 't': '𝓉',
            'u': '𝓊', 'v': '𝓋', 'w': '𝓌', 'x': '𝓍', 'y': '𝓎', 'z': '𝓏',
            'A': '𝒜', 'B': '𝐵', 'C': '𝒞', 'D': '𝒟', 'E': '𝐸', 'F': '𝐹', 'G': '𝒢', 'H': '𝐻', 'I': '𝐼', 'J': '𝒥',
            'K': '𝒦', 'L': '𝐿', 'M': '𝑀', 'N': '𝒩', 'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': '𝑅', 'S': '𝒮', 'T': '𝒯',
            'U': '𝒰', 'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵'
        };
        return text.split('').map(char => scriptMap[char] || char).join('');
    }

    toBold(text) {
        const boldMap = {
            'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
            'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
            'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
            'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
            'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
            'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
        };
        return text.split('').map(char => boldMap[char] || char).join('');
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

            // Load shapeshift users
            if (fs.existsSync(this.shapeshiftDataPath)) {
                const data = JSON.parse(fs.readFileSync(this.shapeshiftDataPath, 'utf8'));
                Object.entries(data).forEach(([guildId, shapeshiftData]) => {
                    this.shapeshiftUsers.set(guildId, new Set(shapeshiftData.users || []));
                    this.shapeshiftIndex.set(guildId, new Map(shapeshiftData.indices || []));
                    this.originalNicknames.set(guildId, new Map(shapeshiftData.originalNicknames || []));
                });
                console.log(`Loaded shapeshift data for ${this.shapeshiftUsers.size} guilds`);
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

            // Save shapeshift data
            this.saveShapeshiftData();
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
        this.client.user.setActivity('VIP Rainbow Names 🌈', { type: ActivityType.Watching });

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
        const validRoles = [];
        
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

            // Add to valid roles list
            if (role) {
                validRoles.push(role.id);
            }
        }

        // Update settings with only valid roles
        settings.colorRoles = validRoles;

        if (rolesCreated > 0) {
            console.log(`🎨 Created ${rolesCreated} color roles in ${guild.name}`);
            this.saveData();
        }
    }

    async onMessage(message) {
        if (message.author.bot || !message.guild) return;

        const content = message.content.toLowerCase();
        const vipCommand = `${this.prefix}${this.commandName}`;
        const shapeshiftCommand = `${this.prefix}${this.shapeshiftCommandName}`;

        if (content.startsWith(vipCommand)) {
            await this.handleVipCommand(message);
        } else if (content.startsWith(shapeshiftCommand)) {
            await this.handleShapeshiftCommand(message);
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

    async handleShapeshiftCommand(message) {
        // Check permissions (only server owner and bot owner)
        if (!this.isShapeshiftAuthorized(message.author.id, message.guild)) {
            return message.reply('❌ You need to be the server owner or bot owner to use this command!');
        }

        const args = message.content.split(/\s+/);
        if (args.length < 2) {
            return message.reply(`📝 Usage: \`${this.prefix}${this.shapeshiftCommandName} @user\` or \`${this.prefix}${this.shapeshiftCommandName} remove @user\``);
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
            await this.removeShapeshiftUser(message, targetMember);
        } else {
            await this.addShapeshiftUser(message, targetMember);
        }
    }

    async addShapeshiftUser(message, targetMember) {
        const guildId = message.guild.id;
        
        // Initialize guild shapeshift set if needed
        if (!this.shapeshiftUsers.has(guildId)) {
            this.shapeshiftUsers.set(guildId, new Set());
            this.shapeshiftIndex.set(guildId, new Map());
            this.originalNicknames.set(guildId, new Map());
        }

        const shapeshiftSet = this.shapeshiftUsers.get(guildId);

        // Check if already shapeshifting
        if (shapeshiftSet.has(targetMember.id)) {
            return message.reply(`✨ ${targetMember.displayName} is already shapeshifting!`);
        }

        // Check if bot can manage nicknames
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return message.reply('❌ I need "Manage Nicknames" permission to use this feature!');
        }

        // Store original nickname before we start shapeshifting
        const originalNick = targetMember.nickname || targetMember.user.displayName;
        this.originalNicknames.get(guildId).set(targetMember.id, originalNick);

        // Check for | separator and extract the part before it
        const nameBeforePipe = originalNick.split('|')[0].trim();
        if (!nameBeforePipe) {
            return message.reply('❌ Cannot shapeshift - no name found before the "|" character!');
        }

        // Add to shapeshift
        shapeshiftSet.add(targetMember.id);
        
        // Initialize their shapeshift index
        this.shapeshiftIndex.get(guildId).set(targetMember.id, 0);

        // Save data
        this.saveShapeshiftData();

        // Start shapeshift timer for this guild if not already running
        this.startShapeshiftRotation(guildId);

        // Apply first transformation immediately
        await this.shapeshiftUserNickname(targetMember, guildId);

        message.reply(`✨ ${targetMember.displayName} is now shapeshifting their name! 🌀`);
        console.log(`✅ Added Shapeshift: ${targetMember.displayName} in ${message.guild.name}`);
    }

    async removeShapeshiftUser(message, targetMember) {
        const guildId = message.guild.id;
        const shapeshiftSet = this.shapeshiftUsers.get(guildId);

        if (!shapeshiftSet || !shapeshiftSet.has(targetMember.id)) {
            return message.reply(`❌ ${targetMember.displayName} is not shapeshifting!`);
        }

        // Remove from shapeshift
        shapeshiftSet.delete(targetMember.id);

        // Restore original nickname
        const originalNickname = this.originalNicknames.get(guildId)?.get(targetMember.id);
        if (originalNickname) {
            try {
                await targetMember.setNickname(originalNickname, 'VIP Rainbow Bot - Restored original nickname');
            } catch (error) {
                console.error(`Error restoring nickname for ${targetMember.displayName}:`, error);
            }
        }

        // Clean up tracking data
        this.shapeshiftIndex.get(guildId)?.delete(targetMember.id);
        this.originalNicknames.get(guildId)?.delete(targetMember.id);

        // Save data
        this.saveShapeshiftData();

        // Stop rotation if no more shapeshift users
        if (shapeshiftSet.size === 0) {
            this.stopShapeshiftRotation(guildId);
        }

        message.reply(`✅ Removed shapeshift status from ${targetMember.displayName}`);
        console.log(`❌ Removed Shapeshift: ${targetMember.displayName} in ${message.guild.name}`);
    }

    startShapeshiftRotation(guildId) {
        if (this.shapeshiftTimers.has(guildId)) return; // Already running

        const timer = setInterval(async () => {
            await this.shapeshiftNicknamesForGuild(guildId);
        }, this.shapeshiftInterval);

        this.shapeshiftTimers.set(guildId, timer);
        console.log(`🌀 Started nickname shapeshifting for guild ${guildId}`);
    }

    stopShapeshiftRotation(guildId) {
        const timer = this.shapeshiftTimers.get(guildId);
        if (timer) {
            clearInterval(timer);
            this.shapeshiftTimers.delete(guildId);
            console.log(`⏹️ Stopped nickname shapeshifting for guild ${guildId}`);
        }
    }

    async shapeshiftNicknamesForGuild(guildId) {
        const shapeshiftSet = this.shapeshiftUsers.get(guildId);
        if (!shapeshiftSet || shapeshiftSet.size === 0) return;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        // Convert to array for staggered processing
        const shapeshiftUsers = Array.from(shapeshiftSet);
        
        // Shapeshift nicknames with small delays to avoid rate limits
        for (let i = 0; i < shapeshiftUsers.length; i++) {
            const userId = shapeshiftUsers[i];
            
            // Add a progressive delay between each user (300ms per user)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            try {
                const member = await guild.members.fetch(userId).catch(() => null);
                if (member) {
                    await this.shapeshiftUserNickname(member, guildId);
                } else {
                    // User not found, remove from shapeshift list
                    console.warn(`⚠️ Shapeshift user ${userId} not found in ${guild.name}, removing`);
                    shapeshiftSet.delete(userId);
                    
                    this.shapeshiftIndex.get(guildId)?.delete(userId);
                    this.originalNicknames.get(guildId)?.delete(userId);
                    this.saveShapeshiftData();
                }
            } catch (error) {
                console.error(`Error shapeshifting nickname for user ${userId}:`, error);
            }
        }
    }

    async shapeshiftUserNickname(member, guildId) {
        try {
            // Get original nickname
            const originalNick = this.originalNicknames.get(guildId)?.get(member.id);
            if (!originalNick) return;

            // Extract the part before | and the part after |
            const parts = originalNick.split('|');
            const nameBeforePipe = parts[0].trim();
            const afterPipe = parts.length > 1 ? ' | ' + parts.slice(1).join('|').trim() : '';

            if (!nameBeforePipe) return;

            // Get current shapeshift index
            let currentIndex = this.shapeshiftIndex.get(guildId)?.get(member.id) || 0;
            
            // Ensure index is within bounds
            if (currentIndex >= this.shapeshiftFonts.length) {
                currentIndex = 0;
            }

            // Apply transformation to the name before the pipe
            const transformedName = this.shapeshiftFonts[currentIndex].transform(nameBeforePipe);
            const newNickname = transformedName + afterPipe;

            // Update nickname if it's different and within Discord's limits
            if (newNickname.length <= 32 && newNickname !== member.nickname) {
                await member.setNickname(newNickname, 'VIP Rainbow Bot - Nickname shapeshifting');
            }

            // Move to next font
            currentIndex = (currentIndex + 1) % this.shapeshiftFonts.length;
            this.shapeshiftIndex.get(guildId)?.set(member.id, currentIndex);

        } catch (error) {
            console.error(`Error shapeshifting nickname for ${member.displayName}:`, error);
            
            // If it's a permissions error, warn about it
            if (error.code === 50013) {
                console.warn(`⚠️ Missing permissions to manage nickname for ${member.displayName} in ${member.guild.name}`);
            }
        }
    }

    saveShapeshiftData() {
        try {
            // Save shapeshift users
            const shapeshiftData = {};
            this.shapeshiftUsers.forEach((userSet, guildId) => {
                shapeshiftData[guildId] = {
                    users: Array.from(userSet),
                    indices: Array.from(this.shapeshiftIndex.get(guildId)?.entries() || []),
                    originalNicknames: Array.from(this.originalNicknames.get(guildId)?.entries() || [])
                };
            });
            fs.writeFileSync(this.shapeshiftDataPath, JSON.stringify(shapeshiftData, null, 2));
        } catch (error) {
            console.error('Error saving shapeshift data:', error);
        }
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

        for (const [guildId, shapeshiftSet] of this.shapeshiftUsers.entries()) {
            if (shapeshiftSet.size > 0) {
                this.startShapeshiftRotation(guildId);
            }
        }
    }

    async rotateColorsForGuild(guildId) {
        const vipSet = this.vipUsers.get(guildId);
        if (!vipSet || vipSet.size === 0) return;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        // Convert to array for staggered processing
        const vipUsers = Array.from(vipSet);
        
        // Rotate colors with small delays to avoid rate limits
        for (let i = 0; i < vipUsers.length; i++) {
            const userId = vipUsers[i];
            
            // Add a progressive delay between each user (200ms per user)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            try {
                const member = await guild.members.fetch(userId).catch(() => null);
                if (member) {
                    await this.rotateUserColor(member, guildId);
                } else {
                    // User not found, remove from VIP list
                    console.warn(`⚠️ User ${userId} not found in ${guild.name}, removing from VIP list`);
                    vipSet.delete(userId);
                    
                    const settings = this.guildSettings.get(guildId);
                    if (settings) {
                        settings.currentIndex.delete(userId);
                    }
                    this.saveData();
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
            // Validate that roles still exist
            const validRoles = settings.colorRoles.filter(roleId => 
                member.guild.roles.cache.has(roleId)
            );

            if (validRoles.length === 0) {
                console.warn(`⚠️ No valid color roles found for ${member.guild.name}`);
                return;
            }

            // Update valid roles if some were removed
            if (validRoles.length !== settings.colorRoles.length) {
                settings.colorRoles = validRoles;
                this.saveData();
            }

            // Get current color index for this user
            let currentIndex = settings.currentIndex.get(member.id) || 0;
            
            // Ensure index is within bounds
            if (currentIndex >= validRoles.length) {
                currentIndex = 0;
            }

            // CRITICAL FIX: Remove ALL VIP color roles first to prevent multiple roles
            const allVipRoles = settings.colorRoles.filter(roleId => 
                member.roles.cache.has(roleId)
            );
            
            if (allVipRoles.length > 0) {
                await member.roles.remove(allVipRoles, 'VIP Rainbow Bot - Color rotation cleanup');
                // Add small delay to prevent race conditions
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Move to next color
            currentIndex = (currentIndex + 1) % validRoles.length;
            settings.currentIndex.set(member.id, currentIndex);

            // Add ONLY the new color role
            const newRoleId = validRoles[currentIndex];
            const newRole = member.guild.roles.cache.get(newRoleId);
            
            if (newRole) {
                await member.roles.add(newRole, 'VIP Rainbow Bot - Color rotation');
            }

        } catch (error) {
            console.error(`Error rotating color for ${member.displayName}:`, error);
            
            // If it's a permissions error, warn about it
            if (error.code === 50013) {
                console.warn(`⚠️ Missing permissions to manage roles for ${member.displayName} in ${member.guild.name}`);
            }
        }
    }

    isAuthorized(userId, member) {
        // Bot owner can always use commands
        if (userId === this.ownerId) return true;
        
        // Check for Administrator permission
        if (member && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        
        return false;
    }

    isShapeshiftAuthorized(userId, guild) {
        // Bot owner can always use commands
        if (userId === this.ownerId) return true;
        
        // Server owner can use shapeshift commands
        if (userId === guild.ownerId) return true;
        
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

        // Stop all shapeshift rotations
        for (const timer of this.shapeshiftTimers.values()) {
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
