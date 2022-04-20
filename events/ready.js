const { Client } = require("discord.js");
const { db } = require("../db.js");
const i18n = require("../i18n");
const { log } = require("../logger");

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

    setTimeout(async () => {
      for (const guild of client.guilds.cache.values()) {
        let count = 0;
        const locale = (await db.has("guilds", guild.id))
          ? (await db.get("guilds", guild.id)).locale
          : i18n.defaultLocale;
        let commands = [];
        for (const command of client.commands.values()) {
          let commandData = {
            name: i18n.get(`${command.name}.name`, locale),
            description: i18n.get(`${command.name}.description`, locale),
            options: command.options,
          };
          commands.push(commandData);
          count++;
        }
        guild.commands.set(commands);
      }
    }, 10000);
  },
};
