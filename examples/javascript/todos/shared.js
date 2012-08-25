exports.todoHtml = function(_arg) {
  var checked, completed, id, text;
  id = _arg.id, text = _arg.text, completed = _arg.completed;
  if (completed) {
    completed = 'completed';
    checked = 'checked';
  } else {
    completed = '';
    checked = '';
  }
  return "<li id=" + id + " class=" + completed + "><table width=100%><tr>\n<td class=handle width=0><td width=100%><div class=todo>\n  <label><input id=check" + id + " type=checkbox " + checked + " onchange=todos.check(this," + id + ")><i></i></label>\n  <div id=text" + id + " data-id=" + id + " contenteditable=true>" + text + "</div>\n</div>\n<td width=0><button class=delete onclick=todos.del(" + id + ")>Delete</button></table>";
};
