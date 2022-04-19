const { loadFiles } = require("./fs");
const { join } = require("path");
const { warn } = require("./logger");

class I18n {
  directory = join(__dirname, "locales");
  extension = "json";
  returnEmptyString = false;
  default = "en";
  retryInDefault = true;
  mustache = ["{{", "}}"];
  isDev = process.env.DEVELOPMENT;
  /**
   * Get RegExp to match a string with mustache
   * @param {String} string - String to match
   * @returns {RegExp} - The RegExp
   */
  mustacheRegex(string) {
    const [start, end] = this.mustache;
    return new RegExp(
      `${escapeRegExp(start)}${string}${escapeRegExp(end)}`,
      "g"
    );
  }
  /**
   * Check if a translation exists
   * @param {String} path
   * @param {String} locale
   * @returns {Boolean} - If the translation exists
   */
  has(path, locale) {
    if (!locale) locale = this.default;
    path = path.split(".");

    if (!this.strings.has(locale) || !this.strings.get(locale).has(path[0]))
      return false;

    let string = this.strings.get(locale).get(path[0]);

    for (let i = 1; i < path.length; i++) {
      if (string[path[i]]) string = string[path[i]];
      else return false;
    }

    return true;
  }
  /**
   * Get translation
   * @param {String} path - Path to the translation e.g. "user.name"
   * @param {Object} variables - Variables to replace in the translation
   * @param {String} locale - Locale to get the translation from
   * @returns {String} - The translation
   */
  get(path, variables, locale) {
    if (!locale) locale = this.default;
    path = path.split(".");
    let string;

    if (this.has(path.join("."), locale)) {
      string = this.strings.get(locale).get(path[0]);
    } else {
      if (this.retryInDefault) {
        if (locale !== this.default && this.has(path.join("."), this.default))
          return this.get(path.join("."), variables, this.default);

        if (this.isDev) {
          if (this.has(path.join("."), "source"))
            return this.get(path.join("."), variables, "source");

          warn(`Translation not found for ${path.join(".")}`);
        }
      }

      return this.returnEmptyString ? "" : path.join(".");
    }

    for (let i = 1; i < path.length; i++) {
      if (string[path[i]]) string = string[path[i]];
      else return this.returnEmptyString ? "" : path.join(".");
    }

    if (variables)
      for (let variable in variables) {
        string = string.replace(
          this.mustacheRegex(escapeRegExp(variable)),
          variables[variable]
        );
      }

    return string;
  }
  constructor() {
    this.strings = loadFiles(this.directory, this.extension, {
      exclude: this.isDev ? undefined : RegExp(`${this.directory}/source`),
    });
    this.locales = this.strings.map((_value, key) => key);
  }
}

/**
 * Escape RegExp
 * @param {String} string - RegExp to escape
 * @returns {String} - The escaped RegExp
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

module.exports = new I18n();
