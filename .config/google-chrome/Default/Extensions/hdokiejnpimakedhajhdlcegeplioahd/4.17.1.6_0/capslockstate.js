!function(n){var t="unknown",o={init:function(o){n.extend({},o);var e=!0===/MacPPC|MacIntel/.test(window.navigator.platform),r=function(n){var o=!1;n.shiftKey?o=n.shiftKey:n.modifiers&&(o=!!(4&n.modifiers));var r=String.fromCharCode(n.which);return r.toUpperCase()===r.toLowerCase()||(r.toUpperCase()===r?!0===e&&o||(t=!o):r.toLowerCase()===r&&(t=o)),t},i=function(n){return 20===n.which&&"unknown"!==t&&(t=!t),t},a=function(t,o){t!==o&&(n("body").trigger("capsChanged"),!0===o?n("body").trigger("capsOn"):!1===o?n("body").trigger("capsOff"):"unknown"===o&&n("body").trigger("capsUnknown"))};return n("body").bind("keypress.capslockstate",function(n){var o=t;t=r(n),a(o,t)}),n("body").bind("keydown.capslockstate",function(n){var o=t;t=i(n),a(o,t)}),n(window).bind("focus.capslockstate",function(){a(t,t="unknown")}),a(null,"unknown"),this.each(function(){})},state:function(){return t},destroy:function(){return this.each(function(){n("body").unbind(".capslockstate"),n(window).unbind(".capslockstate")})}};jQuery.fn.capslockstate=function(t){return o[t]?o[t].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof t&&t?void n.error("Method "+t+" does not exist on jQuery.capslockstate"):o.init.apply(this,arguments)}}(jQuery);
//# sourceMappingURL=sourcemaps/capslockstate.js.map
