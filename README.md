# ⬇️ node-rutorrent-promise

[![version](https://badgen.net/npm/v/rutorrent-promise)](https://www.npmjs.com/package/rutorrent-promise)
[![size](https://badgen.net/bundlephobia/min/rutorrent-promise)](https://bundlephobia.com/result?p=rutorrent-promise)
[![downloads](https://badgen.net/npm/dt/rutorrent-promise)](https://www.npmjs.com/package/rutorrent-promise)
![license](https://badgen.net/npm/license/rutorrent-promise)

__Interact with ruTorrent via promises__ 👌

This was inspired by [Grant](https://github.com/grantholle)'s [transmission](https://www.npmjs.com/package/transmission-promise) library. It provides methods to communicate with ruTorrent client using promises. It works thanks to the [HTTPRPC](https://github.com/Novik/ruTorrent/wiki/PluginHTTPRPC) plugin.

## Installation

```bash
npm i rutorrent-promise --save
```

```javascript
const RuTorrent = require('rutorrent-promise');

const rutorrent = new RuTorrent({
  host: 'localhost', // default: localhost
  port: 80,          // default: 80
  path: '',          // default: /rutorrent
  ssl: true,         // default: false
  username: '',      // default: none
  password: '',      // default: none
});
```

## Available fields

An array of fields can be passed to the `get` and `addFile` methods in order to retrieve specific values from the torrents. The list is taken from the available properties provided by the [HTTPRPC ruTorrent plugin](https://github.com/Novik/ruTorrent/blob/master/plugins/httprpc/action.php#L90). Here it is:

- `d.is_open`
- `d.is_hash_checking`
- `d.is_hash_checked`
- `d.get_state`
- `d.get_name`
- `d.get_size_bytes`
- `d.get_completed_chunks`
- `d.get_size_chunks`
- `d.get_bytes_done`
- `d.get_up_total`
- `d.get_ratio`
- `d.get_up_rate`
- `d.get_down_rate`
- `d.get_chunk_size`
- `d.get_custom1`
- `d.get_peers_accounted`
- `d.get_peers_not_connected`
- `d.get_peers_connected`
- `d.get_peers_complete`
- `d.get_left_bytes`
- `d.get_priority`
- `d.get_state_changed`
- `d.get_skip_total`
- `d.get_hashing`
- `d.get_chunks_hashed`
- `d.get_base_path`
- `d.get_creation_date`
- `d.get_tracker_focus`
- `d.is_active`
- `d.get_message`
- `d.get_custom2`
- `d.get_free_diskspace`
- `d.is_private`
- `d.is_multi_file`

## Methods

### `get(fields = [])`

List all the torrents.

```javascript
rutorrent
  .get(['d.get_name', 'd.get_custom1', 'd.get_size_bytes'])
  .then((data) => {
    // Response example:
    // [
    //   {
    //     hashString: <string>,
    //     'd.get_name': <string>,
    //     'd.get_custom1': <string>,
    //     'd.get_size_bytes': <number>,
    //   },
    //   ...
    // ]
  });
```

### `addFile(file, options = {}, fields = [])`

Add a new torrent from a file.

```javascript
rutorrent
  .addFile(fs.readFileSync('foo/bar.torrent'), {
    label: <string>,
    destination: <string>,
  }, ['d.get_name'])
  .then((data) => {
    // Response example:
    // {
    //   hashString: <string>,
    //   'd.get_name': <string>,
    // }
  });
```

### `delete(hash, deleteTiedFile = true)`

Delete a torrent.

```javascript
rutorrent
  .delete('hash_string')
  .then((data) => {
    // Response example:
    // {
    //   hashString: 'hash_string',
    // }
  });
```

## Contributing

👨‍💻👩‍💻

Feel free to contribute and help me add more methods to interact with ruTorrent.

To run the unit tests, create an `.env` file in the `test` directory and fill it in with your client host and credentials:

```bash
$ cp test/.env.sample test/.env
$ cat test/.env
HOST=YOUR_CLIENT_HOST
PORT=YOUR_CLIENT_PORT
PREFIX_PATH=YOUR_CLIENT_PREFIX_PATH # (default is /rutorrent)
SSL=true                            # (https or http)
USERNAME=YOUR_CLIENT_USERNAME
PASSWORD=YOUR_CLIENT_PASSWORD

$ npm i && npm t
```
