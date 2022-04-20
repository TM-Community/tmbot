const { CommandInteraction, Client } = require("discord.js");
const ms = require("ms");
const { User, Channel, Guild } = require("../db");
const i18n = require("../i18n");

module.exports = {
  name: "ping",
  /**
   * @param {{ receivedTime: Number, interaction: CommandInteraction, client: Client, data: { guild: Guild, channel: Channel, user: User }, locale: String}}
   */
  async execute({ receivedTime, interaction, client, locale }) {
    const responseTime = Date.now();
    const ping = responseTime - receivedTime;
    interaction.reply({
      content: i18n.get("ping.response", locale, {
        ping,
        ws: client.ws.ping,
        uptime: ms(client.uptime, { long: true }),
      }),
    });
  },
};
