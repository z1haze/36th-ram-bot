![Logo](docs/img/logo.png "Logo")

Role Assignment Management (RAM) Bot
---

> A discord bot to automatically assign roles to users based on reactions

What It Does
---

- [x] Utilizes a custom message format for role assignment messages
 
Usage Overview
---

#### Role Assignment Messages (RAM)
This bot will also handle role assignments for channels listed in the `RAM_CHANNELS` of the `.env` file.
The example below shows how to properly format a message so that the bot will understand.
Keep note that the (`>`) and single dash (`-`) are mandatory characters.

The format for a role assignment message is as follows:

```
<emoji> <channel> - <role>
```

In the example below, the bot would add reactions for `:eso:`, `:squad:` and `:postscriptum:` emojis.
Upon user reaction on these emojis, the bot will assign the `@role` to the user. The `#channel` bit is
there to inform the user which channel they will be given access to. **Note: you still have to create the
role, and assign the role to the channel for viewing permissions.

```
** List of the Side-Game Channels **
> These are the games that aren't official 36th games, but still have 36th members playing them.

To access a channel, __react to this post__ with the corresponding emoji
> :eso: #eso - @Elder Scrolls Online
> :squad: #squad - @Squad
> :postscriptum: #post-scriptum - @Post Scriptum
```

#### `.env`

```
NODE_ENV=
SENTRY_DSN=
BOT_TOKEN=
GUILD_ID=
RAM_CHANNEL_IDS=
```
