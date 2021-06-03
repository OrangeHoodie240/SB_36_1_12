/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require('../config');
const db = require('../db');
const bcrypt = require('bcrypt');
const ExpressError = require('../expressError');
/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const password_hash = await bcrypt.hash(password, 12);
    try {
      let now = new Date();
      let results = await db.query(`INSERT INTO users(username, password, first_name, last_name, phone, join_at, last_login_at)
                                    VALUES($1, $2, $3, $4, $5, $6, $7)
                                    RETURNING  username, password, first_name, last_name, phone`,
        [username, password_hash, first_name, last_name, phone, now, now]);

        results = results.rows[0];

        return results;
    }
    catch (err) {
      throw new ExpressError('Unable to register user', 400);
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      let results = await db.query(`SELECT password 
                                    FROM users 
                                    WHERE username=$1`,
                                    [username]);
      results = results.rows[0];
      const valid = await bcrypt.compare(password, results.password);
      return valid;
    }
    catch (err) {
      throw new ExpressError('Authentication Failed', 400);
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      let results = await db.query(`UPDATE users 
                                    SET last_login_at=$1
                                    WHERE username=$2
                                    RETURNING username`,
        [new Date(), username]);
      
    }
    catch (err) {
      throw new ExpressError("User does not exist", 500);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    try {
      let results = await db.query(`SELECT username, first_name, last_name, phone
                                    FROM users`);
      results = results.rows;
      return results;
    }
    catch (err) {
      throw new ExpressError("Unable to get all users", 500);
    }
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      let results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at
                                   FROM users 
                                   WHERE username=$1`,
        [username]);
      results = results.rows[0];
      return results;
    }
    catch (err) {
      throw new ExpressError('User does not exist', 500);
    }

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try {
      let results = await db.query(`SELECT id, to_username, body, sent_at, read_at
                                    FROM messages
                                    WHERE from_username=$1`,
        [username]);
      results = results.rows;
      let to_users = [];
      for (let i = 0; i < results.length; i++) {
        let { to_username } = results[i];
        let promise = User.get(to_username);
        to_users.push(promise);
      }
      to_users = await Promise.all(to_users);

      for (let i = 0; i < results.length; i++) {
        let { username, first_name, last_name, phone } = to_users[i];
        let to_user = { username, first_name, last_name, phone };
        results[i].to_user = to_user;

        delete results[i].to_username;
      }

      return results;
    }
    catch (err) {
      throw new ExpressError('Unable to retrieve messages from ' + username, 500);
    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    try {
      let results = await db.query(`SELECT id, from_username, body, sent_at, read_at
                                    FROM messages
                                    WHERE to_username=$1`,
                                    [username]);
      results = results.rows;
      let from_users = [];
      for (let i = 0; i < results.length; i++) {
        let from_user = db.query(`SELECT username, first_name, last_name, phone
                                  FROM users 
                                  WHERE username=$1`,
          [results[i].from_username]);
        from_users.push(from_user);
      }
      from_users = await Promise.all(from_users);
      for (let i = 0; i < results.length; i++) {
        let { username, first_name, last_name, phone } = from_users[i].rows[0];
        results[i].from_user = { username, first_name, last_name, phone };
        delete results[i].from_username;
      }
      return results;
    }
  catch(err) {
    throw new ExpressError('Unable to retrieve messages to ' + username);
  }

}
}




module.exports = User;