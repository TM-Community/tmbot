const { Client, Interaction } = require("discord.js");
const cooldown = require("../cooldown.js");
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
      return interaction.channel?.send(i18n.get("interaction.notInGuild", locale));

    /**
     * @type {{ guild: Guild, channel: Channel, user: User }}
     */
    const data = {
      guild: (await db.has("guilds", interaction.guildId))
        ? await db.get("guilds", interaction.guildId)
        : new Guild(interaction.guildId),
      channel: (await db.has("channels", interaction.channelId))
        ? await db.get("channels", interaction.channelId)
        : new Channel(interaction.channelId),
      user: (await db.has("users", interaction.member.id))
        ? await db.get("users", interaction.member.id)
        : new User(interaction.member.id),
    };

    const locale = data.user.locale || data.channel.locale || data.guild.locale;

    if (interaction.isChatInputCommand()) {
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

      const cooldownKey = `command-${interaction.commandName}-${interaction.member.id}`;
      if (cooldown.has(cooldownKey))
        return interaction.reply({
          content: i18n.get("interaction.cooldown", locale, {
            time: cooldown.timeLeft(cooldownKey),
          }),
          ephemeral: true,
        });

      cooldown.set(cooldownKey, command.cooldown ?? 3);

      command.execute({ receivedTime, interaction, data, client, locale });
    }
  },
};
