!function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}({0:function(e,t,n){e.exports=n(839)},128:function(e,t,n){try{(function(){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var e=function(){},n={start:e,stop:e,printInclusive:e,printExclusive:e,printWasted:e},r=(t.perfStart=function(){return n.start()},t.perfFinish=function(){n.stop(),n.printInclusive(),n.printWasted()},function(e,t){var n=document.createElement("div");return n.style.width="310px",n.style.position="absolute",n.style.bottom="10px",n.style.left="10px",n.style.backgroundColor="white",n.style.border="solid 1px teal",n.style.zIndex="999",n.style.fontSize="13px",n.style.lineHeight="15px",n.style.padding="10px 9px",n.style.borderRadius="3px",n.id=e,n.innerText=t,n}),o=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"\n";return window.popupPerformanceMarkers.map(function(e,t){var n=window.popupPerformanceMarkers[t-1]||{},r=e.timestamp-(n.timestamp||e.timestamp),o=e.timestamp-window.popupPerformanceMarkers[0].timestamp;return e.timestamp+" - "+o+"ms - "+r+"ms - "+e.label}).join(e)},a=function(e){if(e.ctrlKey&&e.altKey&&68===e.keyCode){if(document.getElementById("debug"))return void document.getElementsByTagName("body")[0].removeChild(document.getElementById("debug"));var t=o(),n=r("debug",t);document.getElementsByTagName("body")[0].appendChild(n)}};window.popupPerformanceMarkers||(window.popupPerformanceMarkers=[],window.printPreformanceMarkers=function(){return console.log(o())},window.addEventListener("keydown",a));t.mark=function(e){window.popupPerformanceMarkers.push({label:e,timestamp:Date.now()})}}).call(this)}finally{}},839:function(e,t,n){try{(function(){"use strict";function e(){(0,o.mark)("app.ready"),document.getElementById("head").remove(),document.getElementById("app").style.display="block",document.getElementById("container").classList.remove("loader"),window.removeEventListener("app-ready",e)}function t(){var e=document.createElement("link");e.rel="stylesheet",e.type="text/css",e.href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,300,300italic,400italic,600,600italic,700,700italic,800,800italic";var t=document.getElementsByTagName("head")[0];t.appendChild(e)}function r(){setTimeout(function(){(0,o.mark)("loader.bundle"),t();var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src="bundle.js";var n=document.getElementsByTagName("body")[0];n.appendChild(e)},100),window.removeEventListener("load",r)}var o=n(128);(0,o.mark)("loader.start"),window.addEventListener("app-ready",e),window.addEventListener("load",r)}).call(this)}finally{}}});