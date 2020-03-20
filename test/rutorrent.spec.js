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

const sampleUrl = 'http://downloads.raspberrypi.org/raspbian/images/raspbian-2019-09-30/2019-09-26-raspbian-buster.zip.torrent';
const sampleHash = '75146D87ADF9AF7D17F1803FCAEA9C715C73947F';

path.resolve('tmp', path.basename(sampleUrl));

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
if (process.env.USERNAME) {
  options.username = process.env.USERNAME;
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
    it('returns the list of torrents', (done) => {
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

    it('should add torrent from file', (done) => {
      const destination = path.resolve('tmp', path.basename(sampleUrl));
      const writeStream = fs.createWriteStream(destination);
      http.get(sampleUrl, (response) => {
        response.pipe(writeStream);
        response.on('error', done);
        response.on('end', () => {
          rutorrent.addFile(fs.readFileSync(destination), {
            label: 'node-rutorrent-promise'
          }, ['d.get_name', 'd.get_custom1'])
            .then((response) => {
              expect(response).to.have.property('hashString', sampleHash);
              expect(response).to.have.property('d.get_name', '2019-09-26-raspbian-buster.zip');
              expect(response).to.have.property('d.get_custom1', 'node-rutorrent-promise');
              done();
            })
            .catch(done);
        });
      });
    });

    it('should add torrent from url', (done) => {
      rutorrent.addUrl(sampleUrl, {
        label: 'node-rutorrent-promise',
      }, ['d.get_name', 'd.get_custom1'])
        .then((response) => {
          expect(response).to.have.property('hashString', sampleHash);
          expect(response).to.have.property('d.get_name', '2019-09-26-raspbian-buster.zip');
          expect(response).to.have.property('d.get_custom1', 'node-rutorrent-promise');
          done();
        })
        .catch(done);
    });

    it('should delete torrent from hash', (done) => {
      rutorrent.delete(sampleHash, true)
        .then(({ hashString }) => {
          return rutorrent.get()
            .then((results) => {
              expect(results.every(r => r.hashString !== hashString)).to.be.true;
            });
        })
        .then(done)
        .catch(done);
    });
  });

});
