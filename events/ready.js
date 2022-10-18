const { Client } = require("discord.js");
const i18n = require("../i18n");
const { loadSlashCommands } = require("../loadSlashCommands");
const { log } = require("../logger");
const { db } = require("../db")

module.exports = {
  name: "ready",
  once: true,
  /**
   * @param {Client} client
   */
  async execute(client) {
    log(
      i18n.get("client.ready", i18n.defaultLocale, { user: client.user.tag })
    );

    client.prefix = RegExp(`^((<@!?)?${client.user.id}>?|${process.env.PREFIX ?? "="})\\s*`)

    if (db.ready) loadGuildsSlashCommands(client)
    else db.once("ready", () => loadGuildsSlashCommands(client))
  },
};

async function loadGuildsSlashCommands(client) {
  let count = 0;
  for (const guild of client.guilds.cache.values()) {
    await loadSlashCommands(client, guild);
    count++;
  }
  log(i18n.get("client.slashCommands", i18n.defaultLocale, { count }));
}
