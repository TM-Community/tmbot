const { Client, Interaction } = require("discord.js");
const { db, Guild, Channel, User } = require("../db.js");
const i18n = require("../i18n.js");

module.exports = {
  name: "interactionCreate",
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  async execute(client, interaction) {
    const receivedTime = Date.now();
    if (!interaction.inCachedGuild())
      return interaction.reply({
        content: i18n.get("interaction.notInGuild", locale),
        ephemeral: true,
      });

    if (!(await db.has("guilds", interaction.guildId)))
      await db.set("guilds", new Guild(interaction.guildId));
    if (!(await db.has("channels", interaction.channelId)))
      await db.set("channels", new Channel(interaction.channelId));
    if (!(await db.has("users", interaction.member.id)))
      await db.set("users", new User(interaction.member.id));

    /**
     * @type {{ guild: Guild, channel: Channel, user: User }}
     */
    const data = {
      guild: await db.get("guilds", interaction.guildId),
      channel: await db.get("channels", interaction.channelId),
      user: await db.get("users", interaction.member.id),
    };

    const locale = data.user.locale || data.channel.locale || data.guild.locale;

    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command)
        return interaction.reply({
          content: i18n.get("interaction.notCommand", locale, {
            command: interaction.commandName,
          }),
          ephemeral: true,
        });

      const userPermissions = interaction.channel.permissionsFor(
        interaction.member
      );
      const missingPermissions = command.permissions?.filter(
        (permission) => !userPermissions.has(permission)
      );
      if (missingPermissions?.length > 0)
        return interaction.reply({
          content: i18n.get("interaction.missingPermissions", locale, {
            permissions: missingPermissions.join(", "),
            user: interaction.member.id,
          }),
          ephemeral: true,
        });

      command.execute({ receivedTime, interaction, data, client, locale });
    }
  },
};
