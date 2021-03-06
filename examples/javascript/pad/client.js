var racer;

racer = require('racer');

racer.use(require('racer/lib/ot'));

process.nextTick(function() {
  racer.init(this.init);
  return delete this.init;
});

racer.on('ready', function(model) {
  var applyChange, editor, event, genOp, prevvalue, replaceText, _i, _len, _ref, _results;
  editor = document.getElementById('editor');
  applyChange = function(newval) {
    var commonEnd, commonStart, oldval;
    oldval = model.get('_room.text');
    if (oldval === newval) {
      return;
    }
    commonStart = 0;
    while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
      commonStart++;
    }
    commonEnd = 0;
    while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) && commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
      commonEnd++;
    }
    if (oldval.length !== commonStart + commonEnd) {
      model.otDel('_room.text', commonStart, oldval.length - commonStart - commonEnd);
    }
    if (newval.length !== commonStart + commonEnd) {
      return model.otInsert('_room.text', commonStart, newval.substr(commonStart, newval.length - commonEnd));
    }
  };
  editor.disabled = false;
  prevvalue = editor.value = model.get('_room.text');
  replaceText = function(newText, transformCursor) {
    var newSelection, scrollTop;
    newSelection = [transformCursor(editor.selectionStart), transformCursor(editor.selectionEnd)];
    scrollTop = editor.scrollTop;
    editor.value = newText;
    if (editor.scrollTop !== scrollTop) {
      editor.scrollTop = scrollTop;
    }
    return editor.selectionStart = newSelection[0], editor.selectionEnd = newSelection[1], newSelection;
  };
  model.on('otInsert', '_room.text', function(pos, text, isLocal) {
    if (isLocal) {
      return;
    }
    return replaceText(editor.value.slice(0, pos) + text + editor.value.slice(pos), function(cursor) {
      if (pos <= cursor) {
        return cursor + text.length;
      } else {
        return cursor;
      }
    });
  });
  model.on('otDel', '_room.text', function(pos, text, isLocal) {
    if (isLocal) {
      return;
    }
    return replaceText(editor.value.slice(0, pos) + editor.value.slice(pos + text.length), function(cursor) {
      if (pos < cursor) {
        return cursor - Math.min(text.length, cursor - pos);
      } else {
        return cursor;
      }
    });
  });
  genOp = function(e) {
    return setTimeout(function() {
      var prevValue;
      if (editor.value !== prevValue) {
        prevValue = editor.value;
        return applyChange(editor.value.replace(/\r\n/g, '\n'));
      }
    }, 0);
  };
  _ref = ['input', 'keydown', 'keyup', 'select', 'cut', 'paste'];
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    if (editor.addEventListener) {
      _results.push(editor.addEventListener(event, genOp, false));
    } else {
      _results.push(editor.attachEvent('on' + event, genOp));
    }
  }
  return _results;
});
