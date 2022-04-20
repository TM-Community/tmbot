const i18n = require("../i18n");

module.exports = {
  name: "ping",
  async execute({ receivedTime, interaction, data, client, locale }) {
    const responseTime = Date.now();
    const ping = responseTime - receivedTime;
    interaction.reply({
      content: i18n.get("ping.response", locale, {
        ping,
        ws: client.ws.ping,
      }),
    });
  },
};
