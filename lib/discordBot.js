const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('./logger'); // Correct import

let client;
let targetChannelId = '1363508426705076314'; // The target channel ID

// Define the roles mapping (similar to meetings.ejs)
const roleMap = {
    '1350296517482647592': 'Directors', // Director role ID
    '1350297356234522786': 'Developers', // Developer role ID
    '1350688615360888853': 'Sound Designers' // Sound Design role ID
};

function initializeBot() {
    if (!process.env.DISCORD_BOT_TOKEN) {
        logger.warn('DISCORD_BOT_TOKEN is not set. Discord notifications will be disabled.');
        return;
    }
    if (!targetChannelId) {
        logger.warn('Target Discord channel ID is not set. Discord notifications will be disabled.');
        return;
    }

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            // Add other intents if needed, but Guilds is likely sufficient for sending messages
        ]
    });

    client.once('ready', () => {
        logger.info(`Discord bot logged in as ${client.user.tag}`);
        // You could fetch the channel here to ensure it exists, but fetching on demand is also fine.
    });

    client.on('error', error => {
        logger.error('Discord client error:', error);
    });

    client.login(process.env.DISCORD_BOT_TOKEN)
        .catch(error => {
            logger.error('Failed to log in Discord bot:', error);
            client = null; // Prevent attempts to use a non-logged-in client
        });
}

// Define meeting room links
const meetingRoomLinks = {
    1: 'https://discord.com/channels/1350296433361948703/1363515036374405131',
    2: 'https://discord.com/channels/1350296433361948703/1363515108151787772',
    3: 'https://discord.com/channels/1350296433361948703/1363515178142138470'
};

async function sendMeetingNotification(meeting, isCancelled = false) {
    if (!client || !client.isReady()) {
        logger.warn('Discord client not ready or not initialized. Skipping notification.');
        return;
    }

    try {
        const channel = await client.channels.fetch(targetChannelId);
        if (!channel || !channel.isTextBased()) {
            logger.error(`Target channel ${targetChannelId} not found or is not a text channel.`);
            return;
        }

        // Format invited roles with pings
        const invitedRoleNames = meeting.invitedRoles
            .map(roleId => {
                const roleName = roleMap[roleId] || `Unknown Role (${roleId})`;
                if (roleId === '1350296517482647592' || roleId === '1350297356234522786' || roleId === '1350688615360888853') {
                    return `<@&${roleId}>`;
                }
                return roleName;
            })
            .join(' ') || 'None';

        let embed;

        if (isCancelled) {
            // Create a new embed for cancelled meetings
            embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`❌ Meeting Cancelled: ${meeting.title}`)
                .setDescription('This meeting has been cancelled.')
                .addFields(
                    { name: 'Invited Roles', value: invitedRoleNames, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'AGS Meetings' });
        } else {
            // Existing embed for scheduled meetings
            const meetingDate = new Date(meeting.date);
            const discordTimestamp = `<t:${Math.floor(meetingDate.getTime() / 1000)}:F>`;
            const relativeTimestamp = `<t:${Math.floor(meetingDate.getTime() / 1000)}:R>`;

            embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🗓️ Meeting Scheduled: ${meeting.title}`)
                .setDescription(meeting.description || 'No description provided.')
                .addFields(
                    { name: 'Date & Time', value: `${discordTimestamp} (${relativeTimestamp})`, inline: true },
                    { name: 'Duration', value: `${meeting.duration} minutes`, inline: true },
                    { name: 'Invited Roles', value: invitedRoleNames, inline: false },
                    { name: 'Meeting Room', value: `${meetingRoomLinks[meeting.meetingRoom]} (Click to Join)`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'AGS Meetings' });

            // Schedule a ping 5 minutes before the meeting
            const pingTime = new Date(meetingDate.getTime() - 5 * 60 * 1000); // 5 minutes before
            const timeUntilPing = pingTime - Date.now();

            if (timeUntilPing > 0) {
                setTimeout(async () => {
                    try {
                        const button = new ButtonBuilder()
                            .setLabel('Join Meeting')
                            .setStyle(ButtonStyle.Link)
                            .setURL(meetingRoomLinks[meeting.meetingRoom]);

                        const actionRow = new ActionRowBuilder().addComponents(button);

                        const pingMessage = `Meeting starting in 5 minutes, please join ${meetingRoomLinks[meeting.meetingRoom]}! ${meeting.invitedRoles.map(roleId => `<@&${roleId}>`).join(' ')}`;
                        await channel.send({ 
                            content: pingMessage,
                            components: [actionRow] 
                        });
                        logger.info(`Sent 5-minute reminder for meeting ${meeting._id} in channel ${targetChannelId}`);
                    } catch (error) {
                        logger.error(`Failed to send 5-minute reminder for meeting ${meeting._id}:`, error);
                    }
                }, timeUntilPing);
            }
        }

        // Send the embed
await channel.send({ 
    content: `${meeting.invitedRoles.map(roleId => `<@&${roleId}>`).join('')}`,
    embeds: [embed] 
});

        logger.info(`Sent ${isCancelled ? 'cancellation' : 'notification'} to Discord channel ${targetChannelId} for meeting ${meeting._id}`);

    } catch (error) {
        logger.error(`Failed to send ${isCancelled ? 'cancellation' : 'notification'} to Discord for meeting ${meeting._id}:`, error);
    }
}

module.exports = {
    initializeBot,
    sendMeetingNotification
};