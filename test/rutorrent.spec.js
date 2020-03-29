const fs = require('fs');
const path = require('path');
const http = require('http');
const expect = require('chai').expect;

require('dotenv').config({
  path: path.resolve(`${process.cwd()}/test`, '.env'),
});

if (!fs.existsSync(path.resolve('tmp'))) {
  fs.mkdirSync(path.resolve('tmp'))
}

const RuTorrent = require('../');
const options = {};

const dataSet = [{
  name: 'ubuntu-18.04.4-desktop-amd64.iso',
  hash: '286D2E5B4F8369855328336AC1263AE02A7A60D5',
  url: 'http://releases.ubuntu.com/18.04/ubuntu-18.04.4-desktop-amd64.iso.torrent',
  label: 'linux-distro',
}, {
  name: 'ubuntu-16.04.6-desktop-amd64.iso',
  hash: 'EE55335F2ACDE309FA645FAB11C04750D7E45FA1',
  url: 'http://releases.ubuntu.com/16.04/ubuntu-16.04.6-desktop-amd64.iso.torrent',
  label: 'linux-distro',
}];

if (process.env.HOST) {
  options.host = process.env.HOST;
}
if (process.env.PORT) {
  options.port = process.env.PORT;
}
if (process.env.PREFIX_PATH) {
  options.path = process.env.PREFIX_PATH;
}
if (process.env.SSL) {
  options.ssl = process.env.SSL;
}
if (process.env.LOGIN) {
  options.username = process.env.LOGIN;
}
if (process.env.PASSWORD) {
  options.password = process.env.PASSWORD;
}

describe('rutorrent', () => {
  let rutorrent;

  it('can instantiate a new instance', (done) => {
    try {
      rutorrent = new RuTorrent(options);
      done();
    } catch(err) {
      done(err);
    }
  });

  describe('methods', () => {
    it('get - returns the list of torrents', (done) => {
      rutorrent.get(['d.get_name', 'd.get_size_bytes', 'd.get_bytes_done', 'd.get_custom1'])
        .then((result) => {
          expect(result).to.be.an('array');
          if (result.length) {
            result.forEach((res) => {
              expect(res).to.have.property('hashString');
              expect(res).to.have.property('d.get_name');
              expect(res).to.have.property('d.get_size_bytes');
              expect(res).to.have.property('d.get_bytes_done');
              expect(res).to.have.property('d.get_custom1');
            })
          }
          done();
        })
        .catch(done);
    });

    it('addFile - should add torrent from file', (done) => {
      const destination = path.resolve('tmp', path.basename(dataSet[0].url));
      const writeStream = fs.createWriteStream(destination);
      http.get(dataSet[0].url, (response) => {
        response.pipe(writeStream);
        response.on('error', done);
        response.on('end', () => {
          rutorrent.addFile(fs.readFileSync(destination), { label: dataSet[0].label })
            .then(() => rutorrent.get(['d.get_name', 'd.get_custom1'])
              .then((results) => {
                const torrent = results.find(r => r.hashString === dataSet[0].hash);
                expect(torrent).to.eql({
                  hashString: dataSet[0].hash,
                  'd.get_name': dataSet[0].name,
                  'd.get_custom1': dataSet[0].label,
                });
                done();
              }))
            .catch(done);
        });
      });
    });

    it('addUrl - should add torrent from url', (done) => {
      rutorrent.addUrl(dataSet[1].url, { label: dataSet[1].label })
        .then(() => rutorrent.get(['d.get_name', 'd.get_custom1'])
          .then((results) => {
            const torrent = results.find(r => r.hashString === dataSet[0].hash);
            expect(torrent).to.eql({
              hashString: dataSet[0].hash,
              'd.get_name': dataSet[0].name,
              'd.get_custom1': dataSet[0].label,
            });
            done();
          }))
        .catch(done);
    });

    it('delete - should delete torrent from hash', (done) => {
      rutorrent.delete(dataSet[0].hash, true)
        .then(() => rutorrent.get()
          .then((results) => {
            expect(results.every(r => r.hashString !== dataSet[0].hash)).to.be.true;

            return rutorrent.delete(dataSet[1].hash, true)
              .then(() => rutorrent.get()
                .then((results) => {
                  expect(results.every(r => r.hashString !== dataSet[1].hash)).to.be.true;
                  done();
                }))
          }))
        .catch(done);
    });
  });

});
