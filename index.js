require('dotenv').config();
require('./util/sentry').init();

const {Client} = require('discord.js');
const translateMessage = require('./util/translate-message');
const helpers = require('./util/role-helpers');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const RAM_CHANNELS = new Map();

const client = new Client({
    intents : ['GUILDS', 'GUILD_MESSAGE_REACTIONS', 'GUILD_EMOJIS_AND_STICKERS'],
    partials: ['REACTION']
});

client.on('ready', async () => {
    // eslint-disable-next-line no-console
    console.info(`Logged in as ${client.user.tag}!`);

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        throw new Error(`Incorrect guild id: ${GUILD_ID}`);
    }

    // initialize RAM channels and messages
    process.env.RAM_CHANNEL_IDS.split(',').forEach((channelId) => {
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            RAM_CHANNELS.set(channelId, channel);

            // setup listeners on each RAM message in the channel
            channel.messages.fetch()
                .then((messages) => messages.each(processMessage));
        } else {
            throw new Error(`RAM channel not found matching id: ${channelId}`);
        }
    });
});

/**
 * After the bot adds a new RAM message, process the message to add all appropriate reactions
 */
client.on('message', (message) => {
    // the only messages we care about are bot messages
    if (!message.author.bot) {
        return;
    }

    // handle messages for RAM channels
    if (RAM_CHANNELS.has(message.channel.id)) {
        return processMessage(message);
    }
});

/**
 * After the bot updates the RAM message, process to message to add or remove any necessary reactions
 */
client.on('messageUpdate', (oldMessage, message) => {
    // the only messages we care about are bot messages
    if (!message.author.bot) {
        return;
    }

    // handle messages for RAM channels
    if (RAM_CHANNELS.has(message.channel.id)) {
        return processMessage(message, oldMessage);
    }
});

/**
 * Give a role to a member after the add their reaction
 */
client.on('messageReactionAdd', (messageReaction, user) => {
    // the only messages we care about are user messages
    if (user.bot) {
        return;
    }

    if (RAM_CHANNELS.has(messageReaction.message.channel.id)) {
        const member = messageReaction.message.guild.members.cache.get(user.id);

        handleUserReaction(messageReaction, member);
    }
});

/**
 * Remove a role from a member after they remove their reaction
 */
client.on('messageReactionRemove', (messageReaction, user) => {
    if (user.bot) {
        return;
    }
    
    if (RAM_CHANNELS.has(messageReaction.message.channel.id)) {
        const member = messageReaction.message.guild.members.cache.get(user.id);

        handleUserReaction(messageReaction, member, true);
    }
});

client.login(BOT_TOKEN);

/**
 * Setup emoji reactions for a RAM channel message
 */
function processMessage (message, oldMessage = null) {
    // translate message into emoji/role pairs, and get a list of reactions to remove
    const {lines, toRemove} = translateMessage(message, oldMessage);

    // add reactions based on the message content
    for (const line of lines) {
        const [, emoji] = line;

        message.react(emoji)
            .catch((e) => console.error(e.message)); // eslint-disable-line no-console
    }

    // remove any reactions that should not be
    if (toRemove.size > 0) {
        for (const [, reaction] of message.reactions.cache) {
            if (toRemove.has(reaction.emoji.name)) {
                reaction.remove()
                    .catch((e) => console.error(e.message)); // eslint-disable-line no-console
            }
        }
    }
}

/**
 * Add/Remove roles from users based on their message reaction
 *
 * @param messageReaction
 * @param member
 * @param remove
 */
function handleUserReaction (messageReaction, member, remove = false) {
    const {translations} = translateMessage(messageReaction.message);

    if (translations.has(messageReaction.emoji.name)) {
        const role = translations.get(messageReaction.emoji.name);

        if (remove) {
            helpers.takeRole(messageReaction.message.guild, member, role);
        } else {
            helpers.giveRole(messageReaction.message.guild, member, role);
        }
    }
}