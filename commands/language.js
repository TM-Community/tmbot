const {
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
  ChannelType
} = require("discord.js");
const { User, Channel, Guild, db } = require("../db");
const i18n = require("../i18n");

module.exports = {
  name: "language",
  /**
   * @type {ApplicationCommandOptionData[]}
   */
  options: [
    {
      name: "locale",
      description: "The language to change to",
      choices: i18n.locales.map((value) => ({ name: value, value })),
      type: ApplicationCommandOptionType.String,
      required: true
    },
    {
      name: "channel",
      description: "Optional channel to apply language override in",
      channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      type: ApplicationCommandOptionType.Channel
    }
  ],
  /**
   * @param {{ receivedTime: Number, interaction: ChatInputCommandInteraction, client: Client, data: { guild: Guild, channel: Channel, user: User }, locale: String}}
   */
  async execute({ interaction, data }) {
    const newLocale = interaction.options.getString("locale", true);
    const channel = interaction.options.getChannel("channel");

    await interaction.deferReply();

    const mode = channel ? "channel" : "guild";

    data[mode].locale = newLocale;
    await db.set(`${mode}s`, data[mode]);

    interaction.editReply({
      content: i18n.get(`language.set.${mode}`, newLocale, {
        channel: channel.id,
        locale: newLocale
      })
    });
  }
};
