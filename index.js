/**
 *
 * @name tmbot
 * @author 8bou3 <i8bou3@gmail.com>
 * @license MIT
 * @copyright (c) 2022 8bou3
 *
 */

require("dotenv").config();
const { error } = require("./logger.js")

process.on("unhandledRejection", (r, p) => error(r, p));
process.on("uncaughtException", (e, o) => error(e, o));
process.on("uncaughtExceptionMonitor", (e, o) => error(e, o));
process.on("multipleResolves", (t, p, v) => error(t, v, p));

const { Client } = require("discord.js");
const { join } = require("path")
const { loadFiles } = require("./fs");

const client = new Client({
  intents: [],
})

loadFiles(join(__dirname, "events"), "js", { oneCollection: true }).each((event) => {
  if (event.once) client.once(event.name, (...args) => event.execute(client, ...args));
  else client.on(event.name, (...args) => event.execute(client, ...args));
})

client.login(process.env.TOKEN)