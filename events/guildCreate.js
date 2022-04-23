const { Client, Guild } = require("discord.js");
const i18n = require("../i18n");
const { loadSlashCommands } = require("../loadSlashCommands");
const { log } = require("../logger");

module.exports = {
  name: "guildCreate",
  /**
   * @param {Client} client
   * @param {Guild} guild
   */
  async execute(client, guild) {
    log(
      i18n.get("client.guildCreate", i18n.defaultLocale, {
        guild: guild.name,
        id: guild.id,
      })
    );

    setTimeout(async () => {
      await loadSlashCommands(client, guild);
      log(i18n.get("client.slashCommands", i18n.defaultLocale, { count: 1 }));
    }, 10000);
  },
};
