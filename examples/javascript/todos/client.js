var racer, todoHtml;

racer = require('racer');

todoHtml = require('./shared').todoHtml;

process.nextTick(function() {
  racer.init(this.init);
  return delete this.init;
});

$(racer.ready(function(model) {
  var checkChanged, checkChangedDelayed, checkShortcuts, content, htmlEscape, lastHtml, list, newTodo, overlay, todoList;
  newTodo = $('#new-todo');
  todoList = $('#todos');
  content = $('#content');
  overlay = $('#overlay');
  list = model.at('_todoList');
  model.on('connectionStatus', function(connected, canConnect) {
    return overlay.html(connected ? '' : canConnect ? '<p id=info>Offline<span id=reconnect> &ndash; <a href=# onclick="return todos.connect()">Reconnect</a></span>' : '<p id=info>Unable to reconnect &ndash; <a href=javascript:window.location.reload()>Reload</a>');
  });
  list.on('push', function(value) {
    return todoList.append(todoHtml(value));
  });
  list.on('insert', function(index, value) {
    return todoList.children().eq(index).before(todoHtml(value));
  });
  model.on('set', '_group.todos.*.completed', function(id, value) {
    $("#" + id).toggleClass('completed', value);
    return $("#check" + id).prop('checked', value);
  });
  list.on('remove', function(index, howMany, _arg) {
    var id;
    id = _arg[0];
    return $("#" + id).remove();
  });
  list.on('move', function(from, to, howMany, _arg) {
    var id, target;
    id = _arg[0];
    target = todoList.children().get(to);
    if (id.toString() === target.id) {
      return;
    }
    if (from > to && to !== -1) {
      return $("#" + id).insertBefore(target);
    } else {
      return $("#" + id).insertAfter(target);
    }
  });
  model.on('set', '_group.todos.*.text', function(id, value) {
    var el;
    el = $("#text" + id);
    if (el.is(':focus')) {
      return;
    }
    return el.html(value);
  });
  window.todos = {
    connect: function() {
      var reconnect;
      reconnect = document.getElementById('reconnect');
      reconnect.style.display = 'none';
      setTimeout((function() {
        return reconnect.style.display = 'inline';
      }), 1000);
      model.socket.connect();
      return false;
    },
    addTodo: function() {
      var i, items, text, todo, _i, _len;
      if (!(text = htmlEscape(newTodo.val()))) {
        return;
      }
      newTodo.val('');
      items = list.get();
      for (i = _i = 0, _len = items.length; _i < _len; i = ++_i) {
        todo = items[i];
        if (todo.completed) {
          break;
        }
      }
      todo = {
        id: model.incr('_group.nextId').toString(),
        completed: false,
        text: text
      };
      if (i === items.length) {
        return list.push(todo);
      } else {
        return list.insert(i, todo);
      }
    },
    check: function(checkbox, id) {
      model.set("_group.todos." + id + ".completed", checkbox.checked);
      if (checkbox.checked) {
        return list.move({
          id: id
        }, -1);
      }
    },
    del: function(id) {
      return list.remove({
        id: id
      });
    }
  };
  todoList.sortable({
    handle: '.handle',
    axis: 'y',
    containment: '#dragbox',
    update: function(e, ui) {
      var item, to;
      item = ui.item[0];
      to = todoList.children().index(item);
      return list.move({
        id: item.id
      }, to);
    }
  });
  lastHtml = '';
  checkChanged = function(e) {
    var html, id, target, text;
    html = content.html();
    if (html === lastHtml) {
      return;
    }
    lastHtml = html;
    target = e.target;
    if (!(id = target.getAttribute('data-id'))) {
      return;
    }
    text = target.innerHTML;
    return model.set("_group.todos." + id + ".text", text);
  };
  checkChangedDelayed = function(e) {
    return setTimeout(checkChanged, 10, e);
  };
  checkShortcuts = function(e) {
    var code, command;
    if (!(e.metaKey || e.ctrlKey)) {
      return;
    }
    code = e.which;
    if (!(command = ((function() {
      switch (code) {
        case 66:
          return 'bold';
        case 73:
          return 'italic';
        case 32:
          return 'removeFormat';
        case 220:
          return 'removeFormat';
        default:
          return null;
      }
    })()))) {
      return;
    }
    document.execCommand(command, false, null);
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  };
  content.keydown(checkShortcuts).keydown(checkChanged).keyup(checkChanged).bind('paste', checkChangedDelayed).bind('dragover', checkChangedDelayed);
  document.execCommand('useCSS', false, true);
  document.execCommand('styleWithCSS', false, false);
  return htmlEscape = function(s) {
    if (s == null) {
      return '';
    } else {
      return s.toString().replace(/&(?!\s)|</g, function(s) {
        if (s === '&') {
          return '&amp;';
        } else {
          return '&lt;';
        }
      });
    }
  };
}));
