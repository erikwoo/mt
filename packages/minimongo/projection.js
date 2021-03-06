var _ = require('underscore')
var EJSON = require('../ejson')
// Knows how to compile a fields projection to a predicate function.
// @returns - Function: a closure that filters out an object according to the
//            fields projection rules:
//            @param obj - Object: MongoDB-styled document
//            @returns - Object: a document with the fields filtered out
//                       according to projection rules. Doesn't retain subfields
//                       of passed argument.
module.exports = function _compileProjection(fields) {
  _checkSupportedProjection(fields);

  var _idProjection = _.isUndefined(fields._id) ? true : fields._id;
  var details = projectionDetails(fields);

  // returns transformed doc according to ruleTree
  var transform = function (doc, ruleTree) {
    // Special case for "sets"
    if (_.isArray(doc))
      return _.map(doc, function (subdoc) { return transform(subdoc, ruleTree); });

    var res = details.including ? {} : EJSON.clone(doc);
    _.each(ruleTree, function (rule, key) {
      if (!_.has(doc, key))
        return;
      if (_.isObject(rule)) {
        // For sub-objects/subsets we branch
        if (_.isObject(doc[key]))
          res[key] = transform(doc[key], rule);
        // Otherwise we don't even touch this subfield
      } else if (details.including)
        res[key] = EJSON.clone(doc[key]);
      else
        delete res[key];
    });

    return res;
  };

  return function (obj) {
    var res = transform(obj, details.tree);

    if (_idProjection && _.has(obj, '_id'))
      res._id = obj._id;
    if (!_idProjection && _.has(res, '_id'))
      delete res._id;
    return res;
  };
};

// Traverses the keys of passed projection and constructs a tree where all
// leaves are either all True or all False
// @returns Object:
//  - tree - Object - tree representation of keys involved in projection
//  (exception for '_id' as it is a special case handled separately)
//  - including - Boolean - "take only certain fields" type of projection
global.projectionDetails = function (fields) {
  // Find the non-_id keys (_id is handled specially because it is included unless
  // explicitly excluded). Sort the keys, so that our code to detect overlaps
  // like 'foo' and 'foo.bar' can assume that 'foo' comes first.
  var fieldsKeys = _.keys(fields).sort();

  // If _id is the only field in the projection, do not remove it, since it is
  // required to determine if this is an exclusion or exclusion. Also keep an
  // inclusive _id, since inclusive _id follows the normal rules about mixing
  // inclusive and exclusive fields. If _id is not the only field in the
  // projection and is exclusive, remove it so it can be handled later by a
  // special case, since exclusive _id is always allowed.
  if (fieldsKeys.length > 0 &&
      !(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') &&
      !(_.contains(fieldsKeys, '_id') && fields['_id']))
    fieldsKeys = _.reject(fieldsKeys, function (key) { return key === '_id'; });

  var including = null; // Unknown

  _.each(fieldsKeys, function (keyPath) {
    var rule = !!fields[keyPath];
    if (including === null)
      including = rule;
    if (including !== rule)
      // This error message is copied from MongoDB shell
      throw MinimongoError("You cannot currently mix including and excluding fields.");
  });


  var projectionRulesTree = pathsToTree(
    fieldsKeys,
    function (path) { return including; },
    function (node, path, fullPath) {
      // Check passed projection fields' keys: If you have two rules such as
      // 'foo.bar' and 'foo.bar.baz', then the result becomes ambiguous. If
      // that happens, there is a probability you are doing something wrong,
      // framework should notify you about such mistake earlier on cursor
      // compilation step than later during runtime.  Note, that real mongo
      // doesn't do anything about it and the later rule appears in projection
      // project, more priority it takes.
      //
      // Example, assume following in mongo shell:
      // > db.coll.insert({ a: { b: 23, c: 44 } })
      // > db.coll.find({}, { 'a': 1, 'a.b': 1 })
      // { "_id" : ObjectId("520bfe456024608e8ef24af3"), "a" : { "b" : 23 } }
      // > db.coll.find({}, { 'a.b': 1, 'a': 1 })
      // { "_id" : ObjectId("520bfe456024608e8ef24af3"), "a" : { "b" : 23, "c" : 44 } }
      //
      // Note, how second time the return set of keys is different.

      var currentPath = fullPath;
      var anotherPath = path;
      throw MinimongoError("both " + currentPath + " and " + anotherPath +
                           " found in fields option, using both of them may trigger " +
                           "unexpected behavior. Did you mean to use only one of them?");
    });

  return {
    tree: projectionRulesTree,
    including: including
  };
};

// paths - Array: list of mongo style paths
// newLeafFn - Function: of form function(path) should return a scalar value to
//                       put into list created for that path
// conflictFn - Function: of form function(node, path, fullPath) is called
//                        when building a tree path for 'fullPath' node on
//                        'path' was already a leaf with a value. Must return a
//                        conflict resolution.
// initial tree - Optional Object: starting tree.
// @returns - Object: tree represented as a set of nested objects
global.pathsToTree = function (paths, newLeafFn, conflictFn, tree) {
  tree = tree || {};
  _.each(paths, function (keyPath) {
    var treePos = tree;
    var pathArr = keyPath.split('.');

    // use _.all just for iteration with break
    var success = _.all(pathArr.slice(0, -1), function (key, idx) {
      if (!_.has(treePos, key))
        treePos[key] = {};
      else if (!_.isObject(treePos[key])) {
        treePos[key] = conflictFn(treePos[key],
                                  pathArr.slice(0, idx + 1).join('.'),
                                  keyPath);
        // break out of loop if we are failing for this path
        if (!_.isObject(treePos[key]))
          return false;
      }

      treePos = treePos[key];
      return true;
    });

    if (success) {
      var lastKey = _.last(pathArr);
      if (!_.has(treePos, lastKey))
        treePos[lastKey] = newLeafFn(keyPath);
      else
        treePos[lastKey] = conflictFn(treePos[lastKey], keyPath, keyPath);
    }
  });

  return tree;
};

function _checkSupportedProjection(fields) {
  if (!_.isObject(fields) || _.isArray(fields))
    throw MinimongoError("fields option must be an object");

  _.each(fields, function (val, keyPath) {
    if (_.contains(keyPath.split('.'), '$'))
      throw MinimongoError("Minimongo doesn't support $ operator in projections yet.");
    if (typeof val === 'object' && _.intersection(['$elemMatch', '$meta', '$slice'], _.keys(val)).length > 0)
      throw MinimongoError("Minimongo doesn't support operators in projections yet.");
    if (_.indexOf([1, 0, true, false], val) === -1)
      throw MinimongoError("Projection values should be one of 1, 0, true, or false");
  });
};
exports._checkSupportedProjection = _checkSupportedProjection
