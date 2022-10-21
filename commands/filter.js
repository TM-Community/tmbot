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

module.exports = {
  name: "filter",
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
      description: "Setup filters for a channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "mode",
          description: "Whether to exclude or include.",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "Delete any file has none of the extensions",
              value: "include",
            },
            {
              name: "Delete any file has one of the extensions",
              value: "exclude",
            },
          ],
          required: true,
        },
        {
          name: "extensions",
          description:
            "Extensions to include/exclude (Keep whitespace between each extension)",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "max",
          description: "Maximum number of attachments per message",
          type: ApplicationCommandOptionType.Integer,
          minValue: 1,
          maxValue: 10
        },
        {
          name: "channel",
          description: "Channel to set filters in",
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        },
      ],
    },
    {
      name: "reset",
      description: "Reset filters for a channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "Channel to reset filters in (default is current)",
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
        content: i18n.get("filter.notChannel", locale, {
          channel: channel.id,
        }),
        ephemeral: true,
      });

    switch (options.getSubcommand()) {
      case i18n.get("filter.setup.name", data.guild.locale):
        const exclude = options.getString("mode", true) === "exclude";

        let max = options.getInteger("max") ?? 10
        let extensions = options.getString("extensions", true).split(/ /g);

        await interaction.deferReply();

        extensions = extensions.map((extension) =>
          extension.startsWith(".") ? extension.slice(1) : extension
        );

        data.channel.filter = { exclude, max, extensions };

        await db.set("channels", data.channel);

        interaction.editReply({
          content: i18n.get("filter.set", locale, {
            channel: channel.id,
            mode: exclude ? "exclude" : "include",
            max,
            extensions: extensions.join("`, `."),
          }),
        });
        break;

      case i18n.get("filter.reset.name", data.guild.locale):
        await interaction.deferReply();

        data.channel.filter = null;
        await db.set("channels", data.channel);

        interaction.editReply({
          content: i18n.get("filter.cleared", locale, { channel: channel.id }),
        });
        break;
    }
  },
};
