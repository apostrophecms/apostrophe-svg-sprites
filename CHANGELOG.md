## 1.0.17

* Globbing now works as described in the documentation, with no 404 errors. Note that it is only intended to address a suffix that changes for cachebusting reasons etc. and is not intended as a way to import multiple map files. For that, configure them separately.
* The "Manage Sprites" list view now displays the sprites again when used with recent versions of Apostrophe.
* The map name is now imported, making it possible to determine the map of origin in the edit view when more than one svg map file is present.

Thanks to Michelin for making this work possible via [Apostrophe Enterprise Support](https://apostrophecms.org/support/enterprise-support).

## 1.0.16

* Update of existing sprite now works properly, eslint configured and passing, unit test written and passing, refactored lib/import.js to conform to our standard pattern for requiring part of the implementation of a module from another file

