var racer;

racer = require('racer');

process.nextTick(function() {
  racer.init(this.init);
  return delete this.init;
});

racer.on('ready', function(model) {
  var addListener, board, conflicts, dragData, info, letters, moveLetter, roomlist, roomsDiv, updateInfo, updateRooms;
  info = document.getElementById('info');
  board = document.getElementById('board');
  roomsDiv = document.getElementById('rooms');
  roomlist = document.getElementById('roomlist');
  dragData = null;
  letters = window.letters = {};
  updateInfo = function() {
    var html, players, roomsVisibility;
    if (model.connected) {
      players = model.get('_room.players');
      html = players + ' Player' + (players > 1 ? 's' : '');
      roomsVisibility = 'visible';
    } else if (model.canConnect) {
      html = 'Offline<span id=reconnect> &ndash; <a href=# onclick="return letters.connect()">Reconnect</a></span>';
      roomsVisibility = 'hidden';
    } else {
      html = 'Unable to reconnect &ndash; <a href=javascript:window.location.reload()>Reload</a>';
      roomsVisibility = 'hidden';
    }
    if (conflicts) {
      html += ' &ndash; Another player made conflicting moves:&nbsp;\n<a href=# onclick="return letters.resolve()">Accept</a>&nbsp;\n<a href=# onclick="return letters.resolve(true)">Override</a>';
    }
    info.innerHTML = html;
    return roomsDiv.style.visibility = roomsVisibility;
  };
  letters.connect = function() {
    var reconnect;
    reconnect = document.getElementById('reconnect');
    reconnect.style.display = 'none';
    setTimeout((function() {
      return reconnect.style.display = 'inline';
    }), 1000);
    model.socket.socket.connect();
    return false;
  };
  updateRooms = function() {
    var currentName, display, html, name, players, room, rooms, text, _i, _len, _ref;
    rooms = [];
    _ref = model.get('rooms');
    for (name in _ref) {
      room = _ref[name];
      if (players = room.players) {
        rooms.push({
          name: name,
          players: players
        });
      }
    }
    rooms.sort(function(a, b) {
      return b.players - a.players;
    });
    html = '';
    currentName = model.get('_roomName');
    for (_i = 0, _len = rooms.length; _i < _len; _i++) {
      room = rooms[_i];
      name = room.name;
      display = (name.charAt(0).toUpperCase() + name.substr(1)).replace(/-/g, ' ');
      text = "" + display + " (" + room.players + ")";
      html += name === currentName ? "<li><b>" + text + "</b>" : "<li><a href=\"" + name + "\">" + text + "</a>";
    }
    return roomlist.innerHTML = html;
  };
  model.socket.on('connect', function() {
    return model.socket.emit('join', model.get('_roomName'));
  });
  model.on('connectionStatus', updateInfo);
  model.on('set', '_room.players', updateInfo);
  model.on('set', 'rooms.*.players', updateRooms);
  model.on('set', '_room.letters.*.position', function(id, position) {
    var el;
    el = document.getElementById(id);
    el.style.left = position.left + 'px';
    return el.style.top = position.top + 'px';
  });
  addListener = document.addEventListener ? function(el, type, listener) {
    return el.addEventListener(type, listener, false);
  } : function(el, type, listener) {
    return el.attachEvent('on' + type, function(e) {
      return listener(e || event);
    });
  };
  addListener(board, 'selectstart', function() {
    return false;
  });
  addListener(board, 'dragstart', function(e) {
    var target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('Text', 'x');
    target = e.target || e.srcElement;
    dragData = {
      target: target,
      startLeft: e.clientX - target.offsetLeft,
      startTop: e.clientY - target.offsetTop
    };
    return target.style.opacity = 0.5;
  });
  addListener(board, 'dragover', function(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  });
  addListener(board, 'dragend', function(e) {
    return dragData.target.style.opacity = 1;
  });
  addListener(board, 'drop', function(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    return moveLetter(dragData.target.id, e.clientX - dragData.startLeft, e.clientY - dragData.startTop);
  });
  conflicts = null;
  letters.resolve = function(override) {
    var clone, i, id, left, top, _ref;
    for (i in conflicts) {
      _ref = conflicts[i], clone = _ref.clone, id = _ref.id, left = _ref.left, top = _ref.top;
      board.removeChild(clone);
      if (override) {
        moveLetter(id, left, top);
      }
    }
    conflicts = null;
    updateInfo();
    return false;
  };
  return moveLetter = function(id, left, top) {
    return model.set("_room.letters." + id + ".position", {
      left: left,
      top: top
    }, function(err) {
      var clone, cloneId, existing;
      if (err !== 'conflict') {
        return;
      }
      cloneId = id + 'clone';
      if (existing = document.getElementById(cloneId)) {
        board.removeChild(existing);
      }
      clone = document.getElementById(id).cloneNode(true);
      clone.id = cloneId;
      clone.style.left = left + 'px';
      clone.style.top = top + 'px';
      clone.style.opacity = 0.5;
      clone.draggable = false;
      board.appendChild(clone);
      conflicts || (conflicts = {});
      conflicts[cloneId] = {
        clone: clone,
        id: id,
        left: left,
        top: top
      };
      return updateInfo();
    });
  };
});
