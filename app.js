/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , ninjaBlocks = require('ninja-blocks');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.bodyParser());
  app.use(app.router);
});

// Create a new Ninja Block app. We'll use the user access token for this
var ninja = ninjaBlocks.app({user_access_token:'USER_ACCESS_TOKEN'});

// Map of the state to short name of the relay
var states = {
  OKAY:'Okay',
  BUILD:'Build',
  FAIL:'Fail'
};

// To be map of the relay shortname to device GUID
var relays={};

// On startup, fetch the user's devices
ninja.devices('relay',function(err,devices) {

  if (err) throw err.error;

  // Build the map of shortname to device GUID
  Object.keys(devices).forEach(function(guid) {
    relays[devices[guid].shortName] = guid
  });
});

// GitHub post commit hook
app.post('/building',function(req,res) {

  console.log('Building')
  ninja.device(relays[states.FAIL]).actuate('0')
  ninja.device(relays[states.OKAY]).actuate('0')
  ninja.device(relays[states.BUILD]).actuate('1')
  res.end();
});

// Travis-CI build status hook
app.post('/status',function(req,res) {

  // Parse the response from Travis-CI
  var payload = JSON.parse(req.body.payload);

  // Turn off the building relay
  ninja.device(relays[states.BUILD]).actuate('0')

  if (payload.result==1) {
    // Turn on the failed relay
    console.log('Build Failed');
    ninja.device(relays[states.FAIL]).actuate('1')
  } else {
    // Turn on the succeeded relay
    console.log('Build Succeeded');
    ninja.device(relays[states.OKAY]).actuate('1')
  }
  // End the response to travis
  res.end();
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("CI alert app listening on port " + app.get('port'));
});

