const translateLine = (line, message) => {
    let currentEmoji = line[1];
    const roleId = line[2];

    // parse ascii emojis to get their name
    if (currentEmoji.startsWith('<:')) {
        currentEmoji = currentEmoji.match(/<:(.+?):/)[1];
    }

    const role = message.guild.roles.cache.get(roleId);

    if (!role) {
        throw new Error(`Role not found matching id: ${roleId}`);
    }

    return [currentEmoji, role];
};

module.exports = (message, oldMessage) => {
    const lines = [...message.content.matchAll(/>* *([^ \n]+) [^\n]*-[^\n]*<@&([0-9]+)>/g)];
    const translations = new Map();
    const toRemove = new Set();

    /**
     * Find emoji/role pairs for each line in the message
     */
    for (const line of lines) {
        const [currentEmoji, role] = translateLine(line, message);

        translations.set(currentEmoji, role);
    }

    /**
     * Check the previous message (if edited) and keep track of any emoji/roles that were removed
     */
    if (oldMessage) {
        const lines = oldMessage.content.matchAll(/>* *([^ \n]+) [^\n]*-[^\n]*<@&([0-9]+)>/g);

        for (const line of lines) {
            const [currentEmoji] = translateLine(line, message);

            if (!translations.has(currentEmoji)) {
                toRemove.add(currentEmoji);
            }
        }
    }

    return {
        lines,
        translations,
        toRemove
    };
};