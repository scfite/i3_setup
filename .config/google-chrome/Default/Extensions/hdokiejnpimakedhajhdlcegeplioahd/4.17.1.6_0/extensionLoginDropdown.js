ExtensionDropdown=function(){window.addEventListener("unload",function(){bg.removeModalOverlay(),o()});var o=function(){Topics.get(Topics.CLEAR_DATA).publish(),Dialog.prototype.closeAllDialogs({forceClose:!0})},n=function(o,n){n=$.extend(n,{isPopup:!0,onResize:function(o,n){LPPlatform.setDropdownPopoverSize(o,n)},onClose:function(){LPPlatform.closePopup()}}),LPDialog.openDialog(o,n)};return{open:function(){!bg.get("lploggedin")&&bg.get("g_badgedata")&&"notification"===bg.get("g_badgedata").cmd?(dialogs.notification.open({notification:bg.get("g_notification_data"),onResize:function(o,n){LPPlatform.setLoginPopoverSize(o,n)},onClose:function(){LPPlatform.closePopup()}}),bg.clear_badge()):bg.get("LPContentScriptFeatures")&&"context"===bg.get("LPContentScriptFeatures").intro_tutorial_version?bg.get_saved_logins(function(o){o.length>0?n("loginTab"):bg.userHasAccount(function(o){o?n("loginTab"):bg.get("g_isedge")?n("createAccountIcon"):bg.showModalOverlay(function(){n("createAccountIcon")})})}):n("loginTab")},reset:o,openDialog:n}}();
//# sourceMappingURL=sourcemaps/extensionLoginDropdown.js.map