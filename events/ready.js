const { Client } = require("discord.js");
const i18n = require("../i18n");
const { log } = require("../logger");

module.exports = {
  name: "ready",
  once: true,
  /**
   * @param {Client} client 
   */
  async execute(client) {
    log(i18n.get("client.ready", { user: client.user.tag }));
  }
}