/**
 *
 * @name tmbot
 * @author 8bou3 <i8bou3@gmail.com>
 * @license MIT
 * @copyright (c) 2022 8bou3
 *
 */

require("dotenv").config();
const { error } = require("./logger.js");

process.on("unhandledRejection", (r, p) => error(r, p));
process.on("uncaughtException", (e, o) => error(e, o));
process.on("uncaughtExceptionMonitor", (e, o) => error(e, o));

require("./db.js");
const { Client } = require("discord.js");
const { join } = require("path");
const { loadFiles } = require("./fs");

const client = new Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

client.admins = process.env.ADMINS?.split(/,+/)

loadFiles(join(__dirname, "events"), "js", { oneCollection: true }).each(
  (event) => {
    const execute = (...args) => event.execute(client, ...args);

    if (event.once) client.once(event.name, execute);
    else client.on(event.name, execute);
  }
);

client.commands = loadFiles(join(__dirname, "commands"), "js", {
  oneCollection: true,
});

client.login(process.env.TOKEN);
