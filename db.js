const { MongoClient, UpdateResult, DeleteResult } = require("mongodb");
const { error, log } = require("./logger");
const { defaultLocale } = require("./i18n");
const { Collection } = require("discord.js");
const i18n = require("./i18n");

class DB {
  /**
   * Check if the document exists in the collection
   * @param {String} collection - The collection to check in
   * @param {String} id - The id of the document
   * @returns {Promise<Boolean>} - Whether the document exists
   */
  async has(collection, id) {
    return new Promise((resolve, reject) => {
      if (!this.ready)
        return reject(i18n.get("db.notReady", i18n.defaultLocale));
      if (typeof id !== "string")
        return reject(i18n.get("db.noId", i18n.defaultLocale));
      const timeout = setTimeout(
        () =>
          reject(
            i18n.get("db.timeout", i18n.defaultLocale, { action: "read" })
          ),
        this.timeout
      );
      this.db
        .collection(collection)
        .findOne({ _id: id })
        .then((document) => {
          clearTimeout(timeout);
          resolve(document !== null);
        })
        .catch((err) => reject(err));
    });
  }
  /**
   * Set a document in a collection in the database
   * @param {String} collection - The collection to set the document in
   * @param {Object} data - The data to set
   * @returns {Promise<UpdateResult>} - The result of the update
   */
  async set(collection, data) {
    return new Promise((resolve, reject) => {
      if (!this.ready)
        return reject(i18n.get("db.notReady", i18n.defaultLocale));
      if (typeof data._id !== "string")
        return reject(i18n.get("db.noId", i18n.defaultLocale));
      const timeout = setTimeout(
        () =>
          reject(
            i18n.get("db.timeout", i18n.defaultLocale, { action: "update" })
          ),
        this.timeout
      );
      this.db
        .collection(collection)
        .updateOne({ _id: data._id }, { $set: data }, { upsert: true })
        .then((result) => {
          clearTimeout(timeout);
          log(
            i18n.get("db.updated", i18n.defaultLocale, {
              collection,
              id: data._id,
              modifiedCount: result.modifiedCount,
              upsertedCount: result.upsertedCount,
            })
          );
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }
  /**
   * Get a document by id from a collection in the database
   * @param {String} collection - The collection to get the document from
   * @param {String} id - The id of the document
   * @returns {Promise<Object>} - The document
   */
  async get(collection, id, skipCache = false) {
    return new Promise((resolve, reject) => {
      if (!this.ready)
        return reject(i18n.get("db.notReady", i18n.defaultLocale));
      if (typeof id !== "string")
        return reject(i18n.get("db.noId", i18n.defaultLocale));
      const timeout = setTimeout(
        () =>
          reject(
            i18n.get("db.timeout", i18n.defaultLocale, { action: "read" })
          ),
        this.timeout
      );
      if (!skipCache && this.cache[collection]?.has(id)) {
        clearTimeout(timeout);
        resolve(this.cache[collection].get(id));
      } else {
        this.db
          .collection(collection)
          .findOne({ _id: id })
          .then((document) => {
            clearTimeout(timeout);
            resolve(document);
          })
          .catch((err) => reject(err));
      }
    });
  }
  /**
   * Delete a document by id from a collection in the database
   * @param {String} collection
   * @param {String} id
   * @returns {Promise<DeleteResult>}
   */
  async delete(collection, id) {
    return new Promise((resolve, reject) => {
      if (!this.ready)
        return reject(i18n.get("db.notReady", i18n.defaultLocale));
      if (typeof id !== "string")
        return reject(i18n.get("db.noId", i18n.defaultLocale));
      const timeout = setTimeout(
        () =>
          reject(
            i18n.get("db.timeout", i18n.defaultLocale, { action: "delete" })
          ),
        this.timeout
      );
      this.db
        .collection(collection)
        .deleteOne({ _id: id })
        .then((result) => {
          clearTimeout(timeout);
          log(
            i18n.get("db.deleted", i18n.defaultLocale, {
              collection,
              id,
              deletedCount: result.deletedCount,
            })
          );
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }
  /**
   * @param {String} URI - The URI of the database
   * @param {Number} timeout - The timeout of functions
   */
  constructor(URI, options) {
    this.URI = URI;
    this.ready = false;
    this.timeout = options?.timeout || 5000;

    this.cache = {
      guilds: new Collection(),
    };

    this.client = new MongoClient(URI, { ignoreUndefined: true });

    this.client
      .connect()
      .then(async () => {
        log(i18n.get("db.connected", i18n.defaultLocale));
        this.db = this.client.db();
        this.ready = true;

        this.changeStream = this.db.watch([
          {
            $match: {
              operationType: { $in: ["delete", "insert", "replace", "update"] },
            },
          },
        ]);
        this.changeStream.on("change", async (change) => {
          if (change.operationType === "delete")
            this.cache[change.ns.coll]?.delete(change.documentKey._id);
          else if (change.operationType === "update")
            this.cache[change.ns.coll]?.set(
              change.documentKey._id,
              await this.get(change.ns.coll, change.documentKey._id, true)
            );
          else
            this.cache[change.ns.coll]?.set(
              change.documentKey._id,
              change.fullDocument
            );
        });
      })
      .catch(error);
  }
}

class Guild {
  /**
   * @param {String} id
   * @param {{ locale?: String }} data
   */
  constructor(id, data) {
    this._id = id;
    this.locale = data?.locale || defaultLocale;
  }
}
class Channel {
  /**
   * @param {String} id
   * @param {String} guildId
   * @param {{ locale?: String, blacklisted?: Boolean }} data
   */
  constructor(id, guildId, data) {
    this._id = id;
    this.guildId = guildId;
    this.locale = data?.locale || null;
    this.blacklisted = !!data?.blacklisted;
  }
}
class User {
  /**
   * @param {String} id
   * @param {{ locale?: String, blacklisted?: Boolean }} data
   */
  constructor(id, data) {
    this._id = id;
    this.locale = data?.locale || null;
    this.blacklisted = !!data?.blacklisted;
  }
}

const db = new DB(process.env.MONGO_URI || "", { timeout: 10000 });

module.exports = { db, DB, Guild, Channel, User };
