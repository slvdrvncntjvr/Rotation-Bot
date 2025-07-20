const { ActivityType } = require('discord.js');

class VIPManager {
    constructor(bot) {
        this.bot = bot;
        this.client = bot.client;
    }

    /**
     * Get VIP user count for a guild
     */
    getVipCount(guildId) {
        const vipSet = this.bot.vipUsers.get(guildId);
        return vipSet ? vipSet.size : 0;
    }

    /**
     * Get total VIP users across all guilds
     */
    getTotalVipCount() {
        let total = 0;
        for (const vipSet of this.bot.vipUsers.values()) {
            total += vipSet.size;
        }
        return total;
    }

    /**
     * Get all VIP users in a guild
     */
    getVipUsers(guildId) {
        const vipSet = this.bot.vipUsers.get(guildId);
        return vipSet ? Array.from(vipSet) : [];
    }

    /**
     * Check if a user is VIP in a guild
     */
    isVipUser(guildId, userId) {
        const vipSet = this.bot.vipUsers.get(guildId);
        return vipSet ? vipSet.has(userId) : false;
    }

    /**
     * Get guild statistics
     */
    getGuildStats(guildId) {
        const settings = this.bot.guildSettings.get(guildId);
        const vipCount = this.getVipCount(guildId);
        const isRotating = this.bot.rotationTimers.has(guildId);

        return {
            vipCount,
            colorRoles: settings ? settings.colorRoles.length : 0,
            isRotating,
            maxVipUsers: this.bot.maxVipUsers
        };
    }

    /**
     * Clean up invalid roles (roles that were deleted)
     */
    async cleanupInvalidRoles(guildId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return false;

        const settings = this.bot.guildSettings.get(guildId);
        if (!settings) return false;

        const validRoles = [];
        let removedCount = 0;

        for (const roleId of settings.colorRoles) {
            const role = guild.roles.cache.get(roleId);
            if (role) {
                validRoles.push(roleId);
            } else {
                removedCount++;
            }
        }

        if (removedCount > 0) {
            settings.colorRoles = validRoles;
            this.bot.saveData();
            console.log(`🧹 Cleaned up ${removedCount} invalid roles in ${guild.name}`);
            return true;
        }

        return false;
    }

    /**
     * Manually trigger color rotation for a specific user
     */
    async rotateUserColorNow(guildId, userId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return false;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return false;

        const vipSet = this.bot.vipUsers.get(guildId);
        if (!vipSet || !vipSet.has(userId)) return false;

        await this.bot.rotateUserColor(member, guildId);
        return true;
    }

    /**
     * Pause rotation for a guild
     */
    pauseRotation(guildId) {
        if (this.bot.rotationTimers.has(guildId)) {
            this.bot.stopRotation(guildId);
            return true;
        }
        return false;
    }

    /**
     * Resume rotation for a guild
     */
    resumeRotation(guildId) {
        const vipSet = this.bot.vipUsers.get(guildId);
        if (vipSet && vipSet.size > 0 && !this.bot.rotationTimers.has(guildId)) {
            this.bot.startRotation(guildId);
            return true;
        }
        return false;
    }

    /**
     * Get current color for a VIP user
     */
    getCurrentColor(guildId, userId) {
        const settings = this.bot.guildSettings.get(guildId);
        if (!settings) return null;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return null;

        const currentIndex = settings.currentIndex.get(userId);
        if (currentIndex === undefined) return null;

        const roleId = settings.colorRoles[currentIndex];
        const role = guild.roles.cache.get(roleId);
        
        return role ? {
            name: role.name,
            color: role.color,
            index: currentIndex
        } : null;
    }

    /**
     * Set specific color for a user (bypasses rotation)
     */
    async setUserColor(guildId, userId, colorIndex) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return false;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return false;

        const settings = this.bot.guildSettings.get(guildId);
        if (!settings || colorIndex >= settings.colorRoles.length) return false;

        const vipSet = this.bot.vipUsers.get(guildId);
        if (!vipSet || !vipSet.has(userId)) return false;

        try {
            // Remove all color roles
            await this.bot.removeAllColorRoles(member, guildId);

            // Add specific color
            const roleId = settings.colorRoles[colorIndex];
            const role = guild.roles.cache.get(roleId);
            
            if (role) {
                await member.roles.add(role, 'VIP Rainbow Bot - Manual color set');
                settings.currentIndex.set(userId, colorIndex);
                return true;
            }
        } catch (error) {
            console.error(`Error setting color for ${member.displayName}:`, error);
        }

        return false;
    }

    /**
     * Update bot status with VIP count
     */
    updateBotStatus() {
        const totalVips = this.getTotalVipCount();
        const guildCount = this.client.guilds.cache.size;
        
        this.client.user.setActivity(
            `${totalVips} VIP users in ${guildCount} servers 🌈`, 
            { type: ActivityType.Watching }
        );
    }
}

module.exports = VIPManager;
