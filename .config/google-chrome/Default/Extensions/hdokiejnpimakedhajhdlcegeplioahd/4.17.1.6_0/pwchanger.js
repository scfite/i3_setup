function PWCHANGER(){var n=2,t="",i=new Array,o="",a="",r="",s="",u="",c="",p=0,d=0,f="",y="",h=new Array,_=100100,g=10,k="",w=[];function m(){return"undefined"!=typeof $?$.ajax:LPPlatform.doAjax}function v(e,n,i,o,a,r,s){O(function(){P(function(){u()},r)},r);var u=function(){var u=void 0!==n&&null!=n&&""!=n?{wxusername:e,wxhash:n}:{};void 0!==s&&null!=s&&""!=s&&(u.vendor=s);var c=t+"getaccts.php?changepw=1&changepw2=1&includersaprivatekeyenc=1&changeun="+(e!=i?encodeURIComponent(i):"")+"&resetrsakeys="+(o?"1":"0")+"&includeendmarker=1";"undefined"!=typeof g_recovery_uid&&(c+="&recovery_uid="+encodeURIComponent(g_recovery_uid)),m()({url:c,type:"POST",data:u,timeout:3e5,success:"function"==typeof a?a:null,error:"function"==typeof r?r:null})}}function b(e){0!==w.length?T(w,e,function(){"function"==typeof e&&e()}):"function"==typeof e&&e()}function T(e,n,i){var o=JSON.stringify({oneTimePasswords:e}),a=f||token;m()({url:t+"lmiapi/one-time-password",type:"POST",contentType:"application/json",headers:{"X-CSRF-TOKEN":a},data:o,dataType:"json",success:n,error:function(){"function"==typeof i&&i("POST new one time passwords failed")}})}function E(e){k?A(k,e,function(){"function"==typeof e&&e()}):"function"==typeof e&&e()}function A(e,n,i){var o=JSON.stringify({userData:e}),a=f||token;m()({url:t+"lmiapi/authenticator/backup",type:"POST",contentType:"application/json",headers:{"X-CSRF-TOKEN":a},data:o,dataType:"json",success:n,error:function(){"function"==typeof i&&i("POST new LP cloud backup failed")}})}function S(e){var n=h.callback;"function"==typeof n&&n(2,!1,!1,null)}function x(){try{if(2==n){i=h.reencrypt.split("\n"),"number"==typeof g_target_key_iterations&&(_=g_target_key_iterations,"undefined"!=typeof g_key_iterations&&g_key_iterations!=g_target_key_iterations&&(h.iterationschange="1")),u=h.newkey||make_lp_key_iterations(fix_username(h.newemail),h.newpassword,_),o+=i[0]+"\n";var e=i[1];if(""!=e){var y=rsa_extract_privatekey(e,h.oldkey);""==y&&""!=h.oldkey1&&(y=rsa_extract_privatekey(e,h.oldkey1)),""==y?a="":(a=rsa_encrypt_privatekey(y,u),y=null),r=SHA256(AES.bin2hex(u).toUpperCase()),s=SHA256(a)}}var v,b;if(void 0===i.length)return void h.callback(2,!1,!1,"F2 : internal error");for(var E=n+3;n<i.length&&n<E;++n){var O=i[n].replace(/\r\n|\r|\n/g,"").split("\t");if(l=O[0],"endmarker"!=l){var P=void 0!==O.length&&O.length>=2&&"0"==O[1];if(void 0!==l.length&&l.length){var C=null;try{v=dec(l,h.oldkey),b=enc(v,u)}catch(e){C=e}if(!AES.ok(b)||null==v||void 0===v.length||0==v.length||void 0===b.length||0==b.length||null!=C){var K,N=null;try{K=enc(" ",u)}catch(e){b="EXCEPTIONB",N=e}if(!P){if(null!=N){var R=void 0===u.length?"undefined":u.length;c+="encrypting <space> using m_newkey (m_newkey.length="+R+") resulted in EXCEPTION_B!\n"}c+="enc: "+l+" decrypted:  reencrypted to: "+b+(null==C?"":" : EXCEPTION_A!")+"\n",p++}b=K||""}P||d++,o+=l+":"+b+"\n","function"==typeof h.status&&h.status(1,(n-1)/(i.length-2))}}else h.foundendmarker=!0}if(n<i.length)return void setTimeout(function(){x()},0);if(!h.foundendmarker)return void("function"==typeof h.callback&&h.callback(2,!1,!1,"D : Data download not complete"));if(void 0!==g&&g||(g=10),""!=c&&p>=d/100*g){var I={errors:c,username:h.oldemail};return m()({url:t+"debug.php",data:I,type:"POST",timeout:6e5,success:function(e){},error:function(e,n){}}),void("function"==typeof h.callback&&h.callback(3,null,null,"E : "+c))}X=h.oldkey,F=u,G=function(){var e,n,i,o,a;h.iterationschange?(e=h.oldkey,n=u,i=j,o=S,a=f||token,m()({url:t+"lmiapi/one-time-password",type:"GET",contentType:"application/json",dataType:"json",headers:{"X-CSRF-TOKEN":a},success:function(t){if("object"==typeof t.oneTimePasswords)if(w=[],0!==t.oneTimePasswords.length){var a=[];try{for(var r=fix_username(h.newemail),s=0;s<t.oneTimePasswords.length;s++){var u=t.oneTimePasswords[s],c={},l=dec(u.encryptedOneTimePassword,e),p=AES.hex2bin(l),d=make_lp_hash(r,p),f=make_lp_key(r,p);u.hash=d,u.randomEncryptedKey=enc(AES.bin2hex(e),f),c.encryptedOneTimePassword=enc(l,n),c.randomEncryptedKey=enc(AES.bin2hex(n),f),c.hash=d,a.push(c),w.push(u)}}catch(e){return void("function"==typeof o&&o("OTP Encryption failed"))}T(a,i,o)}else"function"==typeof i&&i();else"function"==typeof o&&o("Invalid one time password response")},error:function(e){"function"==typeof o&&o("GET one time passwords failed")}})):j()},D=S,H=f||token,m()({url:t+"lmiapi/authenticator/backup",type:"GET",contentType:"application/json",dataType:"json",headers:{"X-CSRF-TOKEN":H},success:function(e){var n;try{k=e.userData;var t=dec(e.userData,X);n=enc(t,F)}catch(e){return void("function"==typeof D&&D("Encryption failed"))}A(n,G,D)},error:function(e){e.status&&404==e.status?"function"==typeof G&&G():"function"==typeof D&&D("GET new LP cloud backup failed")}})}catch(e){h.callback(2,!1,!1,"F : "+e.message)}var X,F,G,D,H}this.hashMigration=function(e,n,i,o,a,r,s,u,c){if(t=r,f=s,_=u,g=0,"function"!=typeof c&&(c=function(){}),e!==o){var l=function(e,n,t,i){0===e?c(!0):c(!1,i)};v(i,n,i,!1,function(t){if("string"==typeof t)if("usernametaken"!=t){var r={oldkey:e,oldkey1:"",oldpwhash:n,oldemail:i,newemail:i,newkey:o,newpwhash:a,callback:l,reencrypt:t,status:status,foundendmarker:!1,iterationschange:"1",hashmigration:"1"};h=r,setTimeout(function(){x()},0)}else c(!1,"Username taken or deleted during hash migration");else c(!1,"Invalid response")},function(){c(!1,"Error retrieving accounts data during hash migration")})}else c(!1,"Hash migration already happened? Maybe stale extension data")},this.changepw=function(n,i,o,a,r,s,u,c,l,p,d,_,k,w,m){var b=void 0!==k?k:"";void 0!==w&&w&&(g=w),void 0!==d&&null!=d||(d=""),"function"!=typeof u&&(u=function(){}),f=d,y=_,t=c,"function"==typeof l&&l(0,0);v(o,i,a,s,function(e){if("string"==typeof e)if("usernametaken"!=e){"function"==typeof l&&l(0,1);var t={oldkey:n,oldkey1:b,oldpwhash:i,oldemail:o,newemail:a,newpassword:r,callback:u,reencrypt:e,status:l,foundendmarker:!1};m&&(t.ks="true"),h=t,setTimeout(function(){x()},0)}else u(1,!1,!1,"B : Username Taken");else u(4,!1,!1,"A : Invalid Response")},function(n){u(2,!1,!1,"C : "+textstatus+" suberror="+e)},p)};var O=function(e,n){Array.isArray(window.g_su_pubkeys)&&Array.isArray(window.g_su_uids)?e():m()({url:t+"lmiapi/users/me/publicsharingkeys",type:"GET",contentType:"application/json",dataType:"json",headers:{"X-CSRF-TOKEN":f},success:function(n){window.g_su_pubkeys=n.map(function(e){return e.publicSharingKey}),window.g_su_uids=n.map(function(e){return e.userId}),e&&e()},error:function(e){S(),n&&n()}})},P=function(e,n){Array.isArray(window.g_lu_pubkeys)&&Array.isArray(window.g_lu_uids)?e():(window.g_lu_pubkeys=[],window.g_lu_uids=[],m()({url:t+"lmiapi/emergency-access/sharees",type:"GET",contentType:"application/json",dataType:"json",headers:{"X-CSRF-TOKEN":f},success:function(n){n.forEach(function(e){window.g_lu_pubkeys.push(e.publicSharingKey),window.g_lu_uids.push(e.userId)}),e&&e()},error:function(t){404!==t.status?(S(),n&&n()):e()}}))};function j(){var e=h.newpwhash||make_lp_hash_iterations(u,h.newpassword,_),l={reencrypt:o,newprivatekeyenc:a,newuserkeyhexhash:r,newprivatekeyenchexhash:s,newpasswordhash:e,pwupdate:"1",email:h.newemail,token:f,encrypted_username:encecb(h.newemail,u),origusername:h.oldemail,key_iterations:_};if(h.iterationschange&&(l.iterationschange=h.iterationschange),h.hashmigration&&(l.hashmigration=h.hashmigration,l.ks=!0),"undefined"!=typeof g_is_recovery&&g_is_recovery&&(l.is_recovery="1"),void 0!==h.oldpwhash&&null!=h.oldpwhash&&""!=h.oldpwhash&&(l.wxusername=h.oldemail,l.wxhash=h.oldpwhash),void 0!==h.ks&&h.ks&&(l.ks="true"),void 0!==y&&null!=y&&(l.password_hint=y),"undefined"!=typeof g_su_pubkeys&&null!=g_su_pubkeys&&g_su_pubkeys.length){for(var g=!1,k=0,w=0;w<g_su_pubkeys.length;w++)if(""!=g_su_pubkeys[w]){var v=new RSAKey;parse_public_key(v,g_su_pubkeys[w])&&(l["sukey"+k]=v.encrypt(AES.bin2hex(u)),l["suuid"+k]=g_su_uids[w],g=!0,k++)}if(l.sukeycnt=k,0==g&&"function"==typeof h.callback)return void h.callback(2,!1,!1,"G : Please tell your administrator that all users marked as Administrators must log into a browser extension once in order to properly setup account recovery.")}if("undefined"!=typeof g_lu_pubkeys&&null!=g_lu_pubkeys){k=0;g_lu_pubkeys.forEach(function(e,n){if(e){var t=new RSAKey;parse_public_key(t,e)&&(l["lukey"+k]=t.encrypt(AES.bin2hex(u)),l["luuid"+k]=g_lu_uids[n],k++)}}),l.lukeycnt=k}"undefined"!=typeof g_recovery_uid&&(l.recovery_uid=g_recovery_uid),"undefined"!=typeof g_changeiterations&&1==g_changeiterations&&(l.iterationschange="1");var T=h.callback,A=u,S=h.newemail,x=h.status;h=new Array,i=new Array,o="",n=2,u="",c="",p=0,d=0,"function"==typeof x&&x(2,0),m()({url:t+"settings.php",data:l,type:"POST",timeout:6e5,success:function(e,n){"function"==typeof x&&x(2,1),-1!=e.indexOf("pwchangeok")?"function"==typeof T&&T(0,A,S):e.indexOf("reusepass")>=0?E(function(){b(function(){T(2,!1,!1,"H : "+e.split("\n")[1])})}):0==e.indexOf("error\n")?E(function(){b(function(){T(2,!1,!1,e.split("\n")[1])})}):E(function(){b(function(){T(2,!1,!1,"I : An error occured")})})},error:function(e,n,t){E(function(){b(function(){"function"==typeof T&&T(2,!1,!1,"J : "+n+" suberror="+t)})})}})}}
//# sourceMappingURL=sourcemaps/pwchanger.js.map