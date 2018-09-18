var fn_addin=function(l,i,e){var d=d||{};return d.styles=d.styles||{},d.commands=d.commands||{},d.dependencies=e||d.dependencies||{},d.styles.style=function(){},d.views=d.views||{},d.collect=d.collect||{},d.models=d.models||{},d.templates=d.templates||{},d.templates=d.templates||{},d.templates["focus-prompt-template"]=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,s){return'<h3>What is your main focus for today?</h3>\n<input type="text">'},useData:!0}),d.templates["focus-template"]=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,s){var i,n=t.helperMissing,c="function",a=this.escapeExpression;return"<h3>"+a(typeof(i=null!=(i=t.day||(null!=e?e.day:e))?i:n)===c?i.call(e,{name:"day",hash:{},data:s}):i)+'</h3>\n<span class="control checkbox"><i class="icon icon-checkbox-empty focus-open"></i><i class="icon icon-checkbox focus-done"></i></span><p class="todays-focus">'+a(typeof(i=null!=(i=t.focus||(null!=e?e.focus:e))?i:n)===c?i.call(e,{name:"focus",hash:{},data:s}):i)+'</p><span class="control delete"><i>✕</i></span>\n'},useData:!0}),d.templates["focuses-template"]=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,s){return'<ol></ol>\n<div class="focus-message-wrapper team-goal-wrapper">\n    <div class="message focus-message">\n        <i class="loading-icon"></i>Loading...</span>\n    </div>\n</div>\n'},useData:!0}),d.styles=d.styles||{},d.styles.style=function(){var e=document.createElement("style");e.type="text/css",e.innerHTML='#focuses .focus p,#focuses h3,#focuses ol{padding:0;margin:0}#focuses{width:100%;font-size:187.5%;line-height:150%}#focuses::before{height:335px;width:100%;position:absolute;top:-92px;left:0;z-index:-1;background:url(../img/overlay-focus.png) 50% 0 no-repeat;background-size:contain;content:" "}#focuses .focus,#focuses .focus p{position:relative}#focuses .focus{height:94px;width:100%;opacity:0;display:inline-block!important;overflow:visible}#focuses .todays-focus,#focuses input{font-size:120%;line-height:120%}#focuses .prompt h3{font-weight:300}#focuses .prompt input{width:13.8em;margin:0 auto;padding-top:15px;display:block;background:0;border:0;border-bottom:2px solid #fff;color:#fff;font-weight:500;outline:0;text-align:center;transition:border-color .2s ease}#focuses .control,#focuses .delete i{transition:all .1s ease-in-out;vertical-align:top}#focuses .focus h3{margin:17px 0 3px;font-size:70%;line-height:120%;text-transform:uppercase}#focuses .todays-focus{max-width:88%;margin:3px 0 1px!important;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#focuses .complete .todays-focus{text-decoration:line-through;opacity:.85}#focuses .control{display:inline-block;opacity:0;border:1px solid rgba(255,255,255,0);border-radius:100px;cursor:pointer;transform-origin:50% 50%}#focuses:hover .control{opacity:.8}#focuses .complete .control,#focuses ol:hover .checkbox{opacity:1}#focuses .checkbox{width:24px;margin-left:-4px;padding:14px 12px;border:none;font-size:80%;line-height:100%;text-align:left;text-shadow:0 0 15px rgba(0,0,0,.3)}#focuses .focus-open{margin-left:-1.7px}#focuses .complete .focus-done,#focuses .focus-open{display:block}#focuses .complete .focus-open,#focuses .focus-done{display:none}#focuses .complete .focus-done{opacity:.85}#focuses .delete,#focuses .team-focus-dropdown-icon{height:28px;width:28px;margin:12px 0 0 14px;font-size:70%;line-height:28px}#focuses .delete:hover,#focuses .new:hover{border:1px solid rgba(255,255,255,.5);opacity:1;transform:scale(1.1)}#focuses .delete i{height:28px;width:28px;display:inline-block;font-size:12px;font-weight:700;line-height:28px;transform-origin:50% 50%}#focuses .complete .delete i{transform:rotate(45deg)}.focus-message{margin-top:-2px;display:none;font-size:50%;line-height:100%}#focuses.loading{display:block}.focus-message .retry{margin-left:-2px;padding:4px;cursor:pointer;text-decoration:underline;transition:var(--a-default)}.focus-message .retry:hover{opacity:.7}#focuses .loading input{border-color:rgba(255,255,255,.5);color:transparent}#focuses .cached .control{display:none}#focuses .cached .todays-focus{max-width:none}',document.getElementsByTagName("head")[0].appendChild(e)},d.collect.FocusesBase=Backbone.Collection.extend({saveOptions:{},attributes:{},successfulLoad:!1,loadingFromServer:!0,fetchedOnce:!1,initialize:function(){this.on("reset",this.onReset,this),this.on("add",this.onAdd,this),this.on("change",this.onModelChanged,this)},fetch:function(e){this.fetchedOnce=!0;return e=_.extend(e||{},{}),Backbone.Collection.prototype.fetch.call(this,e)},onReset:function(){this.successfulLoad=!0,this.loadingFromServer=!1,this.trigger("loadingFromServerChanged")},onModelChanged:function(e){var t=e.changedAttributes(),o=_.keys(t);0<_.without(o,"archived","archivedDate").length&&this.saveCachedFocus(e)},comparator:function(e){var t=e.get("completedDate");return t||(t=e.get("createdDate"))?-Date.parse(t):0},activeFocus:function(){var o=this;return new Promise(function(e,t){e(o.activeFocusBase())})},activeFocusBase:function(){if(this.loadingFromServer)return this.fetchedOnce||this.fetch({reset:!0}),this.cachedFocus();if(0===this.length)return localStorage.removeItem("cachedFocus"),null;var o=null,e=getActiveDateString(),t=this.where({completed:!1,archived:!1,forDate:e});if(1===t.length)o=t[0];else if(0===t.length)if(1===(t=this.where({completed:!0,archived:!1,forDate:e})).length)o=t[0];else if(0===t.length)return localStorage.removeItem("cachedFocus"),null;return null==o&&_.each(t,function(e){if(null==o)o=e;else{var t=e.get("completedDate");o.get("completedDate")<t&&(o=e)}}),o?this.saveCachedFocus(o):localStorage.removeItem("cachedFocus"),o},saveCachedFocus:function(e){localStorage.cachedFocus=JSON.stringify(e)},cachedFocus:function(){if(localStorage.cachedFocus){var e=JSON.parse(localStorage.cachedFocus),t=getActiveDateString();if(e&&e.forDate===t)return e.cached=!0,new this.model(e)}return null}}),d.collect.FocusesLegacy=d.collect.FocusesBase.extend({localStorage:new Backbone.LocalStorage("momentum-focus"),saveOptions:{},initialize:function(){this.model=d.models.FocusBase,d.collect.FocusesBase.prototype.initialize.apply(this,arguments)},onReset:function(){this.loadingFromServer=!1,this.fixNullForDate(),this.trigger("loadingFromServerChanged")},fixNullForDate:function(){var e=this.where({archived:!1,forDate:null});e&&0<e.length&&_.each(e,function(e){var t=e.get("createdDate");if(t){var o=Date.parse(t);activeDateStringForDate(o)!=getActiveDateString()&&e.archive()}else e.archive()},focus)}}),d.collect.Focuses=d.collect.FocusesBase.extend({url:l.globals.urlRoot+"focus",saveOptions:{patch:!0},initialize:function(){this.model=d.models.Focus,d.collect.FocusesBase.prototype.initialize.apply(this,arguments)},activeFocus:function(){var c=this;return new Promise(function(n,e){if(l.conditionalFeatures.featureEnabled("pinfocus")&&l.models.customization.getComputedSetting("autoFocus")){var t=c.cachedFocus();l.widgetManager.getWidgetAsync("todo").then(function(e){var t=e.getTopTodo();if(t){var o={};o.id="todo-"+t.id,o.focus=t.get("title"),o.day="today",o.todoId=t.id;var s=t.collection.parentList.project;o.listId=t.get("listId"),o.projectId=t.get("projectId")||s.id,o.providerId=s.provider.id,o.forDate=getActiveDateString();var i=new d.models.Focus(o);c.saveCachedFocus(i),n(i)}else c.fetchedOnce?c.successfulLoad&&void 0!==t?n(c.activeFocusBase()):n(c.cachedFocus()):c.fetch({reset:!0})}),!c.fetchedOnce&&t&&n(t)}else n(c.activeFocusBase())})},triggerCollectionReset:function(){this.trigger("reset")},selectedListCacheKey:function(){return localStorage.activeTodoProvider?"activeTodoListId-"+localStorage.activeTodoProvider:null}}),d.models.FocusBase=Backbone.Model.extend({defaults:{focus:"",day:"",forDate:null,archived:!1,createdDate:new Date,archivedDate:null,completed:!1,completedDate:null,cached:!1},saveOptions:function(){return this.collection&&this.collection.saveOptions?this.collection.saveOptions:{}},archive:function(){var e=new Date;this.save({archived:!0,archivedDate:e},this.saveOptions())},toggleCompleted:function(){var e=this.saveOptions(),t=!this.get("completed");return this.save({completed:t,completedDate:this.get("completed")?null:new Date},e),t}}),d.models.Focus=d.models.FocusBase.extend({urlRoot:function(){return this.collection?null:l.globals.urlRoot+"focus"},toggleCompleted:function(){var s=this,e=this.saveOptions(),i=!this.get("completed");if(l.conditionalFeatures.featureEnabled("pinfocus")){var n=s.get("todoId");e.success=function(){l.trigger("focus:toggled",i),s.get("refreshTodo")&&n&&l.trigger("todo:refresh",n)},e.error=function(e,t,o){200==t.status&&(l.trigger("focus:toggled",i),s.get("refreshTodo")&&n&&l.trigger("todo:refresh",n))};var t={completed:i,completedDate:this.get("completed")?new Date:null};this.id.startsWith("todo-")&&(t.todoId=this.get("todoId"),t.projectId=this.get("projectId"),t.providerId=this.get("providerId"),t.listId=this.get("listId"),t.focus=this.get("focus")),this.save(t,e),l.trigger("todo:set:done",n,i)}else this.save({completed:i,completedDate:this.get("completed")?null:new Date},e);return i},archive:function(){if(!this.id.startsWith("todo-")){var e=new Date;this.save({archived:!0,archivedDate:e},this.saveOptions())}l.conditionalFeatures.featureEnabled("pinfocus")&&l.models.customization.getComputedSetting("autoFocus")&&l.models.customization.set("autoFocus",!1)},saveOptions:function(){return this.collection&&this.collection.saveOptions?this.collection.saveOptions:{patch:!0}}}),d.views.Focus=Backbone.View.extend({tagName:"li",attributes:{class:"focus"},template:d.templates["focus-template"],events:{"click .delete":"destroy","click .checkbox":"toggleCompleted"},initialize:function(e){e&&e.skipRender||this.render(),this.listen()},changeModel:function(e){this.stopListening(),this.model=e,this.listen()},listen:function(){this.listenTo(this.model,"change",this.render),l.conditionalFeatures.featureEnabled("pinfocus")&&(this.listenTo(l,"todo:changed",this.todoChanged),this.listenTo(l,"todo:changing",this.todoChanging),this.listenTo(l,"focus:toggled",this.focusToggled),this.listenTo(l.models.customization,"change:autoFocus",this.autoFocusChanged))},todoChanged:function(e,t){e==this.model.get("todoId")&&l.conditionalFeatures.featureEnabled("pinfocus")&&l.models.customization.getComputedSetting("autoFocus")&&d.collect.focuses&&t.hasOwnProperty("done")&&d.collect.focuses.fetch({reset:!0})},todoChanging:function(e,t){e==this.model.get("todoId")&&(t.hasOwnProperty("done")&&this.model.set("completed",t.done),t.hasOwnProperty("title")&&this.model.set("focus",t.title),t.hasOwnProperty("done")&&this.displayAutoPinMessage(t.done))},render:function(){var e={focus:l.utils.captionFormatter(this.model.get("focus")),day:"Today"};return this.$el.html(this.template(e)),this.model.changed.hasOwnProperty("completed")?this.$el.toggleClass("complete",this.model.changed.completed):this.$el.toggleClass("complete",this.model.get("completed")),this.$el.toggleClass("cached",this.model.get("cached")),this},displayAutoPinMessage:function(e){l.conditionalFeatures.featureEnabled("pinfocus")&&l.models.customization.getComputedSetting("autoFocus")&&d.views.focuses.displayLoadingMessage(e)},focusToggled:function(e){e&&l.conditionalFeatures.featureEnabled("pinfocus")&&l.models.customization.getComputedSetting("autoFocus")&&(this.displayAutoPinMessage(e),d.collect.focuses&&d.collect.focuses.fetch({reset:!0}))},destroy:function(){if(this.$el.hasClass("complete"))l.sendEvent("Focus","Add New"),l.trigger("setNewFocus");else{l.sendEvent("Focus","Delete");var e=this;this.$el.fadeTo(500,0,function(){e.destroyed=!0,e.model.archive(),e.remove(),l.trigger("deleteFocus")})}},autoFocusChanged:function(){this.destroyed&&l.conditionalFeatures.featureEnabled("pinfocus")&&!l.models.customization.getComputedSetting("autoFocus")&&l.trigger("setNewFocus")},removeView:function(){this.remove(),this.unbind()},toggleCompleted:function(){d.views.focuses.randomizeCongratsMessage();var e=this.model.toggleCompleted();d.views.focuses.displayLoadingMessage(e),l.conditionalFeatures.featureEnabled("serverfocus")||setTimeout(function(){d.views.focuses.dismissConnectionMessage()},3e3),this.$el.toggleClass("complete",e),l.sendEvent("Focus","Done")}}),d.views.Focuses=Backbone.View.extend({attributes:{id:"focuses",class:"app-container focuses"},template:d.templates["focuses-template"],events:{"mouseover .todays-focus":"onMouseOver","click .todays-focus":"onClickFocus","click .prompt":"onClickFocus","click .retry":"retryConnection"},offline:!0,loading:!1,clickedOnce:!1,retrying:!0,congratsMessageActive:!1,initialize:function(){this.congratsList=["Great work!","Good job!","Nice.","Way to go!"],this.listenTo(l,"focus:pin",this.focusPin,this),this.listenTo(l,"newDay",this.changeDay,this),this.listenTo(l,"setNewFocus",this.setNewFocus,this),this.listenTo(l,"deleteFocus",this.setNewFocus,this),this.listenTo(l,"todo:loadingStateChange",this.todoLoadingStateChanged),this.listenTo(l,"todo:managerReady",this.todoLoadingStateChanged),this.listenTo(l,"todo:globalChange",this.todoLoadingStateChanged),this.listenTo(d.collect.focuses,"change:archived",this.todayArchived),this.listenTo(d.collect.focuses,"reset",this.collectionReady),this.listenTo(d.collect.focuses,"sync",this.successfulConnection),this.listenTo(this.collection,"request",this.collectionRequest),this.listenTo(this.collection,"error",this.collectionError),this.listenTo(l.models.customization,"change:focusVisible",this.visibleChanged),this.listenTo(l.models.customization,"change:autoFocus",this.autoFocusChanged),this.listenTo(l,"todo:showAssignedTodosOnlyChanged",this.onShowAssignedTodosOnlyChanged),this.listenTo(l,"todo:sectionExpansion",this.onSectionExpansion),this.renderedOnce=!1,this.lastStateFocused=!1,this.randomizeCongratsMessage(),this.teamGoalEnabled=!1,l.conditionalFeatures.featureEnabled("team")&&l.widgetManager.loadWidget("teamFocus"),this.render()},focusPin:function(e){d.views.focuses.displayConnectingText('<i class="loading-icon"></i>Saving...',!0);var t=getActiveDateString(),o=e.collection.parentList.project,s={todoId:e.id,listId:e.get("listId"),projectId:e.get("projectId")||o.id,providerId:o.provider.id,forDate:t};i.ajax({type:"POST",contentType:"application/json",data:JSON.stringify(s),beforeSend:setMomentumAuthHeader,url:l.globals.urlRootApi+"focus/pin"}).done(function(e){e.success&&!0===e.success&&(d.views.focuses.successfulConnection(),l.models.customization.getComputedSetting("autoFocus")?l.models.customization.set("autoFocus",!1):d.collect.focuses.fetch({reset:!0}))}).fail(function(e,t){})},onMouseOver:function(){this.loading&&this.displayConnectingText(null,!0)},onClickFocus:function(){this.offline&&this.displayConnectingText(null,!0),this.clickedOnce=!0},visibleChanged:function(e){l.models.customization.getComputedSetting("focusVisible")?this.renderedOnce?this.$el.mFadeIn():this.render():this.$el.mFadeOut()},collectionRequest:function(){this.loading=!0,this.clickedOnce||this.connectingTextOverride},promptFocused:function(){this.loadedOnce||this.displayConnectingText()},displayConnectingText:function(e,t){e&&(this.connectingTextOverride=e);var o=this;function s(){o.$message.html(o.connectingTextOverride?o.connectingTextOverride:'<i class="loading-icon"></i>Loading...'),o.$message.addClass("loading"),o.$message.is(":visible")||o.$message.fadeIn(500)}this.teamGoalEnabled?l.trigger("focus:showMessage",function(){s()}):s()},randomizeCongratsMessage:function(){this.loadingMessage=this.congratsList[Math.floor(Math.random()*this.congratsList.length)]},displayLoadingMessage:function(e){var t=this;e?(this.displayConnectingText('<i class="loading-icon"></i>'+this.loadingMessage,!0),this.congratsMessageActive=!0):this.displayConnectingText('<i class="loading-icon"></i> Loading...',!0),setTimeout(function(){t.dismissConnectionMessage(!1,function(){t.congratsMessageActive=!1})},4e3)},todoLoadingStateChanged:function(e){e&&"Selected"===e||this.render()},onShowAssignedTodosOnlyChanged:function(){this.render()},onSectionExpansion:function(){this.render()},collectionError:function(e,t,o){200!==t.status?this.failedConnection():this.successfulConnection()},retryConnection:function(e){e.preventDefault(),e.stopPropagation(),this.displayConnectingText('<i class="loading-icon"></i>Loading...',!0),this.retrying=!0;var t=this;d.views.focusPrompt?l.syncCoordinator.pingApi(function(){t.successfulConnection(),d.views.focusPrompt&&d.views.focusPrompt.focusInput()},function(){t.failedConnection(!0)}):this.collection.fetch({reset:!0})},successfulConnection:function(){this.congratsMessageActive||this.dismissConnectionMessage(!0),this.loading=!1,this.offline=!1,this.retrying=!1,this.loadedOnce=!0},failedConnection:function(e){this.loading=!1,this.offline=!0,this.render(),this.displayConnectingText('Trouble connecting… <span class="retry">Retry</span>',e||this.clickedOnce)},dismissConnectionMessage:function(e,t){var o=t;this.teamGoalEnabled&&(o=function(){l.trigger("focus:hideMessage"),t&&t()}),this.$message&&this.$message.fadeOut(e?0:300,o)},parentReady:function(e){this.isParentReady=!0,(this.isCollectionReady||e)&&this.render()},collectionReady:function(){this.isCollectionReady=!0,this.isParentReady&&this.render(),this.successfulConnection()},setNewFocus:function(){this.render(!0),d.views.focusPrompt&&d.views.focusPrompt.focusInput(),this.dismissConnectionMessage()},autoFocusChanged:function(){this.render()},setFocusState:function(e){this.lastStateFocused==e?this.focusStateChanged=!1:this.focusStateChanged=!0,this.lastStateFocused=e},render:function(e){var n=!1,c=this;if(d.views.focusPrompt&&(n=d.views.focusPrompt.controlFocusedOnce),!this.renderedOnce){var t=(this.options.order||"append")+"To";this.$el[t]("."+this.options.region).html(this.template()),this.$message=this.$(".message")}var a=this.renderedOnce&&l.readyForWidgets;return this.renderedOnce=!0,e?(this.activateFocusPrompt(n),void l.trigger("focus:loaded")):(this.collection.activeFocus().then(function(e){if(!e||!d.views.todayFocus||d.views.todayFocus.model.id!==e.id||d.views.todayFocus.model.get("cached"))if(e){c.setFocusState(!0);var t=!1,o=null;d.views.todayFocus?d.views.todayFocus.model.id!==e.id?d.views.todayFocus.model.id.startsWith("todo-")?d.views.todayFocus.model.get("todoId")!==e.get("todoId")&&(t=!0,o=d.views.todayFocus):(t=!0,o=d.views.todayFocus):d.views.todayFocus.model.collection||(t=!0,o=d.views.todayFocus,a=!1):t=!0;var s=!1;if(o&&o.model.id===e.id&&(s=!(o=null)),a=a&&(t&&!o||o&&!s),t){c.dismissConnectionMessage(),c.$el.find(".prompt").fadeTo(500,0),a&&o&&o.$el.fadeTo(500,0),d.views.focusPrompt=null,s?d.views.todayFocus.changeModel(e):d.views.todayFocus=new d.views.Focus({model:e,skipRender:!0});var i=0<c.$el.find(".prompt").length;setTimeout(function(){if(i&&c.$el.find(".prompt").remove(),o&&o.removeView(),d.views.todayFocus){var e=d.views.todayFocus.render().$el.fadeTo(a?500:0,1),t=c.$el.find("ol li");0<t.length?t.replaceWith(e):c.$el.find("ol").append(e)}l.trigger("focus:loaded")},o?500:0)}}else c.activateFocusPrompt(n),l.trigger("focus:loaded")}),this)},activateFocusPrompt:function(e){this.setFocusState(!1),d.views.todayFocus&&(this.$el.find("li.focus").fadeTo(0,0).remove(),d.views.todayFocus=null),d.views.focusPrompt||(d.views.focusPrompt=new d.views.FocusPrompt({collection:this.collection}),this.$el.prepend(d.views.focusPrompt.render().$el.fadeIn(this.focusStateChanged?500:0))),e&&d.views.focusPrompt.focusInput()},addToday:function(e){l.sendEvent("Focus","Save"),d.views.todayFocus=new d.views.Focus({model:e}),this.$el.find("ol").append(d.views.todayFocus.render().$el.fadeTo(500,1))},successfullyCreatedNewFocus:function(){d.views.focuses.successfulConnection(),this.render()},changeDay:function(){d.collect.focuses.fetch({reset:!0})},todayArchived:function(){this.render()}}),d.views.FocusPrompt=Backbone.View.extend({attributes:{class:"prompt"},template:d.templates["focus-prompt-template"],events:{click:"focusInput","focus input":"handleFocus","keypress input":"handleInput","keyup input":"handleKeyup","blur input":"handleBlur"},initialize:function(){this.focusedOnce=!1,this.listenTo(l,"globalEvent:toggleFocus",this.toggleShow),this.listenTo(l,"globalEvent:esc",this.hide),this.render()},render:function(){return this.$el.html(this.template()),this.$input=this.$el.find("input"),this.collection.loadingFromServer||this.$input.focus(),this},focusInput:function(){this.$input.focus()},handleFocus:function(e){this.focusedOnce=!0,d.views.focuses.promptFocused()},handleBlur:function(){this.focusedOnce=!1,this.$el.removeClass("loading")},handleInput:function(e){this.collection.loadingFromServer&&e.preventDefault(),this.clearHelpTimeout(),13==e.keyCode?this.save():this.startHelpTimeout()},handleKeyup:function(){0==this.getInput().length&&d.views.focuses.dismissConnectionMessage()},getInput:function(){return this.$input.val().trim()},inputTimeout:"",startHelpTimeout:function(){var e=this;this.inputTimeout=setTimeout(function(){e.displayHelpMessage()},5e3)},clearHelpTimeout:function(){0<this.inputTimeout&&clearTimeout(this.inputTimeout)},displayHelpMessage:function(){0<this.getInput().length&&d.views.focuses.displayConnectingText("Press enter to set your focus",!0)},save:function(){var e=this.getInput();if(e){var s=this;d.views.focuses.displayConnectingText('<i class="loading-icon"></i>Saving...',!0);var t=getActiveDateString();d.collect.focuses.create({focus:e,day:"today",forDate:t},{wait:!0,success:function(){d.views.focuses.successfulConnection(),d.views.focuses.successfullyCreatedNewFocus()},error:function(e,t,o){s.$input.addClass("pulse"),d.views.focuses.failedConnection(!0)}})}},toggleShow:function(){this.$input.is(":focus")?this.$input.blur():this.$input.focus()},hide:function(){this.$input.is(":focus")&&this.$input.blur()}}),d.styles.style(),l.widgetManager.handover("focuses",null,{region:"top-left",order:"prepend",bootstrap:function(e,t){l.conditionalFeatures.checkFeatureAndMigrateData("serverfocus","focusVisible","momentum-focus",function(){d.collect.focuses=new d.collect.Focuses,d.views.focuses=new d.views.Focuses({collection:d.collect.focuses,model:l.models.date,el:e,region:"center-below",order:"append"}),l.conditionalFeatures.featureEnabled("pinfocus")&&l.models.customization.getComputedSetting("autoFocus")||d.collect.focuses.fetch({reset:!0}),d.views.focuses.parentReady(!0),t&&t(d.views.focuses)},function(){d.collect.focuses=new d.collect.FocusesLegacy,d.views.focuses=new d.views.Focuses({collection:d.collect.focuses,model:l.models.date,el:e,region:"center-below",order:"append"}),d.collect.focuses.fetch({reset:!0}),d.views.focuses.parentReady(!0),t&&t(d.views.focuses)})}}),d};m.addinManager&&m.addinManager.registerAddinFn("fb230b62-96ce-44b5-87c5-4a563553038f",fn_addin);