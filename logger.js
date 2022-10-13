const { WebhookClient } = require("discord.js");

const getTime = () => `[${new Date().toLocaleTimeString()}]`
class Logger {
  log = (message) => console.log(getTime(), message);
  warn = (message) => console.warn(getTime(), message);
  error = (message) => console.error(getTime(), message);
  /**
   * @param {{ logsWebhookUrl: String, warnsWebhookUrl: String, errorsWebhookUrl: String, }} options
   */
  constructor(options) {
    if (options?.logsWebhookUrl) {
      this.logsWebhook = new WebhookClient({ url: options?.logsWebhookUrl });
      this.log = (message) => {
        this.logsWebhook.send(`${getTime()} ${message}`);
        console.log(getTime(), message);
      };
    }
    if (options?.warnsWebhookUrl) {
      this.warnsWebhook = new WebhookClient({ url: options?.warnsWebhookUrl });
      this.warn = (message) => {
        this.errorsWebhook.send(`${getTime()} ${message}`);
        console.warn(getTime(), message);
      };
    }
    if (options?.errorsWebhookUrl) {
      this.errorsWebhook = new WebhookClient({ url: options.errorsWebhookUrl });
      this.error = (message) => {
        this.errorsWebhook.send(`${getTime()} ${message}`);
        console.error(getTime(), message);
      };
    }
  }
}

module.exports = new Logger({
  logsWebhookUrl: process.env.LOGS_WEBHOOK_URL,
  warnsWebhookUrl: process.env.WARNS_WEBHOOK_URL,
  errorsWebhookUrl: process.env.ERRORS_WEBHOOK_URL
});
