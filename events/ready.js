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
      let count = 0;
      for (const guild of client.guilds.cache.values()) {
        const locale = (await db.has("guilds", guild.id))
          ? (await db.get("guilds", guild.id)).locale
          : i18n.defaultLocale;
        let commands = [];
        for (const command of client.commands.values()) {
          let commandData = {
            name: i18n.get(`${command.name}.name`, locale),
            description: i18n.get(`${command.name}.description`, locale),
            options: getOptions(command.name, command.options, locale) || null,
          };
          commands.push(commandData);
        }
        count++;
        guild.commands.set(commands);
      }
      log(i18n.get("client.slashCommands", i18n.defaultLocale, { count }));
    }, 10000);
  },
};

//--- DONT READ THIS SHIT IF YOU WANT TO KEEP YOUR EYES ---\\

function getOptions(optionsPath, options, locale) {
  let commandOptions = [];
  if (options)
    for (const option of options) {
      let choices = [];
      if (option.choices)
        for (const choice of option.choices) {
          let choiceData = {
            name: i18n.get(
              `${optionsPath}.${option.name}.${choice.value}`,
              locale
            ),
            value: choice.value,
          };
          if (
            [`${optionsPath}.${option.name}.${choice.value}`, ""].includes(
              choiceData.name
            )
          )
            choiceData.name = choice.name;
          choices.push(choiceData);
        }
      let optionData = {
        name: i18n.get(`${optionsPath}.${option.name}.name`, locale),
        description: i18n.get(
          `${optionsPath}.${option.name}.description`,
          locale
        ),
        type: option.type,
        required: option.required,
        options: option.options
          ? getOptions(`${optionsPath}.${option.name}`, option.options, locale)
          : null,
        choices: choices || null,
      };
      if ([`${optionsPath}.${option.name}.name`, ""].includes(optionData.name))
        optionData.name = option.name;
      if (
        [`${optionsPath}.${option.name}.description`, ""].includes(
          optionData.description
        )
      )
        optionData.description =
          option.description || "No description provided";
      commandOptions.push(optionData);
    }
  return commandOptions;
}
