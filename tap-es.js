// tap-es

var builds = [];

/*
  A helper function to clean array reference
  -----
  Param arr : Array, String

*/
function newStringArray( arr ) {
  // Clean array reference and make sure tests is type of array
  return (Array.isArray(arr)) ? arr.splice(0) : [String(arr)];
};

/*
  A helper function to clean array values by constructor
  -----
  Param inst : Instance
  Param arr  : Array

*/
function keepInstanceOf( inst, arr ) {
  // Remove all values that are not instance of param inst
  if ( !Array.isArray(arr) ) return [];

  var i = arr.length;
  while (i--) {
    if (! arr[i] instanceof inst) { 
      arr.splice(i, 1);
    };
  };
  return arr;
};

/*
  Single Test
  -----
  Param tests      : String: Path to script
  Param targets    : Array, String: [list of] Adobe application target
  Param comparator : Number, String, Boolean, Function: Test comparator

*/
function Test( scripts, targets, comparator ) {
  var _Test = this;
  // Object must be created with new
  if( !(_Test instanceof Test) ){
    return new Test( tests, targets, comparator );
  };

  // String: Path to JSX script
  _Test.scripts = newStringArray( scripts );

  // Array: of target strings
  _Test.targets = newStringArray( targets );

  // Parse test comparator
  switch (typeof comparator) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'function':
      _Test.comparator = comparator;
      break;
    default:
      _Test.comparator = true;
      break;
  };
};

/*
  The Deck holds all tests that need to be taped
  -----
  Param tests      : Array of objects (Test)
  Param resultPath : String: Path to export file (eg /path/to/results.md)

*/
function Deck( tests ) {
  var _Deck = this;
  // Object must be created with new
  if( !(_Deck instanceof Deck) ){
    return new Deck( tests, resultPath );
  };
  
  // Array: Containing tests
  _Deck.tests = new Array();

  _Deck.add = function( tests ) {
    if ( Array.isArray(tests) ){
      _Deck.tests.concat(keepInstanceOf( Test, tests.slice(0) ));
    } else if(tests instanceof Test) {
      _Deck.tests.push(tests);
    };
  };
  
  _Deck.get = function() {
    return _Deck.tests.slice(0);
  };

  _Deck.reset = function() {
    _Deck.tests = new Array();
  };

  _Deck.add( tests );
};

//----------------------------------------------------------------------
var exports = {};
//----------------------------------------------------------------------

var deck = exports.deck = new Deck();

var reset = exports.reset = function() {
  deck.reset();
};

/*
  Function: Get all tests loaded in the deck
  -----
  Returns: Array of Test objects 
*/
var get = exports.get = function() {
  return deck.get();
};

/*
  Function: Get all tests loaded in the deck
  -----
  Returns: Array of paths
  // Note I have exported this function mainly as a hook for testing
*/
var glob = require("glob"), isGlob = require('is-glob');

var resolveGlob = exports.resolveGlob = function( pathStr ) {
  var filePaths = [];
  if( isGlob( pathStr ) ) {
    filePaths = glob.sync( pathStr ).slice(0);
  } else {
    filePaths.push( pathStr );
  };
  return filePaths;
};

/*
  Function: Test Generator
  -----
  Param scripts    : String, Array: [list of] Path to script, or glob path
  Param targets    : Array, String: [list of] Adobe application target
  Param comparator : Number, String, Boolean, Function: Test comparator

*/
var add = exports.add = function( scripts, targets, comparator) {
  deck.add( new Test( scripts, targets, comparator ) );
};


/*
  Function: Test Runner
  -----
  Param output:  String: Path to export file (eg /path/to/results.md)

*/
var run = exports.run = function( output ) {
  if( output === undefined ) console.log('TAP-ES: No output defined');
  var shell = require('shelljs'), serialize = require('serialize-javascript');
  var output = String( output ), tests = deck.get(), flatDeck = [];

  var x = tests.length;
  while(x--) {
    var test = tests[x];
    var s = test.scripts.length;
    while(s--) {
      var scripts = resolveGlob(test.scripts[s]);

      flatDeck.push({scripts: scripts, targets: test.targets, comparator: test.comparator});
    };
  };
  
  var cmd = 'node ./run-tap.js -b "' + encodeURI(escape(serialize(flatDeck,{unsafe:true}))) + '"';

  shell.exec(cmd).exec("tap-markdown").to(output);

};

//----------------------------------------------------------------------
module.exports = exports;
//----------------------------------------------------------------------