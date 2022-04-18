const { WebhookClient } = require("discord.js");

class Logger {
  log = (message) =>
    console.log(this.getTime(), message);
  warn = (message) =>
    console.warn(this.getTime(), message);
  error = (message) =>
    console.error(this.getTime(), message);
  getTime = () => `[${new Date().toLocaleTimeString()}]`;
  /**
   * @param {{ logsWebhookUrl: String, warnsWebhookUrl: String, errorsWebhookUrl: String, }} options
   */
  constructor(options) {
    if (options?.webhookUrl) {

      this.logsWebhook = new WebhookClient({ url: options?.logsWebhookUrl });
      this.warnsWebhook = new WebhookClient({ url: options?.warnsWebhookUrl });
      this.errorsWebhook = new WebhookClient({ url: options?.errorsWebhookUrl });

      this.log = (message) => {
        const time = this.getTime();
        this.logsWebhook.send(`${time} ${message}`);
        console.log(time, message);
      };
      this.warn = (message) => {
        const time = this.getTime();
        this.errorsWebhook.send(`${time} ${message}`);
        console.warn(time, message);
      };
      this.error = (message) => {
        const time = this.getTime();
        this.errorsWebhook.send(`${time} ${message}`);
        console.error(time, message);
      };
    }
  }
}

module.exports = new Logger({
  logsWebhookUrl: process.env.LOGS_WEBHOOK_URL,
  warnsWebhookUrl: process.env.WARNS_WEBHOOK_URL,
  errorsWebhookUrl: process.env.ERRORS_WEBHOOK_URL
});