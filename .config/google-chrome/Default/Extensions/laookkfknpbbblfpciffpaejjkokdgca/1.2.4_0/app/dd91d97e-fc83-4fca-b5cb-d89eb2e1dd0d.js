var fn_addin=function(r,e,t){var i=i||{};i.styles=i.styles||{},i.commands=i.commands||{},i.dependencies=t||i.dependencies||{},i.styles.style=function(){},i.views=i.views||{},i.collect=i.collect||{},i.models=i.models||{},i.templates=i.templates||{},i.styles=i.styles||{},i.styles.style=function(){var e=document.createElement("style");e.type="text/css",e.innerHTML=".multiclock{order:3}.multiclock .app{padding:0}",document.getElementsByTagName("head")[0].appendChild(e)},i.collect.MultiClocks=r.collect.SyncedCollection.extend({initialize:function(e){(e=e||{}).name="clocks",e.sorted=!0,e.transientProps=["random","selected","time","unit","difference"],e.model=i.models.MultiClock,r.collect.SyncedCollection.prototype.initialize.call(this,e)},findPinned:function(){return this.filter(function(e){return!e.get("deleted")&&!e.get("archived")&&e.get("pinned")})},activeItems:function(){var e=this.models.filter(function(e){return!e.get("deleted")}),t=e;try{t=e.sort(function(e,t){return e.get("currentOffset")-t.get("currentOffset")})}catch(e){}return t}}),i.models.MultiClock=Backbone.Model.extend({defaults:function(){return{name:"",deleted:!1,archived:!1,serverSetId:!1,pinned:!1,random:!1}},placeholder:"Clock",getNameOrPlaceholder:function(){return this.get("name")||this.placeholder},initialize:function(e){e=e||{},this.idAttribute=this.collection.idAttribute||"csid",Backbone.Model.prototype.initialize.call(this,e)},getViewData:function(){var e=this.calculateTime();return{id:this.get("id"),pinned:this.get("pinned"),nameOrPlaceholder:this.getNameOrPlaceholder(),placeholder:this.placeholder,timezone:this.get("timeZoneId"),time:e.number,unit:e.unit,tooltip:e.difference,metricType:"Clock",archived:this.get("archived"),selected:!1,random:!1}},calculateTime:function(){var e=r.models.customization.get("hour12clock"),t=parseInt(this.get("currentOffset")),i=this.offsetDate(t),n=i.getUTCMinutes(),l=i.getUTCHours(),o="",c=""+(12<l&&e?l-12:0==l?e?12:"00":e?l:twoDigit(l)),a=this.calculateTimeDifference(i);return e&&(o=12<=l?"p":"a"),{number:c+=":"+twoDigit(n),unit:o,difference:a}},calculateTimeDifference:function(e){var t=new Date,i=t.getDate()==e.getUTCDate()?"Today":t.getDate()+1==e.getUTCDate()?"Tomorrow":"Yesterday",n=t.getTime(),l=e.getTime()+e.getTimezoneOffset()*mConst("dateMsPerMin"),o=n<l?(l-n)/mConst("dateMsPerHour"):(n-l)/mConst("dateMsPerHour");return i+", "+(l<n?"-":"+")+(o%1!=0?Math.round(10*o)/10:Math.round(o))+" hrs"},offsetDate:function(e){return d=new Date,e&&d.setUTCSeconds(d.getUTCSeconds()+e),d},getDetailViewVariables:function(){return{timezone:this.timezone,placeholder:this.placeholder}},togglePinned:function(){this.save("pinned",!this.get("pinned"))},toggleArchive:function(){this.save("archived",!this.get("archived"))},delete:function(){this.save("deleted",!0)}}),i.models.MultiClockManager=Backbone.Model.extend({initialize:function(){i.collect.multiClocks=this.collection=new i.collect.MultiClocks,this.collection.fetch({reset:!0}),this.listenTo(r.models.customization,"change:hour12clock",this.onTimeChange),this.listenTo(r.models.date,"change:date",this.onTimeChange)},onTimeChange:function(){this.collection.models.forEach(function(e){var t=e.calculateTime(),i={time:t.number,unit:t.unit};e.set(i,{ignoreRender:!0})})}});var n=i.dependencies.base_metric;return i.models.multiClockManager=new i.models.MultiClockManager,i.styles.style(),i.views.multiClock=r.widgetManager.handover("multiclock",n.views.BaseMetric,{model:i.models.multiClock,region:"top-right",order:"append",metricType:"Clock",metricTitle:"Clocks",visibleSetting:"multiClockVisible",defaultShowRandomState:!1,metricDescription:"Keep track of time anywhere on Earth",manager:i.models.multiClockManager,detailViewAddin:"multi_clock_detail",updateInterval:"onWholeMinute"}),r.widgets.push(i.views.multiClock),i};m.addinManager&&m.addinManager.registerAddinFn("dd91d97e-fc83-4fca-b5cb-d89eb2e1dd0d",fn_addin);