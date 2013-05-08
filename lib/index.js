"use strict";
var buildDone, config, err, localConfig, logger, mimosaLiveReload, mimosaServer, registration, reloading, watch, _, __cleanNodeCache, __doServerRestart, __done, __killLiveReload, __refreshLiveReload, __reload, _watchServerSource,
  _this = this;

logger = require('logmimosa');

watch = require('chokidar');

_ = require('lodash');

try {
  mimosaServer = require('mimosa-server');
} catch (_error) {
  err = _error;
  logger.debug("No mimosa-server installed");
}

try {
  mimosaLiveReload = require('mimosa-live-reload');
} catch (_error) {
  err = _error;
  logger.debug("mimosa-live-reload is not installed.");
}

config = require('./config');

reloading = false;

localConfig = null;

buildDone = false;

registration = function(mimosaConfig, register) {
  if (!mimosaConfig.isServer) {
    return;
  }
  if (!mimosaServer) {
    return logger.error("mimosa-server-reload is configured, but mimosa-server module is not installed in the same module\n space as mimosa-server-reload. If both are installed, try removing mimosa-server-reload from your project\n and installing it using 'mimosa mod:install mimosa-server-reload'");
  }
  if (mimosaConfig.modules.indexOf('server') === -1 && mimosaConfig.modules.indexOf('mimosa-server') === -1) {
    return logger.error("mimosa-server-reload is configured, but mimosa-server is not included in your project. Cannot use mimosa-server-reload.");
  }
  if (mimosaConfig.server.defaultServer.enabled) {
    return;
  }
  if ((mimosaLiveReload != null) && mimosaConfig.modules.indexOf('live-reload') === -1 && mimosaConfig.modules.indexOf('mimosa-live-reload') === -1) {
    mimosaLiveReload = null;
  }
  return register(['postBuild'], 'afterServer', _watchServerSource);
};

_watchServerSource = function(mimosaConfig, options, next) {
  var folder, ignoreFunct, watcher, _i, _len, _ref;

  watcher = null;
  localConfig = _.clone(mimosaConfig, true);
  ignoreFunct = function(name) {
    if (mimosaConfig.serverReload.excludeRegex != null) {
      if (name.match(mimosaConfig.serverReload.excludeRegex)) {
        return true;
      }
    }
    if (mimosaConfig.serverReload.exclude != null) {
      if (mimosaConfig.serverReload.exclude.indexOf(name) > -1) {
        return true;
      }
    }
    return false;
  };
  _ref = mimosaConfig.serverReload.watch;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    folder = _ref[_i];
    if (watcher != null) {
      watcher.add(folder);
    } else {
      watcher = watch.watch(folder, {
        ignored: ignoreFunct,
        persistent: true
      });
      watcher.on('add', function(path) {
        if (buildDone) {
          return __reload(path);
        }
      });
      watcher.on('change', function(path) {
        if (buildDone) {
          return __reload(path);
        }
      });
      watcher.on('unlink', function(path) {
        return __reload(path);
      });
      watcher.on('error', function(error) {});
    }
  }
  setTimeout((function() {
    return buildDone = true;
  }), 200);
  return next();
};

__reload = function(path) {
  logger.debug("Going to reload because of [[ " + path + " ]]");
  if (!reloading) {
    reloading = true;
    return setTimeout((function() {
      return __cleanNodeCache(path);
    }), 25);
  }
};

__cleanNodeCache = function(path) {
  Object.keys(require.cache).forEach(function(key) {
    if (key.indexOf(localConfig.root) === 0) {
      logger.debug("Removing " + key + " from require cache");
      return delete require.cache[key];
    }
  });
  if (localConfig.serverReload.validate) {
    try {
      require(path);
    } catch (_error) {
      err = _error;
      reloading = false;
      return logger.error("File at [[ " + path + " ]] threw error when required so will not perform server-reload: \n " + err);
    }
  }
  return __killLiveReload();
};

__killLiveReload = function() {
  if (mimosaLiveReload != null) {
    logger.debug("Disconnecting live reload");
    mimosaLiveReload.disconnect();
  }
  return __doServerRestart();
};

__doServerRestart = function() {
  var options;

  logger.debug("Performing server reload");
  options = {};
  return mimosaServer.startServer(localConfig, options, function() {
    logger.debug("Calling refresh live reload");
    return __refreshLiveReload(options);
  });
};

__refreshLiveReload = function(options) {
  if (mimosaLiveReload != null) {
    logger.debug("Reconnecting live reload");
    return mimosaLiveReload.connect(localConfig, options, __done);
  } else {
    return __done();
  }
};

__done = function() {
  logger.debug("Server reloaded");
  return reloading = false;
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};