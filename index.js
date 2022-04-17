/**
 *
 * @name tmbot
 * @author 8bou3 <i8bou3@gmail.com>
 * @license MIT
 * @copyright (c) 2022 8bou3
 *
 */

require("dotenv").config();

process.on("unhandledRejection", (r, p) => console.error(r, p));
process.on("uncaughtException", (e, o) => console.error(e, o));
process.on("uncaughtExceptionMonitor", (e, o) => console.error(e, o));
process.on("multipleResolves", (t, p, v) => console.error(t, v, p));

const { Client } = require("discord.js");

const client = new Client({
  intents: [],
})

client.login(process.env.TOKEN)