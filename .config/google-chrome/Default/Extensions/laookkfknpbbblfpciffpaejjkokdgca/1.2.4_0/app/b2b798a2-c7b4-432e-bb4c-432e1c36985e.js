var fn_addin=function(g,u,e){var t=t||{};t.styles=t.styles||{},t.commands=t.commands||{},t.dependencies=e||t.dependencies||{},t.styles.style=function(){},t.views=t.views||{},t.collect=t.collect||{},t.models=t.models||{},t.templates=t.templates||{},t.templates=t.templates||{},t.templates.general=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,i,n){return'<h3>General</h3>\n<p class="description">Customize your dashboard</p>\n\n\n<h4>Show</h4>\n<ul id="apps-list" class="settings-list options-list"></ul>\n\n\n<h4>Customize</h4>\n<ul id="customize-list" class="settings-list options-list"></ul>\n\n\n<h4>Options</h4>\n<ul id="misc-list" class="settings-list options-list"></ul>\n\n\n<h5>Tip</h5>\n<p class="no-top-margin">Many items in Momentum can be edited by double clicking on them, including: <strong>your name</strong>, <strong>the clock</strong>, and <strong>to-dos</strong>.\n'},useData:!0});var i=t.dependencies.settings;return t.views.General=i.views.SettingsPanel.extend({attributes:{id:"settings-general",class:"settings-view settings-general"},template:t.templates.general,panelid:"general",events:{"click .slide-toggle":"toggleSlider","dblclick .slide-toggle":"eatDblClick","click .config-button":"configWidget","click .sync-option":"toggleSyncSlider","click .balanced-message":"switchToBalanceSettings","click .toggle-option":"toggleOption"},initialize:function(){this.model=g.models.customization,this.initializeCustomizeItems(),this.listenTo(this.model,"change",this.customizationModelChanged)},initializeCustomizeItems:function(){var e=g.models.themeManager.getAvailableFonts();this.customizeItems=[{name:"Theme",field:"themeColour",widget:"themeColour",options:[{label:"Dark",value:"dark"},{label:"Light",value:"light"},{label:"Custom",value:"custom",view_cmd:"settings.color.picker",view_opt:{settingName:"themeColour",ignoreClick:!0},show_always:!0}],default:"dark",plusOnly:!0,section:"customize"},{name:"Font",field:"themeFont",widget:"themeFont",options:e,default:"default",plusOnly:!0,section:"customize"},{name:"Links",widget:"linksVisible",field:"linksVisible",section:"widgets"},{name:"Bookmarks Bar",widget:"bookmarksVisible",field:"bookmarksVisible",section:"widgets"},{name:"Search",widget:"searchVisible",field:"searchVisible",section:"widgets"},{name:"Weather",widget:"weatherVisible",field:"weatherVisible",section:"widgets"},{name:"Focus",widget:"focusVisible",field:"focusVisible",section:"widgets"},{name:"Quote",widget:"quoteVisible",field:"quoteVisible",section:"widgets"},{name:"Todo",widget:"todoVisible",field:"todoVisible",section:"widgets"},{name:"Countdown",widget:"countdownVisible",field:"countdownVisible",plusOnly:!0,message:"Count down to important dates",section:"widgets"},{name:"Notes",widget:"notesVisible",field:"notesVisible",plusOnly:!0,message:"Take quick notes and store wisdom to review",section:"widgets"},{name:"World Clocks",widget:"multiClockVisible",field:"multiClockVisible",plusOnly:!0,message:"Keep track of time anywhere on Earth",section:"widgets",beta:!0},{name:"Clock Format",field:"hour12clock",widget:"clock-format",boolean:!0,options:[{label:"12 hour",value:!0},{label:"24 hour",value:!1}],section:"misc"},{name:"Percent Clock",widget:"percentClock",field:"percentClock",message:"Visualize your progression through the work day",section:"misc",configLabel:"Customize",configCommand:"settings.display",configOptions:{section:"balance",scheduleVisible:!0}},{name:"Search Provider",field:"searchProvider",widget:"search-provider",options:[{label:"Google",value:"google"},{label:"Bing",value:"bing"}],section:"misc"}]},render:function(){g.models.customization.get("displayname"),localStorage.email;var e=!!localStorage.token;this.$el.html(this.template({loggedIn:e}));var t={customize:this.$el.find("#customize-list"),widgets:this.$el.find("#apps-list"),misc:this.$el.find("#misc-list")};return _.each(t,function(e){e.empty()}),_.each(this.customizeItems,function(e){e.feature&&!g.conditionalFeatures.featureEnabled(e.feature)||(e.options?t[e.section].append(i.templates["general-toggle-options"](e)):t[e.section].append(i.templates["general-toggle-slider"](e)))}),this.updateControlStates(_.pluck(this.customizeItems,"field")),this},customizationModelChanged:function(e){if(e){var t=e.changedAttributes(),i=_.keys(t);this.updateControlStates(i)}},updateControlStates:function(e){var l=this,c=g.conditionalFeatures.featureEnabled("plus");_.each(e,function(e){var i=_.findWhere(l.customizeItems,{field:e});if(i){var n=l.model.get(e);if(i.options){i.plusOnly&&!c&&(n=i.default),l.$el.find("."+i.widget).removeClass("active");var o=l.$el.find("."+i.widget+"[data-option-value='"+n+"']").first();o.addClass("active"),_.each(i.options,function(e){if(e.view_cmd){var t=(o=l.$el.find("."+i.widget+"[data-option-value='"+e.value+"']").first()).find(".sub-view").first();if(!e.view&&e.show_always&&(e.view=g.commandManager.execute(e.view_cmd,e.value,e.view_opt)),0==t.children().length&&(t.html(e.view.render().$el),t.css("display","inline-block")),e.value!=n)return e.show_always||t.hide(),!e.view||!e.view.dismiss||e.view.dismiss(),void(!e.view||!e.view.setInactive||e.view.setInactive());!e.view||!e.view.setActive||e.view.setActive()}})}else{var t=l.model.getComputedSetting(e);n=!(i.plusOnly&&!c)&&!!n;var s=l.$el.find("[data-related-widget='"+i.widget+"']");if(s&&1===s.length){var a=s.first();a.toggleClass("on",n),n!=t&&(i.plusOnly&&c||!i.plusOnly)&&!a.hasClass("balanced")&&(a.append('<span class="option-message balanced-message"> &nbsp; &nbsp;Currently hidden by Balance mode (Customize here)</span>'),a.addClass("balanced"))}}}})},setOption:function(e){var t=e.attr("data-related-widget"),i=e.attr("data-option-value"),n=_.findWhere(this.customizeItems,{widget:t});if(!n)return null;if(!n.plusOnly||g.conditionalFeatures.featureEnabled("plus")){this.$el.find("."+t).removeClass("active"),e.addClass("active");var o={};return n.boolean?o[n.field]=JSON.parse(i):o[n.field]=i,this.model.save(o),n}var s={targetRegion:"settings",sourceEvent:t,buttonText:"Learn more",title:"Custom Themes",description:"Make Momentum your own"};g.commandManager.execute("upsell.message",s)},toggleOption:function(e){var t=u(e.currentTarget),i=u(e.currentTarget).attr("data-option-value"),n=this.setOption(t);if(n){var o=_.findWhere(n.options,{value:i});if(o&&o.view&&o.view.handleClick){if(0<u(e.target).closest(".sub-view").length&&o.view.ignoreClickEvent&&o.view.ignoreClickEvent(e.target))return;if(o.view.handleClick(e,!0),o.view.scrollIntoViewElement){var s=o.view.scrollIntoViewElement();s&&this.scrollIntoView(s)}}}g.trigger("globalEvent:settingsclick",e)},scrollIntoView:function(e){var t=u(e),i=t.closest(".settings-view-container"),n=t.offset().top,o=i.offset().top;n-o-12<0&&i.animate({scrollTop:i[0].scrollTop+n-o-12})},configWidget:function(e){e.stopPropagation();var t=u(e.currentTarget).closest(".slide-toggle").attr("data-related-widget");if(t){var i=_.findWhere(this.customizeItems,{widget:t});g.commandManager.execute(i.configCommand,null,i.configOptions)}},toggleSlider:function(e){if(!this.eatClicks){this.eatClicks=!0;var t,i=this;setTimeout(function(){i.eatClicks=!1},250);var n=u(".cp-color-picker");if(!(u(e.target).attr("data-option-value")||0<n.length&&u.contains(n[0],e.target)||u(e.currentTarget).hasClass("balanced"))){var o=u(e.currentTarget).attr("data-related-widget");if("bookmarksVisible"!=o){if(o){var s,a=_.findWhere(this.customizeItems,{widget:o}),l=this.model.get(a.field);if(a.options){for(t=0;t<a.options.length;t++)if(a.options[t].value==l){t==a.options.length-1&&(t=-1),s=a.options[t+1].value;break}var c=u(e.currentTarget).find("."+a.widget+"[data-option-value='"+s+"']").first();this.setOption(c)}else{var r;if(s=!this.model.get(o),this.model.toggle(o),a.plusOnly&&!g.conditionalFeatures.featureEnabled("plus"))return a.plusOnly&&!g.conditionalFeatures.featureEnabled("plus")&&("Countdown"==a.name?r={targetRegion:"settings",sourceEvent:o,buttonText:"Learn more",title:"Countdown",description:"Track your upcoming milestones"}:"Notes"==a.name?r={targetRegion:"settings",sourceEvent:o,buttonText:"Learn more",title:"Notes",description:"Take longer form notes"}:"World Clocks"===a.name&&(r={targetRegion:"settings",sourceEvent:o,buttonText:"Learn more",title:"World Clocks",description:"Keep tabs on time anywhere on earth"})),void g.commandManager.execute("upsell.message",r);var d={};d[o]=s,this.model.save(d)}}g.trigger("globalEvent:settingsclick",e)}else this.enableBookmarks(e)}}},loginClicked:function(e){e.preventDefault(),e.stopPropagation(),g.sendEvent("Settings","Login","Clicked"),g.commandManager.execute("settings.hide"),g.commandManager.execute("account.login")},logoutClicked:function(e){e.preventDefault(),e.stopPropagation(),u(".action-logout").addClass("action-logout-disabled").text("Logging out..."),g.sendEvent("Settings","Logout","Clicked"),g.commandManager.execute("logout")},accountClicked:function(e){e.preventDefault(),e.stopPropagation(),u(e.currentTarget).html("Launching..."),u.ajax({type:"POST",beforeSend:setMomentumAuthHeader,data:JSON.stringify({medium:"account"}),url:g.globals.urlRootApi+"login/onetime"}).done(function(e){e&&e.otp&&e.email&&(window.location.href="http://localdev:8995/onetime?email="+encodeURIComponent(e.email)+"&otp="+encodeURIComponent(e.otp))}).fail(function(e,t){}).always(function(){})},panelClosing:function(){_.each(this.customizeItems,function(e){_.each(e.options,function(e){e.view_cmd&&(!e.view||!e.view.close||e.view.close())})})},switchToBalanceSettings:function(e){e&&(e.stopPropagation(),e.preventDefault()),g.commandManager.execute("settings.display",null,{section:"balance",showAdvanced:!0})},enableBookmarks:function(e){e&&(e.stopPropagation(),e.preventDefault()),g.commandManager.executeAsync("settings.enableBookmarks",{callback:function(){u(e.currentTarget).toggleClass("on",g.models.customization.get("bookmarksVisible"))}})}}),t.commands.SettingsPanelGeneral=g.models.Command.extend({defaults:{id:"settings.panels.general"},execute:function(){return t.styleLoaded||(t.styleLoaded=!0,t.styles.style()),new t.views.General}}),t};m.addinManager&&m.addinManager.registerAddinFn("b2b798a2-c7b4-432e-bb4c-432e1c36985e",fn_addin);