const {
  ChatInputCommandInteraction,
  Client,
  PermissionResolvable,
  ApplicationCommandOptionData,
  AttachmentBuilder,
  ApplicationCommandOptionType
} = require("discord.js");
const { User, Channel, Guild, db } = require("../db");
const sharp = require('sharp');
const i18n = require("../i18n");

function isHexColor(hex) {
  return /^([0-9A-F]{3}){1,2}$/i.test(hex);
}

module.exports = {
  name: "color",
  /**
   * @type {PermissionResolvable[]}
   */
  permissions: [],
  /**
   * @type {ApplicationCommandOptionData[]}
   */
  options: [{
    name: "hexcolor",
    description: "Hex Color for command",
    type: ApplicationCommandOptionType.String,
    required: true,
  }],
  /**
   * @param {{ receivedTime: Number, interaction: ChatInputCommandInteraction, client: Client, data: { guild: Guild, channel: Channel, user: User }, locale: String}}
   */
  async execute({ interaction, data, locale }) {
    let hexcolor = interaction.options.getString("hexcolor", true).replace(/^#/, "")
    if (!isHexColor(hexcolor)) return interaction.reply({ content: i18n.get("color.invalidHexColor", locale) })

    const icon = "M7.5-16.68,15-13.32v5a10.351,10.351,0,0,1-2.148,6.348A9.33,9.33,0,0,1,7.5,1.68,9.33,9.33,0,0,1,2.148-1.973,10.351,10.351,0,0,1,0-8.32v-5Zm1.758,4A2.435,2.435,0,0,0,7.5-13.4a2.435,2.435,0,0,0-1.758.723A2.361,2.361,0,0,0,5-10.918a2.425,2.425,0,0,0,.742,1.777A2.4,2.4,0,0,0,7.5-8.4a2.4,2.4,0,0,0,1.758-.742A2.425,2.425,0,0,0,10-10.918,2.361,2.361,0,0,0,9.258-12.676ZM7.5-6.836a8.754,8.754,0,0,0-2.031.273,6.19,6.19,0,0,0-2.051.9A1.74,1.74,0,0,0,2.5-4.258,6.007,6.007,0,0,0,4.707-2.383,5.947,5.947,0,0,0,7.5-1.6a5.947,5.947,0,0,0,2.793-.781A6.007,6.007,0,0,0,12.5-4.258a1.486,1.486,0,0,0-.547-1.094,4.2,4.2,0,0,0-1.348-.82A10.513,10.513,0,0,0,8.984-6.66,7.147,7.147,0,0,0,7.5-6.836Z"
    const buffer = Buffer.from(`<svg width="400" height="140">
        <rect width="400" height="70" fill="#2f3136"/>
        <rect width="5" height="140" fill="#${hexcolor}"/>
        <path d="${icon}" transform="translate(29 42)" fill="#${hexcolor}"/>
        <path d="${icon}" transform="translate(29 110)" fill="#${hexcolor}"/>
        <text transform="translate(50 42)" fill="#${hexcolor}" font-size="20" font-family="SegoeUI, Segoe UI"><tspan x="0" y="0">${interaction.user.tag}</tspan></text>
        <text transform="translate(50 110)" fill="#${hexcolor}" font-size="20" font-family="SegoeUI, Segoe UI"><tspan x="0" y="0">${interaction.user.tag}</tspan></text>
    </svg>`)
    let bufferEdited = await sharp(buffer).toBuffer();

    const attachment = new AttachmentBuilder(bufferEdited, { name: `${hexcolor}-${interaction.user.id}.png` });
    interaction.reply({ files: [attachment] })
  },
};
