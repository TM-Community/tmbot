const { db } = require("./db.js");
const i18n = require("./i18n");
const { Client, Guild } = require("discord.js");

function getOptions(optionsPath, options, locale) {
  options = options?.map((option) => {
    const optionPath = `${optionsPath}.${option.name}`;
    const name = i18n.get(`${optionPath}.name`, locale);
    const noName = [`${optionPath}.name`, ""].includes(name);
    const description = i18n.get(`${optionPath}.description`, locale);
    const noDescription = [`${optionPath}.description`, ""].includes(
      description
    );

    function choiceMapper(choice) {
      const choicePath = `${optionPath}.${choice.value}`;
      const choiceName = i18n.get(choicePath, locale);
      const noChoiceName = [choicePath, ""].includes(choiceName);
      return {
        name: noChoiceName ? choice.name : choiceName,
        value: choice.value,
      };
    }

    option.choices = option.choices?.map(choiceMapper);
    return {
      name: noName ? option.name : name,
      description: noDescription ? option.description : description,
      type: option.type,
      required: option.required,
      options: getOptions(optionPath, option.options, locale),
      choices: option.choices,
    };
  });
  return options;
}

/**
 * @param {Client} client
 * @param {Guild} guild
 */
async function loadSlashCommands(client, guild) {
  const locale = (await db.has("guilds", guild.id))
    ? (await db.get("guilds", guild.id)).locale
    : i18n.defaultLocale;
  let commands = [];
  for (const command of client.commands.values()) {
    let commandData = {
      name: i18n.get(`${command.name}.name`, locale),
      description: i18n.get(`${command.name}.description`, locale),
      options: getOptions(command.name, command.options, locale),
    };
    commands.push(commandData);
  }
  await guild.commands.set(commands);
}

module.exports = {
  loadSlashCommands,
  getOptions,
};
