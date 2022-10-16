const {
  ChatInputCommandInteraction,
  Client,
  PermissionResolvable,
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ChannelType,
} = require("discord.js");
const { User, Channel, Guild, db } = require("../db");
const i18n = require("../i18n");

function isHexColor(hex) {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
}

module.exports = {
  name: "sticky",
  /**
   * @type {PermissionResolvable[]}
   */
  permissions: ["ManageMessages"],
  /**
   * @type {ApplicationCommandOptionData[]}
   */
  options: [
    {
      name: "setup",
      description: "Setup sticky message in a channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "content",
          description: "The content of the sticky message",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "color",
          description: "The hex color of the sticky message embed",
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "channel",
          description: "Channel to set sticky message in",
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        },
      ],
    },
    {
      name: "reset",
      description: "Remove sticky message from a channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description:
            "Channel to remove sticky message from (default is current)",
          type: ApplicationCommandOptionType.Channel,
        },
      ],
    },
  ],
  /**
   * @param {{ receivedTime: Number, interaction: ChatInputCommandInteraction, client: Client, data: { guild: Guild, channel: Channel, user: User }, locale: String}}
   */
  async execute({ interaction, data, locale }) {
    const { options } = interaction;
    const channel = options.getChannel("channel") ?? interaction.channel;

    if (channel?.type !== ChannelType.GuildText && channel?.type !== ChannelType.GuildAnnouncement)
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
        const content = options.getString("content", true).replace(/\n|\\n|\/n/g, "\n");
        let color = options.getString("color") ?? "#ff0000";

        if (!color.startsWith("#")) color = `#${color}`;
        if (!isHexColor(color))
          return interaction.editReply({
            content: i18n.get("sticky.invalidColor", locale, { color }),
            ephemeral: true,
          });

        const colorInt = parseInt(color.replace(/^#/, ""), 16)

        channelData.sticky = { content, color };
        await db.set("channels", channelData);

        interaction.editReply({
          content: i18n.get("sticky.set", locale, { channel: channel.id }),
          embeds: [{ description: content, color: colorInt }],
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
