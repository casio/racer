# TODO What do we do with `subscribe 'path.**'` when we migrate to a persistence store that does not carry all the '.**' data under a tree, but rather in a graph? e.g., dbrefs in mongodb, On the one extreme, we do eager loading, which enables us to use the synchronous interface of Model instances for subscribed data. The other extreme is to load the data we are subscribed to lazily in a Model instance as we need it; in this case, it is better to provide the user with a more Promise-based async interface.

pathParser = require '../pathParser'

module.exports =
  init: ->
    # Paths in the store that this model is subscribed to. These get set with
    # model.subscribe, and must be sent to the store upon connecting
    # Maps path -> 1
    @_storeSubs = {}

  setupSocket: (socket) ->
    self = this
    {_adapter} = self = this
    storeSubs = Object.keys self._storeSubs
    socket.on 'connect', ->
      # Establish subscriptions upon connecting and get any transactions
      # that may have been missed
      socket.emit 'sub', self._clientId, storeSubs, _adapter.ver, self._startId

  proto:
    subscribe: (_paths..., callback) ->
      # For subscribe(paths...)
      unless typeof callback is 'function'
        _paths.push callback
        callback = -> # TODO Do not generate a fn. Set to null

      # TODO: Support all path wildcards, references, and functions
      paths = []
      for path in _paths
        if typeof path is 'object'
          for key, value of path
            root = pathParser.splitPattern(value)[0]
            @set key, @ref root
            paths.push value
          continue
        unless @_storeSubs[path]
          # These subscriptions are reestablished when the client connects
          @_storeSubs[path] = 1
          paths.push path

      return callback() unless paths.length
      @_addSub paths, callback

    unsubscribe: (paths..., callback) ->
      # For unsubscribe(paths...)
      unless typeof callback is 'function'
        paths.push callback
        callback = ->

      throw new Error 'Unimplemented: unsubscribe'

    # This method is over-written in Model.server
    _addSub: (paths, callback) ->
      self = this
      return callback() unless @connected
      @socket.emit 'subAdd', @_clientId, paths, (data, otData) ->
        self._initSubData data
        self._initSubOtData otData
        callback()

    _initSubData: (data) ->
      adapter = @_adapter
      setSubDatum adapter, datum  for datum in data
      return

    _initSubOtData: (data) ->
      fields = @otFields
      fields[path] = field for path, field of data
      return

setSubDatum = (adapter, [root, remainder, value, ver]) ->
  if root is ''
    if typeof value is 'object'
      for k, v of value
        adapter.set k, v, ver
      return
    throw 'Cannot subscribe to "' + root + remainder + '"'

  return adapter.set root, value, ver
