Model = require './Model'
Store = require './Store'
io = require 'socket.io'
ioClient = require 'socket.io-client'
browserify = require 'browserify'

module.exports = rally = (options) ->
  # TODO: Provide full configuration for socket.io
  # TODO: Add configuration for Redis

  ## Setup socket.io ##
  listen = options.listen || 8080
  ioUri = options.ioUri ||
    if typeof listen is 'number' then ':' + ioPort else ''
  if options.ioSockets
    store._setSockets rally.sockets = options.ioSockets
  else
    io = io.listen(listen)
    io.configure ->
      io.set 'browser client', false
    store._setSockets rally.sockets = io.sockets
  
  # Adds server functions to Model's prototype
  require('./Model.server')(store, ioUri)
  
  ## Connect Middleware ##
  # The rally module returns connect middleware for
  # easy integration into connect/express
  # 1. Assigns clientId's if not yet assigned
  # 2. Instantiates a new Model and attaches it to the incoming request,
  #    for access from route handlers later
  return (req, res, next) ->
    if !req.session
      # TODO Do this check only the first time the middleware is invoked
      throw 'Missing session middleware'
    finish = (clientId) ->
      req.model = new Model clientId
      next()
    # TODO Security checks via session
    if clientId = req.params.clientId || req.body.clientId
      finish clientId
    else
      store._nextClientId finish

rally.use = -> throw 'Unimplemented'

rally.js = (callback) ->
  ioClient.builder ['websocket', 'xhr-polling'], minify: false, (err, value) ->
    throw err if err
    callback value + browserify.bundle(require: ['rally', 'es5-shim'])

rally.store = store = new Store
