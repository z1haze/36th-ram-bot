![Logo](docs/img/logo.png "Logo")

Role Assignment Management (RAM) Bot
---

> A discord bot to automatically assign roles to users based on reactions

What It Does
---

- [x] Assigns a role (configurable) to a user when they join the server
- [x] Utilizes a custom message format for role assignment messages
- [x] Handles gating newly joined users through a series of welcome channels
 
Usage Overview
---
 
#### User join role
When a new user joins the server, the bot can automatically assign a role to this user.
The role ID needs to be set in the `.env` file under `WELCOME_ROLE_IDS` (first entry)

#### Gated Welcome Channels
When a new user joins the server, you can have visibility locked to a set of welcome channels setup in your `.env` file
under `WELCOME_CHANNEL_IDS` as a comma separated list. You will also need `WELCOME_ROLE_IDS` defined in your `.env` file
as well (one for each welcome channel). The bot will navigate the user through the welcome channels, by adding/removing the
appropriate roles to show visibility to the correct welcome channel. Upon complete of the welcome channel flow, the bot will
assign a role to the user, defined in your `.env` file under `GUEST_ROLE_ID`.

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
BOT_TOKEN=<bot_token>

# guild id
GUILD_ID=<guild_id>

# a list of welcome channels and roles
WELCOME_CHANNEL_IDS=<channel_id>,<channel_id>
WELCOME_ROLE_IDS=<role_id>,<role_id>

# the emoji id that is used on welcome channel reactions
WELCOME_EMOJI_ID=<emoji_id>

# channels the role assignment bot listens on
RAM_CHANNEL_IDS=<channel_id>,<channel_id>

# role given after welcome channels complete
GUEST_ROLE_ID=<role_id>
```
