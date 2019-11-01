'use strict';

const axios = require('axios');
const qs = require('querystring');
const FormData = require('form-data');

class RuTorrent {

  /**
   * RuTorrent class constructor.
   *
   * Available options:
   *   - host
   *   - port
   *   - path
   *   - ssl (bool)
   *   - username
   *   - password
   *
   * @param {object} options
   */
  constructor(options = {}) {
    const protocol = options.ssl === true ? 'https' : 'http';
    const host = options.host || 'localhost';
    const port = options.port || 80;
    const path = options.url || '/rutorrent';

    this.axios = axios.create({
      baseURL: `${protocol}://${host}:${port}${path}`,
    });

    if (options.username) {
      this.axios.defaults.headers.common['Authorization'] = `Basic ${Buffer.from(`${options.username}:${options.password || ''}`).toString('base64')}`;
    }
  }

  /**
   * Makes a call to the ruTorrent server.
   *
   * @return {Promise}
   */
  callServer(options) {
    if (!options.type) {
      options.type = 'application/x-www-form-urlencoded';
    }
    if (!options.headers) {
      options.headers = {};
    }

    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.axios.post(options.path, options.data, {
          responseType: 'json',
          maxRedirects: 0,
          headers: {
            'Content-Type': options.type,
            ...options.headers,
          },
        });

        if (response.headers['content-type'].indexOf('application/json') === -1) {
          throw new Error(response.data);
        }

        resolve(response.data);
      } catch (err) {
        if (err.response.status === 302 && err.response.headers.location.indexOf('Success') !== -1) {
          resolve(true);
        }
        reject(err);
      }
    });
  }

  /**
   * Adds a new torrent from a given file.
   * Available options:
   *   - label
   *   - destination
   *
   * @return {Promise}
   */
  addFile(file, options = {}) {
    const formData = new FormData();
    formData.append('torrent_file', file, 'torrent');

    if (options.label) {
      formData.append('label', options.label);
    }
    if (options.destination) {
      formData.append('dir_edit', options.destination);
    }

    return new Promise((resolve, reject) => {
      this.callServer({
        type: 'multipart/form-data',
        path: '/php/addtorrent.php',
        data: formData,
        headers: formData.getHeaders(),
      }).then(() => {
        return this.get();
      }).then((data) => {
        resolve(data.pop());
      }).catch(err => {
        reject(err);
      });
    });
  }

  get() {
    return this.callServer({
      path: '/plugins/httprpc/action.php',
      data: qs.stringify({ mode: 'list' }),
    }).then((data) => Object.keys(data.t).map((hash) => ({
      hashString: hash.toLowerCase(),
      name: data.t[hash][4],
      totalBytes: parseInt(data.t[hash][5]),
      bytesDone: parseInt(data.t[hash][8]),
      label: data.t[hash][14],
    })));
  }
}

module.exports = RuTorrent;
