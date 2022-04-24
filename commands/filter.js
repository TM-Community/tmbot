const {
  CommandInteraction,
  Client,
  PermissionString,
  ApplicationCommandOptionData,
} = require("discord.js");
const { User, Channel, Guild, db } = require("../db");
const i18n = require("../i18n");

module.exports = {
  name: "filter",
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
      description: "Setup filters for a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "mode",
          description: "Whether to exclude or include.",
          type: "STRING",
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
          type: "STRING",
          required: true,
        },
        {
          name: "channel",
          description: "Channel to set filters in",
          type: "CHANNEL",
          channelTypes: ["GUILD_TEXT", "GUILD_NEWS"],
        },
      ],
    },
    {
      name: "reset",
      description: "Reset filters for a channel",
      type: "SUB_COMMAND",
      options: [
        {
          name: "channel",
          description: "Channel to reset filters in (default is current)",
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
        content: i18n.get("filter.notChannel", locale, {
          channel: channel.id,
        }),
        ephemeral: true,
      });

    switch (options.getSubcommand()) {
      case i18n.get("filter.setup.name", data.guild.locale):
        const exclude = options.getString("mode", true) === "exclude";

        let extensions = options.getString("extensions", true).split(/ /g);

        await interaction.deferReply();

        extensions = extensions.map((extension) =>
          extension.startsWith(".") ? extension.slice(1) : extension
        );

        data.channel.filter = { exclude, extensions };

        await db.set("channels", data.channel);

        interaction.editReply({
          content: i18n.get("filter.set", locale, {
            channel: channel.id,
            mode: exclude ? "exclude" : "include",
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
