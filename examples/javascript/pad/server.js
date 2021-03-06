var app, express, fs, gzip, racer, store;

express = require('express');

gzip = require('connect-gzip');

fs = require('fs');

racer = require('racer');

racer.use(require('racer/lib/ot'));

app = express.createServer().use(express.favicon()).use(gzip.staticGzip(__dirname));

store = racer.createStore({
  listen: app
});

store.flush();

racer.js({
  entry: __dirname + '/client.js'
}, function(err, js) {
  return fs.writeFileSync(__dirname + '/script.js', js);
});

app.get('/', function(req, res) {
  return res.redirect('/racer');
});

app.get('/:group', function(req, res) {
  var model;
  model = store.createModel();
  return model.subscribe("groups." + req.params.group, function(err, room) {
    model.ref('_room', room);
    room.otNull('text', 'Edit this with friends.');
    return model.bundle(function(bundle) {
      return res.send("<!DOCTYPE html>\n<title>Pad</title>\n<link rel=stylesheet href=style.css>\n<body>\n<div id=editor-container>\n  <textarea id=editor>" + (room.get('text')) + "</textarea>\n</div>\n<script>init=" + bundle + "</script>\n<script src=script.js></script>");
    });
  });
});

app.listen(3011);

console.log('Go to http://localhost:3011/racer');
