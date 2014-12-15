var toggleTree = function(link) {
  if(link.prop('tagName') === 'SPAN') {
    link = link.parent();
  }
  link.parent().parent().children('ul').toggle();
  var span = link.children('span');
  var down = link.children('span').hasClass('icon-chevron-down');
  span.removeClass('icon-chevron-down').removeClass('icon-chevron-right').addClass(down ? 'icon-chevron-right' : 'icon-chevron-down');
};