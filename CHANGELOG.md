# Release Notes

## [v2.0.0](https://github.com/ctessier/node-rutorrent-promise/compare/v1.3.0...v2.0.0)

> Released 2020/03/29

:warning: This release introduces breaking changes from 1.3.0.

### Breaking changes

The methods to add a torrent no longer return details on the added torrent. This feature was time consuming as it required two requests. It was also not working as expected when adding a torrent that already existed. Check the [documentation](https://github.com/ctessier/node-rutorrent-promise/blob/v2.0.0/README.md) for more details.

If you still wish to get details on a torrent file or magnet, have a look at the [webtorrent/parse-torrent](https://github.com/webtorrent/parse-torrent) library.

### Changed

- Improvement was made on the library weight. [axios](https://github.com/axios/axios) has been replaced by [node-fetch](https://github.com/node-fetch/node-fetch) which drastically reduces the size of the package.


## [v1.3.0](https://github.com/ctessier/node-rutorrent-promise/compare/v1.2.0...v1.3.0)

> Released 2020/03/20

### Added

- Possibility to add a torrent via an URL (#13)

### Fixed

- Conflict with `USERNAME` environment variable on Linux (#14)

## [v1.2.0](https://github.com/ctessier/node-rutorrent-promise/compare/v1.1.1...v1.2.0)

> Released 2020/03/15

### Added

- Possibility to delete a torrent (#8)
- Upgrade Axios version to 0.19.2 (#10)

### Fixed

- Conflict with PATH environment variable (#9)

## [v1.1.1](https://github.com/ctessier/node-rutorrent-promise/compare/v1.1.0...v1.1.1)

> Released 2020/02/19

### Fixed

- fix option property for providing a custom path (Thanks @ShaunLWM #5)


## [v1.1.0](https://github.com/ctessier/node-rutorrent-promise/compare/v1.0.0...v1.1.0)

> Released 2019/11/02

### Breaking changes

- `totalBytes`, `bytesDone` and `label` are no longer returned from the `get` method. You must now specified a list of fields to retrieve (see documentation)

### Added

- possibility to specify wanted fields when retrieving torrents (#1)

## v1.0.0

> Released 2019/11/01
