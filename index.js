'use strict';

const axios = require('axios');
const qs = require('querystring');
const FormData = require('form-data');

const utils = require('./utils');

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
    const path = options.path || '/rutorrent';

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

        if (response.headers['content-type'].indexOf('text/xml') !== -1 && response.data.indexOf('faultCode') > 0) {
          throw new Error(response.data);
        }

        resolve(response.data);
      } catch (err) {
        if (err.response && err.response.status === 302 && err.response.headers.location.indexOf('Success') !== -1) {
          resolve(true);
        }
        reject(err);
      }
    });
  }

  /**
   * Adds a new torrent from a given file.
   *
   * Available options:
   *   - label
   *   - destination
   *
   * @param  {string|Buffer}   file
   * @param  {object}          options
   * @param  {array}           fields
   * @return {Promise<object>}
   */
  addFile(file, options = {}, fields = []) {
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
        return this.get(fields);
      }).then((data) => {
        resolve(data.pop());
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * Adds a new torrent from a given url.
   *
   * Available options:
   *   - label
   *   - destination
   *
   * @param  {string}          url
   * @param  {object}          options
   * @param  {array}           fields
   * @return {Promise<object>}
   */
  addUrl(url, options = {}, fields = []) {
    const formData = new FormData();
    formData.append('url', url);

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
        return this.get(fields);
      }).then((data) => {
        resolve(data.pop());
      }).catch(err => {
        reject(err);
      });
    });
  }

  /**
   * Get the list of torrents.
   *
   * @param  {array}          fields
   * @return {Promise<array>}
   */
  get(fields = []) {
    return this.callServer({
      path: '/plugins/httprpc/action.php',
      data: qs.stringify({ mode: 'list' }),
    }).then((data) => Object.keys(data.t).map((hashString) => {
      const torrent = utils.getTorrentInfo(data.t[hashString]);
      const res = { hashString };
      for (let i = 0 ; i < fields.length ; ++i) {
        res[fields[i]] = torrent[fields[i]];
      }
      return res;
    }));
  }

  /**
   * Delete a torrent.
   *
   * @param  {string}          hash
   * @param  {boolean}         deleteTiedFile
   * @return {Promise<object>}
   */
  delete(hash, deleteTiedFile = true) {
    let data = `<?xml version="1.0" encoding="UTF-8"?>
      <methodCall>
        <methodName>system.multicall</methodName>
        <params>
          <param>
            <value>
              <array>
                <data>
                  <value>
                    <struct>
                      <member>
                        <name>methodName</name>
                        <value>
                          <string>d.set_custom5</string>
                        </value>
                      </member>
                      <member>
                        <name>params</name>
                        <value>
                          <array>
                            <data>
                              <value>
                                <string>${hash}</string>
                              </value>
                              <value>
                                <string>1</string>
                              </value>
                            </data>
                          </array>
                        </value>
                      </member>
                    </struct>
                  </value>`;
    if (deleteTiedFile) {
      data += `<value>
        <struct>
          <member>
            <name>methodName</name>
            <value>
              <string>d.delete_tied</string>
            </value>
          </member>
          <member>
            <name>params</name>
            <value>
              <array>
                <data>
                  <value>
                    <string>${hash}</string>
                  </value>
                </data>
              </array>
            </value>
          </member>
        </struct>
      </value>`;
    }
    data += `<value>
                    <struct>
                      <member>
                        <name>methodName</name>
                        <value>
                          <string>d.erase</string>
                        </value>
                      </member>
                      <member>
                        <name>params</name>
                        <value>
                          <array>
                            <data>
                              <value>
                                <string>${hash}</string>
                              </value>
                            </data>
                          </array>
                        </value>
                      </member>
                    </struct>
                  </value>
                </data>
              </array>
            </value>
          </param>
        </params>
      </methodCall>`;

    return this.callServer({
      type: 'text/xml; charset=UTF-8',
      path: '/plugins/httprpc/action.php',
      data,
    }).then(() => ({
      hashString: hash,
    }));
  }
}

module.exports = RuTorrent;
