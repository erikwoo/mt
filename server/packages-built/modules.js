(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var meteorInstall = Package['modules-runtime'].meteorInstall;

/* Package-scope variables */
var Buffer, process;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"server.js":["./install-packages.js","./buffer.js","./process.js",function(require){

//////////////////////////////////////////////////////////////////////////
//                                                                        
// packages/modules/server.js                                             
//                                                                        
//////////////////////////////////////////////////////////////////////////
                                                                          
require("./install-packages.js");
require("./buffer.js");
require("./process.js");

//////////////////////////////////////////////////////////////////////////

}],"buffer.js":["buffer",function(require){

//////////////////////////////////////////////////////////////////////////
//                                                                        
// packages/modules/buffer.js                                             
//                                                                        
//////////////////////////////////////////////////////////////////////////
                                                                          
try {
  Buffer = global.Buffer || require("buffer").Buffer;
} catch (noBuffer) {}

//////////////////////////////////////////////////////////////////////////

}],"install-packages.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////
//                                                                        
// packages/modules/install-packages.js                                   
//                                                                        
//////////////////////////////////////////////////////////////////////////
                                                                          
function install(name) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).
  meteorDir[name + ".js"] = function (r, e, module) {
    module.exports = Package[name];
  };

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("underscore");
install("meteor");
install("accounts-ui");
install("npm-bcrypt");
install("babel-compiler");
install("ecmascript");
install("modules-runtime");
install("modules");
install("promise");
install("ecmascript-runtime");
install("babel-runtime");
install("random");
install("rate-limit");
install("ddp-rate-limiter");
install("base64");
install("ejson");
install("check");
install("callback-hook");
install("tracker");
install("retry");
install("id-map");
install("ddp-common");
install("diff-sequence");
install("mongo-id");
install("ddp-client");
install("logging");
install("routepolicy");
install("deps");
install("htmljs");
install("html-tools");
install("blaze-tools");
install("spacebars-compiler");
install("jquery");
install("observe-sequence");
install("reactive-var");
install("blaze");
install("spacebars");
install("ui");
install("boilerplate-generator");
install("webapp-hashing");
install("webapp");
install("ordered-dict");
install("geojson-utils");
install("minimongo");
install("ddp-server");
install("ddp");
install("npm-mongo");
install("allow-deny");
install("binary-heap");
install("mongo");
install("accounts-base");
install("sha");
install("srp");
install("email");
install("accounts-password");
install("jsx");
install("react-meteor-data");
install("meteor-base");
install("mobile-experience");
install("blaze-html-templates");
install("session");
install("reload");
install("mindfront:why-reminify");
install("livedata");
install("hot-code-push");
install("launch-screen");
install("templating");
install("autoupdate");
install("service-configuration");

//////////////////////////////////////////////////////////////////////////

},"process.js":["process",function(require,exports,module){

//////////////////////////////////////////////////////////////////////////
//                                                                        
// packages/modules/process.js                                            
//                                                                        
//////////////////////////////////////////////////////////////////////////
                                                                          
try {
  // The application can run `npm install process` to provide its own
  // process stub; otherwise this module will provide a partial stub.
  process = global.process || require("process");
} catch (noProcess) {
  process = {};
}

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = process;
      }
    }
  });
} else {
  process.platform = "browser";
  process.nextTick = process.nextTick || Meteor._setImmediate;
}

if (typeof process.env !== "object") {
  process.env = {};
}

_.extend(process.env, meteorEnv);

//////////////////////////////////////////////////////////////////////////

}]}}}},{"extensions":[".js",".json"]});
var exports = require("./node_modules/meteor/modules/server.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.modules = exports, {
  meteorInstall: meteorInstall,
  Buffer: Buffer,
  process: process
});

})();

//# sourceMappingURL=modules.js.map
