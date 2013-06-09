(function(lab, Lungo) {
  var quoEvents = 'swipe swiping swipeLeft swipeRight swipeDown swipeUp'
    + ' tap hold singleTap doubleTap'
    + ' pinch pinching pinchIn pinchOut'
    + ' rotate rotating rotateLeft rotateRight';
  angular.forEach(
    quoEvents.split(' '),
    function(name) {
      var normalisedName = name.charAt(0).toUpperCase() + name.slice(1);
      var directiveName = 'lab' + normalisedName;
      lab.directive(directiveName, ['$parse', function($parse) {
        return {
          restrict: 'A',
          link: function(scope, element, attr) {
            var fn = $parse(attr[directiveName]);
            Lungo.dom(element[0]).on(name, function(event) {
              event.preventDefault();
              scope.$apply(function() {
                fn(scope, {$event:event});
              }); 
            });
          }
        };
      }]);

    });
  
  lab.directive('href', ['$location', function($location) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        if(element[0].tagName.toUpperCase() !== 'A') {
          return;
        }
        if(attr['noHref'] !== undefined) {
          console.log('directive:href - explicit unbind, not handling taps');
          return;
        }
        var url = attr['href'];
        new Lungo.FastButton(element[0], function(event){
          //We need to fire the element with native javascript and not the Lungo
          //wrapper, otherwise won't be catched by our ghostclickbuster.
          //Crossbrowser solution, of course
          if ( document.createEvent ) {
            var evt = document.createEvent('MouseEvents');
            evt.initEvent('click', true, false);
            element[0].dispatchEvent.apply(element[0], evt);  
          } else if( document.createEventObject ) {
            element[0].fireEvent.apply(element[0], 'onclick') ; 
          } else if (typeof node.onclick == 'function' ) {
            element[0].onclick.apply(element[0]); 
          }
        });
      }
  }}])  
}(angular.module('Centralway.lungo-angular-bridge'), Lungo));
