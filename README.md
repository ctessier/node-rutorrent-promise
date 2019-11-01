# node-rutorrent-promise

Interact with ruTorrent via promises.

This was inspired by [Grant](https://github.com/grantholle)'s [transmission](https://www.npmjs.com/package/transmission-promise) library. It allows use to communicate with ruTorrent client via HTTP RPC requests using promises.

## Installation

```bash
npm i rutorrent-promise --save
```

```javascript
  const RuTorrent = require('rutorrent-promise');

  const rutorrent = new RuTorrent({
    host: 'localhost', // default: localhost
    port: 80, // default: 80
    path: '', // default: /rutorrent
    ssl: true, // default: false
    username: '', // default: none
    password: '', // default: none
  })
```

## `get()`

List of the torrents.

```javascript
rutorrent
  .get()
  .then((data) => {
    // Response example:
    // [
    //   {
    //     hashString: <string>,
    //     name: <string>,
    //     totalBytes: <number>,
    //     bytesDone: <number>,
    //     label: <string>,
    //   },
    //   ...
    // ]
  })
```

## `addFile(file, options = {})`

Add a new torrent from a file.

```javascript
rutorrent
  .addFile(fs.readFileSync('foo/bar.torrent'), {
    label: <string>,
    destination: <string>,
  })
  .then((data) => {
    // ...
  })
```
