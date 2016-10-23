var Fiber = require("fibers")
global.Package = {}
require('../packages/meteor/index_server.js')
require('../packages/promise/server.js')
// require('../packages/callback-hook/hook.js')
// require('../packages/tracker/tracker.js')
require('../packages/retry/retry.js')
require('../packages/ddp-client/index_server.js')
// require('../packages/observe-sequence/observe_sequence.js')
require('../packages/minimongo/index_server.js')
module.exports = {
	registerDDP: require('../packages/ddp-server/index_server.js'),
	connectMongo: function(url) {
		process.env.MONGO_URL = url
		global.MongoInternals = require('mt/packages/mongo/mongo_driver.js')
		require('../packages/mongo/remote_collection_driver.js')
	}
}

require('../client/allow-deny.js')
require('../packages/binary-heap/index_server.js')
require('../packages/mongo/local_collection_driver.js')


process.on('SIGINT', function() {
	process.exit()
})