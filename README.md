mimosa-server-reload
===========

## Overview

This is a Mimosa module for restarting a node server when server-bound assets (like routes, general lib files) change.

For more information regarding Mimosa, see http://mimosajs.com

## Usage

Add `'mimosa-server-reload'` to your list of modules. That's all! Mimosa will install the module for you when you start up.

* 0.2.0 Works with Mimosa 0.6.2+
* 0.1.0 works with 0.6.0 + 0.6.1

## Functionality

The `mimosa-server-reload` module will point itself at a list of configurable files/folders and when the contents (recursive) of those change, it will work with both the `mimosa-server` and `mimosa-live-reload` modules to restart the user's server.

If you are using `mimosa-server-reload`, as part of restarting your server, this module shuts down the web socket connections that enable live reload so that the server can be closed.  It restarts the server-side of the web socket connection, but does not reconnect with the client.  So after the server is restarted, you need to refresh the browser to reconnect live reload.

Some prerequisites for this module are:

* You must be using `mimosa-server`
* You must start Mimosa using the `--server` or `-s` flag
* You must not being using Mimosa's hosted server.  Your `server.useDefaultServer` value should be set to false.

`mimosa-live-reload` is not a prereq, but this module will work with that one if it is present to shut down socket connections.

## Default Config

```
serverReload:
  watch:["server.coffee", "server.js", "server.ls", "server.iced", "routes", "src", "lib"]
  exclude:[]
  validate:true
```

* `watch`: an array of strings, folders and files whose contents will trigger a server restart when changed.  By default all the possible server names generated by `mimosa new` are included as well as the routes folder, which is also delivered by `mimosa new`. Also considered defaults are typical source colde libraries: `src` and `lib`.  Paths can be relative to the root of your project or absolute.
* `exclude`: an array of strings and/or regexs, the list of files and file patterns to exclude from restarting the server. Can be a mix of regexes and strings.  ex: `ex: [/\.txt$/, "vendor/jqueryui.js"]`. Can be left off or made null if not needed. Can be relative to the root of your project or absolute.
* `validate`: a boolean, whether or not to validate changed files. When true, the default, `mimosa-server-reload` will `require()` the changed file.  If the require fails, because it is invalid CoffeeScript/JavaScript for instance, Mimosa will not attempt to restart the server since the restart will likely fail.