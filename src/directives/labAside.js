/**
 * directive: lab-aside
 * NOTE: lab aside can be configured via lab-boot with swipe-on-asides = true/false to
 * enable/disable swipe-to-open the aside. 
 * FURTHER NOTE: this only works if the lab-aside attribute is in a template loaded via lab-view
 * because otherwise lab-boot is processed *after* the binding of the events :(
 *
 */
 angular.module('Centralway.lungo-angular-bridge')
 .directive('labAside', ['labOptions', function(labOptions) {

    (function(self) {
    //From: https://developers.google.com/mobile/articles/fast_buttons

    // Polyfill for IE8 and earlier compatibility (IE8 and < don't have addEventListener)
    // Allow useCapture, see http://www.w3.org/TR/2003/NOTE-DOM-Level-3-Events-20031107/events.html#Events-phases
    function addListener(el, type, listener, useCapture) {
      if (el.addEventListener) { 
        el.addEventListener(type, listener, useCapture);
        return { 
          destroy: function() { el.removeEventListener(type, listener, useCapture); } 
        };
      } else {      
        var handler = function(e) { 
          listener.handleEvent(window.event, listener); 
        }
        el.attachEvent('on' + type, handler);
        return { 
          destroy: function() { el.detachEvent('on' + type, handler); }
        };
      }   
    }
    
    // Are we on mobile device?
    var isTouch = "ontouchstart" in window;

    // Our class FastButton
    self.FastButton = function(element, handler, useCapture) {
      // collect functions to call to cleanup events 
      this.events = [];
      this.touchEvents = [];
      this.element = element;
      this.handler = handler;
      this.useCapture = useCapture;
      if (isTouch) {
        this.events.push(addListener(element, 'touchstart', this, this.useCapture));    
      }
      this.events.push(addListener(element, 'click', this, this.useCapture));
    };
    
    // Remove event handling when no longer needed for this button to avoid DOM Memory Leaks
    self.FastButton.prototype.destroy = function() {
      for (i = this.events.length - 1; i >= 0; i -= 1) {
        this.events[i].destroy();    
      }
      this.events = this.touchEvents = this.element = this.handler = this.fastButton = null;
    };
    
    // In case you didn't know about handleEvent: http://www.thecssninja.com/javascript/handleevent
    self.FastButton.prototype.handleEvent = function(event) {
      switch (event.type) {
        case 'touchstart': this.onTouchStart(event); break;
        case 'touchmove': this.onTouchMove(event); break;
        case 'touchend': this.onClick(event); break;
        case 'click': this.onClick(event); break;
      }
    };
    
    /* 
     https://developers.google.com/mobile/articles/fast_buttons

     Save a reference to the touchstart coordinate and start listening to touchmove and
     touchend events. Calling stopPropagation guarantees that other behaviors don’t get a
     chance to handle the same click event. This is executed at the beginning of touch. */
     self.FastButton.prototype.onTouchStart = function(event) {
      event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
      this.touchEvents.push(addListener(this.element, 'touchend', this, this.useCapture));
      this.touchEvents.push(addListener(document.body, 'touchmove', this, this.useCapture));
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    };
    
    /* 
     https://developers.google.com/mobile/articles/fast_buttons
    
     When a touchmove event is invoked, check if the user has dragged past the threshold of 10px. */
    self.FastButton.prototype.onTouchMove = function(event) {
      if (Math.abs(event.touches[0].clientX - this.startX) > 10 || Math.abs(event.touches[0].clientY - this.startY) > 10) {
        this.reset(); //if he did, then cancel the touch event
      }
    };
    
    /* 
     https://developers.google.com/mobile/articles/fast_buttons

     Invoke the actual click handler and prevent ghost clicks if this was a touchend event. */
    self.FastButton.prototype.onClick = function(event) {
      event.stopPropagation ? event.stopPropagation() : ( event.cancelBubble = true); //IE doesn't have stopPropagation
      this.reset();
      // 'this' value has to be from the element, not from self
      var result = this.handler.call(this.element, event);
      if (event.type == 'touchend')  {
        self.clickbuster.preventGhostClick(this.startX, this.startY);    
      }
      return result;
    };
    
    self.FastButton.prototype.reset = function() {
      for (i = this.touchEvents.length - 1; i >= 0; i -= 1) {
        this.touchEvents[i].destroy();
      }
      this.touchEvents = [];
    };
    
    // A simple wrapper for the clickbuster
    self.clickbuster = function() {}
    
    /* 
    https://developers.google.com/mobile/articles/fast_buttons

    Call preventGhostClick to bust all click events that happen within 25px of
    the provided x, y coordinates in the next 2.5s. */
    self.clickbuster.preventGhostClick = function(x, y) {
      self.clickbuster.coordinates.push(x, y);
      window.setTimeout(self.clickbuster.pop, 2500);
    };
    
    self.clickbuster.pop = function() {
      self.clickbuster.coordinates.splice(0, 2);
    };
    
    /* 
    https://developers.google.com/mobile/articles/fast_buttons

     If we catch a click event inside the given radius and time threshold then we call
     stopPropagation and preventDefault. Calling preventDefault will stop links
     from being activated. */
     self.clickbuster.onClick = function(event) {
      for (var i = 0; i < self.clickbuster.coordinates.length; i += 2) {
        var x = self.clickbuster.coordinates[i];
        var y = self.clickbuster.coordinates[i + 1];
        if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
          event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
          event.preventDefault ? event.preventDefault() : (event.returnValue=false);
        }
      }
    };

    // Only bust clicks on touch devices
    if (isTouch) {
      document.addEventListener('click', self.clickbuster.onClick, true);
      self.clickbuster.coordinates = [];
    }

    })(Lungo); //Lungo Namespace

    var subscribeEvents = function(hrefs) { //STOLEN: from Lungo
      var CLASS = {
        SHOW: Lungo.Constants.CLASS.SHOW
      };
      var show = Lungo.View.Aside.show;
      var hide = Lungo.View.Aside.hide;
      // The following probably sets the minimum distance the user's finger must swipe before the triggering of the aside kicks in
      var MIN_XDIFF = parseInt(document.body.getBoundingClientRect().width / 3, 10);
      hrefs.each(function() {
        var STARTED = false;
        var a = Lungo.dom(this);
        var section = a.closest("section");
        var aside = Lungo.dom('#' + a.attr("lab-aside"));
        
        section.swiping(function(gesture) {
          if(!section.hasClass("aside")) {
            var xdiff =  gesture.currentTouch.x - gesture.iniTouch.x;
            var ydiff =  Math.abs(gesture.currentTouch.y - gesture.iniTouch.y);
            
            STARTED = STARTED ? true : xdiff > 3*ydiff && xdiff < 50;
            
            if(STARTED) {
              xdiff = xdiff > 256 ? 256 : xdiff < 0 ? 0 : xdiff;
              aside.addClass(CLASS.SHOW);
              section.vendor('transform', 'translateX(' + xdiff + 'px)');
              section.vendor('transition-duration', '0s');
            } else {
              section.attr('style', '');
            }
          }  
        });
        
        section.swipe(function(gesture) { 
          var diff = gesture.currentTouch.x - gesture.iniTouch.x;
          var ydiff =  Math.abs(gesture.currentTouch.y - gesture.iniTouch.y);
          section.attr('style', '');
          if(diff > MIN_XDIFF && STARTED) {
            show(aside);
          }
          else {
            hide(aside);
          }
          STARTED = false;
        });
      });
};

return {
  restrict: 'A'
  , link: function(scope, element, attr) {
    var options = {};
    options.swipeEnabled = attr['noSwipe'] ? false : labOptions.doAsideSwipe;
    var asideId = element.attr('lab-aside');
        //var targetEvent = Lungo.Core.environment().isMobile ? 'tap' : 'click';
        var targetEvent = 'tap';
        //TODO: deprecate this environment selection in favour of tap-only
        new Lungo.FastButton(element[0], function(event) {
          Lungo.View.Aside.toggle('#' + asideId);
          event.preventDefault();
        });

        if(options.swipeEnabled) {
          subscribeEvents(Lungo.dom(element[0]));
        }
      }
    }  
  }]);
