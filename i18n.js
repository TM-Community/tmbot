const { loadFiles } = require("./fs");
const { join } = require("path");
const { warn } = require("./logger");

class I18n {
  directory = join(__dirname, "locales");
  extension = "json";
  returnEmptyString = false;
  defaultLocale = "en";
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
    if (!locale) locale = this.defaultLocale;
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
   * @param {String} locale - Locale to get the translation from
   * @param {Object} variables - Variables to replace in the translation
   * @returns {String} - The translation
   */
  get(path, locale = this.defaultLocale, variables = {}) {
    const empty = () => {
      warn(`No translation found for ${path}`);
      return this.returnEmptyString ? "" : path;
    };
    let pathArray = path.split(".");
    let string;

    if (!this.has(path, locale)) {
      if (this.retryInDefault) {
        if (this.has(path, this.defaultLocale))
          return this.get(path, this.defaultLocale, variables);

        if (this.isDev && this.has(path, "source"))
          return this.get(path, "source", variables);
      }

      return empty();
    }

    string = this.strings.get(locale).get(pathArray[0]);
    for (let i = 1; i < pathArray.length; i++) {
      if (string[pathArray[i]]) string = string[pathArray[i]];
      else return empty();
    }

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
