'use strict';

const qs = require('querystring');
const fetch = require('node-fetch');
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

    this.baseUrl = `${protocol}://${host}:${port}${path}`;

    if (options.username) {
      this.authorizationHeader = `Basic ${Buffer.from(`${options.username}:${options.password || ''}`).toString('base64')}`;
    }
  }

  /**
   * Makes a call to the ruTorrent server.
   *
   * @return {Promise}
   */
  callServer(options) {
    let headers = {
      authorization: this.authorizationHeader,
    };

    if (options.data instanceof FormData) {
      headers = {
        ...options.data.getHeaders(),
        ...headers,
      };
    }

    return fetch(`${this.baseUrl}${options.path}`, {
      method: 'POST',
      redirect: 'manual',
      headers,
      body: options.data,
    }).then((res) => {
      if (res.ok) {
        return res.text();
      }
      else if (res.status === 302) {
        if (res.headers.get('location').indexOf('Success') > 0) {
          return res.text();
        }
        throw new Error('Error received from RuTorrent');
      }
      else {
        throw new Error(res.statusText);
      }
    }).then((data) => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    });
  }

  /**
   * Adds a new torrent from a given file or buffer.
   *
   * Available options:
   *   - label
   *   - destination
   *
   * @param  {string|Buffer} file
   * @param  {object}        options
   * @return {Promise}
   */
  addFile(file, options = {}) {
    const params = new FormData();
    params.append('torrent_file', file, 'torrent');

    if (options.label) {
      params.append('label', options.label);
    }
    if (options.destination) {
      params.append('dir_edit', options.destination);
    }

    return this.callServer({
      path: '/php/addtorrent.php',
      data: params,
    });
  }

  /**
   * Adds a new torrent from a given url.
   *
   * Available options:
   *   - label
   *   - destination
   *
   * @param  {string}  url
   * @param  {object}  options
   * @return {Promise}
   */
  addUrl(url, options = {}) {
    const params = new FormData();
    params.append('url', url);

    if (options.label) {
      params.append('label', options.label);
    }
    if (options.destination) {
      params.append('dir_edit', options.destination);
    }

    return this.callServer({
      path: '/php/addtorrent.php',
      data: params,
    });
  }

  /**
   * Get the list of files for torrent by hash.
   *
   * @param  {string}          h
   * @return {Promise<array>}
   */
  getFiles(h) {
    const data=qs.stringify({ mode: 'fls', hash: h});
    return this.callServer({
      path: '/plugins/httprpc/action.php',
      data,
    }).then((data) => {
      const res = [];
      data.forEach( file => {
        res.push({name: file[0], size: file[3]});
      }
      return res;
                   });
  }
  
  /**
   * Get the list of files for torrent by hash.
   *
   * @param  {string}          h
   * @param  {string}          cmd
   * @param  {string}          arg (default empty)
   * @return {Promise<array>}
   */
  exec(h,cmd,arg=""){
    const data = qs.stringify({ mode: cmd, hash: h, v: arg });
    
    return this.callServer({
      path: '/plugins/httprpc/action.php',
      data,
    }).then((data) => {return data});
  }
  /**
   * Get the list of torrents.
   *
   * @param  {array}          fields
   * @return {Promise<array>}
   */
  get(fields = []) {
    const data = qs.stringify({ mode: 'list' });

    return this.callServer({
      path: '/plugins/httprpc/action.php',
      data,
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
   * Delete a torrent from its hash.
   *
   * @param  {string}          hash
   * @param  {boolean}         deleteTiedFiles
   * @return {Promise<object>}
   */
  delete(hash, deleteTiedFiles = true) {
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
    if (deleteTiedFiles) {
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
    });
  }
}

module.exports = RuTorrent;
