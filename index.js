require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

let GUILD;
let GUEST_ROLE;
let WELCOME_EMOJI;

const WELCOME_CHANNEL_IDS = process.env.WELCOME_CHANNEL_IDS.split(',');
const WELCOME_ROLE_IDS = process.env.WELCOME_ROLE_IDS.split(',');
const RAM_CHANNEL_IDS = process.env.RAM_CHANNEL_IDS.split(',');

const WELCOME_ROLES = new Map();
const WELCOME_CHANNELS = new Map();
const RAM_CHANNELS = new Map();

const translateMessage = require('./util/translate-message');
const helpers = require('./util/role-helpers');
const monitor = require('./util/sentry');
const {Client} = require('discord.js');

monitor.init();

const client = new Client({
    partials: ['REACTION']
});

const processMessage = (message, oldMessage = null) => {
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
};

const handleUserReaction = (messageReaction, member, remove = false) => {
    const {translations} = translateMessage(messageReaction.message);

    if (translations.has(messageReaction.emoji.name)) {
        const role = translations.get(messageReaction.emoji.name);

        if (remove) {
            helpers.takeRole(GUILD, member, role);
        } else {
            helpers.giveRole(GUILD, member, role);
        }
    }
};

client.on('ready', async () => {
    // eslint-disable-next-line no-console
    console.info(`Logged in as ${client.user.tag}!`);

    GUILD = client.guilds.cache.get(GUILD_ID);

    if (!GUILD) {
        throw new Error(`Incorrect guild id: ${GUILD_ID}`);
    }

    // set the correct join role
    GUEST_ROLE = GUILD.roles.cache.get(process.env.GUEST_ROLE_ID);

    if (!GUEST_ROLE) {
        throw new Error(`Guest role not found matching id: ${process.env.GUEST_ROLE_ID}`);
    }

    // set the correct welcome emoji
    WELCOME_EMOJI = GUILD.emojis.cache.get(process.env.WELCOME_EMOJI_ID);

    if (!WELCOME_EMOJI) {
        throw new Error(`Welcome emoji not found matching id: ${process.env.WELCOME_EMOJI_ID}`);
    }

    // set the correct welcome roles
    WELCOME_ROLE_IDS.forEach((roleId) => {
        const role = GUILD.roles.cache.get(roleId);

        if (role) {
            WELCOME_ROLES.set(roleId, role);
        } else {
            throw new Error(`Welcome role not found matching id: ${roleId}`);
        }
    });

    // set the correct welcome channels
    WELCOME_CHANNEL_IDS.forEach((channelId) => {
        const channel = GUILD.channels.cache.get(channelId);

        if (channel) {
            WELCOME_CHANNELS.set(channelId, channel);
        } else {
            throw new Error(`Welcome channel not found matching id: ${channelId}`);
        }
    });

    // set the correct RAM channels
    RAM_CHANNEL_IDS.forEach((channelId) => {
        const channel = GUILD.channels.cache.get(channelId);

        if (channel) {
            RAM_CHANNELS.set(channelId, channel);
        } else {
            throw new Error(`RAM channel not found matching id: ${channelId}`);
        }
    });

    // initialize bot reactions on welcome channels
    for (const [, channel] of WELCOME_CHANNELS) {
        channel.messages.fetch()
            .then((messages) => {
                for (const [, message] of messages) {
                    message.react(WELCOME_EMOJI);
                }
            });
    }

    // initialize bot reactions on RAM channels
    for (const [, channel] of RAM_CHANNELS) {
        channel.messages.fetch()
            .then((messages) => {
                for (const [, message] of messages) {
                    processMessage(message);
                }
            });
    }
});

client.on('guildMemberAdd', (member) => {
    if (WELCOME_ROLES.size > 0) {
        const role = WELCOME_ROLES.entries().next().value;

        member.roles.add(role);
    }
});

client.on('message', (message) => {
    // the only messages we care about are bot messages
    if (!message.author.bot) {
        return;
    }

    // handle messages for welcome channels
    if (WELCOME_CHANNELS.has(message.channel.id)) {
        return message.react(WELCOME_EMOJI);
    }

    // handle messages for RAM channels
    if (RAM_CHANNELS.has(message.channel.id)) {
        return processMessage(message);
    }
});

client.on('messageUpdate', (oldMessage, message) => {
    // the only messages we care about are bot messages
    if (!message.author.bot) {
        return;
    }

    // handle messages for welcome channels
    if (WELCOME_CHANNELS.has(message.channel.id)) {
        return message.react(WELCOME_EMOJI);
    }

    // handle messages for RAM channels
    if (RAM_CHANNELS.has(message.channel.id)) {
        return processMessage(message, oldMessage);
    }
});

client.on('messageReactionAdd', (messageReaction, user) => {
    // the only messages we care about are user messages
    if (user.bot) {
        return;
    }

    // handle messages for welcome channels
    if (WELCOME_CHANNELS.has(messageReaction.message.channel.id)) {
        const index = WELCOME_CHANNEL_IDS.indexOf(messageReaction.message.channel.id);
        const roleId = WELCOME_ROLE_IDS[index];
        const role = WELCOME_ROLES.get(roleId);

        const member = GUILD.members.cache
            .get(user.id);

        member.roles.remove(role);

        // if there is another welcome channel
        if (index < WELCOME_CHANNELS.size - 1) {
            const roleId = WELCOME_ROLE_IDS[index + 1];
            const role = WELCOME_ROLES.get(roleId);

            member.roles.add(role);
        } else {
            // no more welcome channels, finished
            member.roles.add(GUEST_ROLE);
        }
    }

    if (RAM_CHANNELS.has(messageReaction.message.channel.id)) {
        const member = GUILD.members.cache
            .get(user.id);

        handleUserReaction(messageReaction, member);
    }
});

client.on('messageReactionRemove', (messageReaction, user) => {
    if (RAM_CHANNELS.has(messageReaction.message.channel.id)) {
        const member = GUILD.members.cache
            .get(user.id);

        handleUserReaction(messageReaction, member, true);
    }
});

client.login(BOT_TOKEN);