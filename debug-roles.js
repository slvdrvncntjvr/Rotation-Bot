const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Debug script to check role assignment issues
class RoleDebugger {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.vipRoleNames = [
            'VIP-Red', 'VIP-Blue', 'VIP-Yellow', 'VIP-Green',
            'VIP-Purple', 'VIP-Orange', 'VIP-Pink', 'VIP-Cyan'
        ];
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_BOT_TOKEN);
            console.log('🔍 Role Debugger connected!');
            
            this.client.on('ready', () => this.checkRoles());
        } catch (error) {
            console.error('❌ Failed to start debugger:', error);
        }
    }

    async checkRoles() {
        console.log('\n🧪 Checking VIP role assignments...\n');

        for (const guild of this.client.guilds.cache.values()) {
            console.log(`\n🏠 Guild: ${guild.name} (${guild.id})`);
            
            // Find VIP roles
            const vipRoles = guild.roles.cache.filter(role => 
                this.vipRoleNames.includes(role.name)
            );
            
            console.log(`📋 VIP Roles Found: ${vipRoles.size}/8`);
            vipRoles.forEach(role => {
                console.log(`   🎨 ${role.name}: ${role.members.size} members`);
            });

            // Check for users with multiple VIP roles
            const allMembers = await guild.members.fetch();
            let multiRoleUsers = 0;
            let totalVipUsers = new Set();

            allMembers.forEach(member => {
                const memberVipRoles = member.roles.cache.filter(role => 
                    this.vipRoleNames.includes(role.name)
                );

                if (memberVipRoles.size > 1) {
                    multiRoleUsers++;
                    console.log(`   ⚠️  ${member.displayName} has ${memberVipRoles.size} VIP roles:`);
                    memberVipRoles.forEach(role => {
                        console.log(`      - ${role.name}`);
                    });
                }

                if (memberVipRoles.size > 0) {
                    totalVipUsers.add(member.id);
                }
            });

            console.log(`\n📊 Statistics:`);
            console.log(`   Total VIP Users: ${totalVipUsers.size}`);
            console.log(`   Users with Multiple Roles: ${multiRoleUsers}`);
            console.log(`   Status: ${multiRoleUsers > 0 ? '❌ Issues Found' : '✅ All Good'}`);
        }

        console.log('\n🏁 Role check complete!');
        this.client.destroy();
    }
}

const roleDebugger = new RoleDebugger();
roleDebugger.start();
