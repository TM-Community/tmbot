const { Collection } = require("discord.js");

class Cooldown {
  /**
   * Check if 'key' is on cooldown
   * @param {String} key - The key to check
   * @returns {Boolean} - is on cooldown
   */
  has(key) {
    if (this.timestamps.has(key)) {
      if (this.timestamps.get(key) > Date.now()) return true;
      this.timestamps.delete(key);
      return false;
    }
    return false;
  }
  /**
   * Set timeout for an existing cooldown
   * @param {String} key
   * @param {() => void} callback
   */
  addTimeout(key, callback) {
    if (!this.has(key)) return callback();
    this.timeouts.set(key, setTimeout(callback, this.timeLeft(key) * 1000));
  }
  /**
   * Set cooldown for 'key'
   * @param {String} key - The key to set
   * @param {Number} amount - The cooldown in seconds
   * @param {() => void} callback - The callback to run when cooldown is over
   */
  set(key, amount, callback) {
    const amountInMS = amount * 1000;
    this.timestamps.set(key, Date.now() + amountInMS);
    if (callback) this.timeouts.set(key, setTimeout(callback, amountInMS));
  }
  /**
   * Get time left for 'key' in seconds
   * @param {String} key - The key to get time left for
   * @returns {Number} - Time left in seconds
   */
  timeLeft(key) {
    return (this.timestamps.get(key) - Date.now()) / 1000;
  }
  /**
   * @param {Collection<String, Number>} timestamps
   */
  constructor(timestamps = new Collection()) {
    /**
     * End time of cooldowns
     * @type {Collection<String, Number>}
     */
    this.timestamps = timestamps;

    this.timeouts = new Collection();
  }
}

module.exports = new Cooldown();
