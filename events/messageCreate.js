const { Client, Message, ActivityType } = require("discord.js");
const { db, Guild, Channel, User } = require("../db");
const cooldown = require("../cooldown");
const i18n = require("../i18n");

const statusTypes = ["online", "dnd", "idle", "invisible"]
const activityTypes = {
  competing: ActivityType.Competing,
  custom: ActivityType.Custom,
  listening: ActivityType.Listening,
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  watching: ActivityType.Watching
}

/**
* @param {Client} client
* @param {Message} message
*/
function executeAdminCommand(client, message) {
  const args = message.content.replace(client.prefix, "").split(/\s/)
  const p = process.env.PREFIX ?? "="
  const commandName = args.shift()?.toLowerCase()
  const catchFunc = (r) => message.reply(`**Error:**\n> ${r}`)
  switch (commandName) {
    case "username":
    case "name":
      if (args[0]) {
        client.user.setUsername(args.join(" "))
          .then(() => message.reply("Username updated!"))
          .catch(catchFunc)
      } else message.reply(`**Usage:**\n> ${p}username <name>`)
      break;
    case "avatar":
    case "icon":
      const image = message.attachments?.first()
      if (image || args[0]) {
        client.user.setAvatar(image?.attachment ?? args[0])
          .then(() => message.reply("Avatar updated!"))
          .catch(catchFunc)
      } else message.reply(`**Usage:**\n> ${p}avatar <link|attachment>`)
      break;
    case "status":
      if (statusTypes.includes(args[0]?.toLowerCase())) {
        client.user.setStatus(args[0].toLowerCase())
        message.reply("Status updated!")
      } else message.reply(`**Usage:**\n> ${p}status (${statusTypes.join("|")})`)
      break;
    case "activity":
      const type = args[0]?.toLowerCase()
      const name = args.slice(type !== "streaming" ? 1 : 2).join(" ")
      const url = type === "streaming" ? args[1] : undefined
      if (args[1] && Object.keys(activityTypes).includes(type)) {
        client.user.setActivity({ name, url, type: activityTypes[type] })
        message.reply("Activity updated!")
      } else message.reply(`**Usage:**\n> ${p}activity (${Object.keys(activityTypes).join("|")}) <name|link>`)
      break;
    default:
      message.reply(`**Admin cmds:**\n> ${p}username, ${p}avatar, ${p}status, ${p}activity`)
      break;
  }
}

module.exports = {
  name: "messageCreate",
  /**
   * @param {Client} client
   * @param {Message} message
   */
  async execute(client, message) {
    if (client.admins?.includes(message.author.id) && client.prefix?.test(message.content)) executeAdminCommand(client, message)
    const admin = message.member?.permissions.has("ManageGuild");

    /**
     * @type {{ guild: Guild, channel: Channel, user: User }}
     */
    const data = {
      guild: (await db.has("guilds", message.guild.id))
        ? await db.get("guilds", message.guild.id)
        : new Guild(message.guild.id),
      channel: (await db.has("channels", message.channel.id))
        ? await db.get("channels", message.channel.id)
        : new Channel(message.channel.id),
      user: (await db.has("users", message.author.id))
        ? await db.get("users", message.author.id)
        : new User(message.author.id),
    };

    const locale = data.user.locale || data.channel.locale || data.guild.locale;

    if (!admin && !message.author.bot && data.channel.filter) {
      const { max, exclude, extensions } = data.channel.filter;

      if (max && message.attachments.size > max) {
        await message.delete()
        return message.author.send(i18n.get("filter.deleted.max", locale, { max, channel: message.channel.id }))
      };

      const fileExtensions = message.attachments.map((attachment) =>
        attachment.name.split(".").pop()
      );
      const match = extensions.some((extension) =>
        fileExtensions.includes(extension)
      );

      if ((exclude && match)) {
        await message.delete()
        return message.author.send(i18n.get("filter.deleted.exclude", locale, { extensions: extensions.join("` `"), channel: message.channel.id }))
      } else if ((!exclude && !match)) {
        await message.delete()
        return message.author.send(i18n.get("filter.deleted.include", locale, { extensions: extensions.join("` `"), channel: message.channel.id }))
      };
    }

    if (message.author.id !== client.user.id && data.channel.sticky) {
      const { content, color, lastId } = data.channel.sticky;

      const colorInt = parseInt(color.replace(/^#/, ""), 16)
      const cooldownKey = `sticky-${message.channelId}`;

      if (!cooldown.has(cooldownKey))
        cooldown.set(cooldownKey, 1, async () => {
          if (lastId) message.channel.messages.delete(lastId);

          const newMessage = await message.channel.send({
            embeds: [{ description: content, color: colorInt }],
          });

          data.channel.sticky.lastId = newMessage.id;
          db.set("channels", data.channel);
        });
    }
  },
};
