const {
  CommandInteraction,
  Client,
  PermissionString,
  ApplicationCommandOptionData,
} = require("discord.js");
const { User, Channel, Guild, db } = require("../db");
const i18n = require("../i18n");

function isHexColor(hex) {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
}

module.exports = {
  name: "sticky",
  /**
   * @type {PermissionString[]}
   */
  permissions: ["MANAGE_MESSAGES"],
  /**
   * @type {ApplicationCommandOptionData[]}
   */
  options: [
    {
      name: "setup",
      description: "Setup sticky message in a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "content",
          description: "The content of the sticky message",
          type: "STRING",
          required: true,
        },
        {
          name: "color",
          description: "The hex color of the sticky message embed",
          type: "STRING",
        },
        {
          name: "channel",
          description: "Channel to set sticky message in",
          type: "CHANNEL",
          channelTypes: ["GUILD_TEXT", "GUILD_NEWS"],
        },
      ],
    },
    {
      name: "reset",
      description: "Remove sticky message from a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "channel",
          description:
            "Channel to remove sticky message from (default is current)",
          type: "CHANNEL",
        },
      ],
    },
  ],
  /**
   * @param {{ receivedTime: Number, interaction: CommandInteraction, client: Client, data: { guild: Guild, channel: Channel, user: User }, locale: String}}
   */
  async execute({ interaction, data, locale }) {
    const { options } = interaction;
    const channel = options.getChannel("channel") ?? interaction.channel;

    if (!channel || !["GUILD_TEXT", "GUILD_NEWS"].includes(channel.type))
      return interaction.reply({
        content: i18n.get("sticky.notChannel", locale, {
          channel: channel.id,
        }),
        ephemeral: true,
      });

    await interaction.deferReply();

    /**
     * @type {Channel}
     */
    let channelData = (await db.has("channels", channel.id))
      ? await db.get("channels", channel.id)
      : new Channel(channel.id);

    switch (options.getSubcommand()) {
      case i18n.get("sticky.setup.name", data.guild.locale, {}, "setup"):
        const content = options.getString("content", true);
        let color = options.getString("color") ?? "#ff0000";

        if (!color.startsWith("#")) color = `#${color}`;
        if (!isHexColor(color))
          return interaction.editReply({
            content: i18n.get("sticky.invalidColor", locale, { color }),
            ephemeral: true,
          });

        channelData.sticky = { content, color };
        await db.set("channels", channelData);

        interaction.editReply({
          content: i18n.get("sticky.set", locale, { channel: channel.id }),
          embeds: [{ description: content, color }],
        });
        break;

      case i18n.get("sticky.reset.name", data.guild.locale, {}, "reset"):
        channelData.sticky = null;
        await db.set("channels", channelData);

        interaction.editReply({
          content: i18n.get("sticky.cleared", locale, { channel: channel.id }),
        });
        break;
      default:
        interaction.editReply({ content: "Invalid subcommand" });
        break;
    }
  },
};
