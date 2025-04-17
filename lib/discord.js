const axios = require('axios');

const fetchGuildMember = async (userId, accessToken) => {
    try {
        const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const guildResponse = await axios.get(
            `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${userId}`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                }
            }
        );

        return {
            ...guildResponse.data,
            user: {
                ...guildResponse.data.user,
                bio: userResponse.data.bio || null
            }
        };
    } catch (error) {
        console.error('Error fetching guild member:', error);
        return null;
    }
}

const fetchUserConnections = async (accessToken) => {
    try {
        const response = await axios.get(
            'https://discord.com/api/v10/users/@me/connections',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        return response.data.map(connection => {
            let url = '#';

            switch (connection.type) {
                case 'spotify':
                    url = `https://open.spotify.com/user/${connection.id}`;
                    break;
                case 'github':
                    url = `https://github.com/${connection.name}`;
                    break;
                case 'youtube':
                    url = `https://youtube.com/channel/${connection.id}`;
                    break;
                case 'twitch':
                    url = `https://twitch.tv/${connection.name}`;
                    break;
                case 'twitter':
                    url = `https://twitter.com/${connection.name}`;
                    break;
                case 'steam':
                    url = `https://steamcommunity.com/profiles/${connection.id}`;
                    break;
                default:
                    url = '#';
            }

            return {
                ...connection,
                url
            };
        });
    } catch (error) {
        console.error('Error fetching user connections:', error.message);
        return [];
    }
};

const hasStaffRole = (member) => {
    if (!member || !member.roles) return false;

    return member.roles.some(role => [
        process.env.DIRECTOR_ROLE_ID,
        process.env.DEVELOPER_ROLE_ID,
        process.env.SOUND_DESIGN_ROLE_ID
    ].includes(role));
};

const getRoleName = (roleId) => {
    switch (roleId) {
        case process.env.DIRECTOR_ROLE_ID:
            return 'Director';
        case process.env.DEVELOPER_ROLE_ID:
            return 'Developer';
        case process.env.SOUND_DESIGN_ROLE_ID:
            return 'Sound Design';
        default:
            return 'Unknown Role';
    }
};


async function fetchGuildInfo() {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch guild info: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching guild info:', error);
        return null;
    }
}

const fetchUserById = async (userId) => {
    try {
        const response = await axios.get(
            `https://discord.com/api/v10/users/${userId}`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                }
            }
        );

        const userData = response.data;

        return {
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator || '0',
            avatar: userData.avatar
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
                : 'https://cdn.discordapp.com/embed/avatars/0.png',
            banner: userData.banner
                ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png?size=512`
                : null,
            bio: userData.bio || null
        };
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return null;
    }
};

async function sendDiscordMessage(channelId, message, isDM = false) {
    try {
        const endpoint = isDM
            ? `https://discord.com/api/v10/users/@me/channels`
            : `https://discord.com/api/v10/channels/${channelId}/messages`;


        let dmChannelId = channelId;
        if (isDM) {
            const dmResponse = await axios.post(
                endpoint,
                { recipient_id: channelId },
                {
                    headers: {
                        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            dmChannelId = dmResponse.data.id;
        }

        const response = await axios.post(
            isDM ? `https://discord.com/api/v10/channels/${dmChannelId}/messages` : endpoint,
            message,
            {
                headers: {
                    'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error sending Discord message:', error);
        throw error;
    }
}

function createEmbed() {
    return {
        title: '',
        description: '',
        color: 0x5865F2,
        fields: [],
        footer: { text: '' },
        timestamp: new Date().toISOString(),

        setTitle(title) {
            this.title = title;
            return this;
        },

        setDescription(description) {
            this.description = description;
            return this;
        },

        setColor(color) {
            this.color = color;
            return this;
        },

        addField(name, value, inline = false) {
            this.fields.push({ name, value, inline });
            return this;
        },

        addFields(...fields) {
            this.fields.push(...fields);
            return this;
        }


    };
}


const sendLoginNotification = async (user) => {
    try {

        const userAvatar = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        const guildInfo = await fetchGuildInfo();
        const guildIcon = guildInfo && guildInfo.icon
            ? `https://cdn.discordapp.com/icons/${process.env.GUILD_ID}/${guildInfo.icon}.png?size=128`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        };
        const formattedDate = now.toLocaleDateString('en-US', options);

        let roleNames = [];
        if (user.guildMember && user.guildMember.roles) {
            if (user.guildMember.roles.includes(process.env.DIRECTOR_ROLE_ID)) {
                roleNames.push('Director');
            }
            if (user.guildMember.roles.includes(process.env.DEVELOPER_ROLE_ID)) {
                roleNames.push('Developer');
            }
            if (user.guildMember.roles.includes(process.env.SOUND_DESIGN_ROLE_ID)) {
                roleNames.push('Sound Design');
            }
        }


        let connectedAccountsText = '';
        if (user.connections && user.connections.length > 0) {
            user.connections.forEach(connection => {
                connectedAccountsText += `→ ${connection.type.charAt(0).toUpperCase() + connection.type.slice(1)}: ${connection.name}\n`;
            });
        } else {
            connectedAccountsText = 'No connected accounts';
        }

        await sendDiscordMessage(process.env.LOG_CHANNEL_ID, {
            embeds: [{
                color: 0x5865F2,
                author: {
                    name: `${user.username}#${user.discriminator || '0'}`,
                    icon_url: userAvatar
                },
                title: 'Staff Portal Authentication',
                description: `A staff member has authenticated with the Asteroid Studios portal at ${formattedDate}.`,
                thumbnail: {
                    url: userAvatar
                },
                fields: [
                    {
                        name: 'User Information',
                        value: `# ${user.username}#${user.discriminator || '0'}\n* ID: ${user.id}`,
                        inline: false
                    },
                    {
                        name: 'Assigned Roles',
                        value: roleNames.length > 0 ? roleNames.join(', ') : 'No roles assigned',
                        inline: false
                    },
                    {
                        name: 'Connected Accounts',
                        value: connectedAccountsText,
                        inline: false
                    }
                ],
                footer: {
                    text: 'Asteroid Studios Security System',
                    icon_url: guildIcon
                },
                timestamp: new Date().toISOString()
            }]
        });
        return true;
    } catch (error) {
        console.error('Error sending login notification:', error);
        return false;
    }
};


const logToChannel = async (message) => {
    try {
        await sendDiscordMessage(process.env.LOG_CHANNEL_ID, message);
        return true;
    } catch (error) {
        console.error('Error logging to channel:', error);
        return false;
    }
};


const sendDirectMessage = async (userId, content) => {
    try {
        return await sendDiscordMessage(userId, content, true);
    } catch (error) {
        console.error('Error sending direct message:', error);

        if (error.response && error.response.status === 403) {
            throw new Error('DMS_CLOSED');
        }

        throw error;
    }
};


module.exports = {
    fetchGuildMember,
    fetchUserById,
    fetchUserConnections,
    hasStaffRole,
    getRoleName,
    fetchGuildInfo,
    sendDiscordMessage,
    createEmbed,
    logToChannel,
    sendLoginNotification,
    sendDirectMessage
};