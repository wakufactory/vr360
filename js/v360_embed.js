(function(){
const src = {"m":"let src,mode \nlet angh = 63 \nif(POX.param.param) {\n\tsrc = POX.param.param[0] ;\n\tmode = 0 \n\tif(POX.param.param[1]) mode = POX.param.param[1] ;\n\tif(mode==3 && POX.param.param[2]) angh = POX.param.param[2] ;\n}\n\n//settings\nPOX.setting={\n\tname:\"theta_view_vr4\",\n\tscale:1.0,\n\tgyro:true,\n\thighRefreshRate:true,\n\tfoveationLevel:0,\n\tcam:{\n\tcamMode:\"vr\",\n\tgPad:true,\n\tcamAngle:90,\n\tcamCX:0,\n\tcamCY:1.5,\n\tcamCZ:0,\n\tcamRX:0,\n\tcamRZ:0,\n\tcamRY:-90,\n\tcamFar:2000,\n\tcamNear:0.01}\n};\n// light params\nconst lvec = [\n\t\t[0,5,1],\n\t\t[0,-1,0]\n\t]\nconst lcol = [\n\t\t[1,1,1],\n\t\t[0.5,0.5,1]\n\t]\nconst lparam = [\n\t\t[1,0],\n\t\t[0.5,0]\n\t]\n//scenedatass\nPOX.loadImage(src).then(function(img) {\n\tconst can1 = document.createElement('canvas') ;\n\tconst can2 = document.createElement('canvas') ;\n\tlet cw = (POX.wwg.version==1)?4096:img.width/2 \n\tlet ch = (POX.wwg.version==1)?4096:img.height\n\tlet sw = img.width/2 \n\tif(mode==5) {\n\t\tcw = (POX.wwg.version==1)?4096:img.width\n\t\tsw = img.width \n\t}\n\tif(cw>4096) {\n\t\tch = ch * cw/4096 ;cw = 4096 ;\n\t}\n\tPOX.log(cw+\"*\"+ch)\n\tcan1.width = cw ;\n\tcan1.height = ch ;\n\tlet  ctx = can1.getContext(\"2d\") ;\n\tctx.drawImage(img,0,0,sw,img.height,0,0,cw,ch) ;\n\tcan2.width = cw \n\tcan2.height = ch \n\tctx = can2.getContext(\"2d\") \n\tctx.drawImage(img,sw,0,sw,img.height,0,0,cw,ch) ;\n\t\n\tconst sky = new WWModel();\n\tsky.primitive(\"sphere\",{div:40,wx:20,wy:20,\n\twz:20,ninv:true});\n\t\n\tconst scene={\n\t\tenv:{clear_color:[0.0,0.0,0.0,1.0],cull:true},\n\t\tvs_uni:{\n\t\t    col:[0.5,0.5,1.0,1.0]\n\t\t},\n\t\tfs_uni:{\n\t\t\tpamb:0.2,\n\t\t\tpdiff:0.8,\n\t\t\tpspec:0.,\n\t\t\tpref:0.0,\n\t\t\tdspec:60,\n\t\t\tambcolor:[0.,0.,0],\n\t\t\tlvec:lvec,\n\t\t\tlcol:lcol,\n\t\t\tlparam:lparam,\n\t\t\tcolmode:0,\n\t\t\tshmode:0,\n\t\t\tbcolor:[0,0,0,1],\n\t\t\tmode:mode,\n\t\t\tasp:img.width/img.height,\n\t\t\tangh:angh\n\t\t},\n\t\ttexture:[\n\t\t\t{canvas:can1,opt:{flevel:2,repeat:2}},\n\t\t\t{canvas:can2,opt:{flevel:2,repeat:2}}\n\t\t],\n\t\tmodel:[\n\t\t\t{geo:sky.objModel(),\n\t\t\tbm:new CanvasMatrix4().translate(0,2,0),\n\t\t\tfs_uni:{colmode:10,shmode:1,tex1:0,tex2:1,mode:mode}\n\t\t\t},\n\t\t\t{geo:new WWModel().primitive(\"plane\",\n\t\t\t{wx:40,wz:40}).objModel(),hide:mode!=5,\n\t\t\tbm:new Mat4().translate(0,0,0),\n\t\t\tfs_uni:{colmode:3,bcolor:[0.2,0.2,0.2,1]}\n\t\t\t},\n\t\t]\n\t}\n\tPOX.setScene(scene) ;\n})\nPOX.event = function(ev,d) {\n\tif(ev==\"vrchange\") {\n\t\tPOX.log(\"vr \"+d)\n\t\tif(d==1) {\n\t\t\tPOX.cam.camRX = 0 \n\t\t}\n\t}\n\tif(ev==\"gpad\") {\n//\t\tconsole.log(d.dpad)\n\t\tif(d.dpad[0]>0 && d.axes[0]!=0) {\n\t\t\tPOX.cam.camRY += 30*(d.axes[0]>0?1:-1)\n\t\t}\n\t\tif(d.dbtn[4]>0) POX.poxp.exitVR()\n\t}\n\treturn true \n}\n\n//sceneupdate\nPOX.update=function(render,cam,time){\n\tconst ret={};\n\n\treturn ret;\n}\t\n","vs":"attribute vec3 position;\nattribute vec3 norm;\nattribute vec2 uv ;\n\nuniform mat4 modelMatrix;\nuniform mat4 mvpMatrix;\nuniform mat4 invMatrix;\nuniform vec4 col ;\n\nvarying vec3 tpos ;\nvarying vec3 tnorm ;\nvarying vec4 tcolor ;\nvarying vec2 tuv;\n\nvoid main() {\n\tvec2 uv2 = uv ;\n\ttcolor = col ;\n\ttuv\t= vec2(uv.x,1.0-uv.y);\n\ttpos = (modelMatrix * vec4(position,1.0)).xyz ;\n\ttnorm = (invMatrix * vec4(norm,0.0)).xyz ;\n\tgl_Position = mvpMatrix * vec4(position, 1.0) ;\n}\n","fs":"precision highp float;\nconst int lnum = 2 ;\n\nuniform int colmode ;\t//0:basecolor 1:vertex color  2:texture 3:checker 4:sky\nuniform int shmode ;\t//0:normal shading 1:no shading\nuniform vec4 bcolor ;\nuniform vec3 eyevec ;\nuniform float pamb ;\nuniform float pdiff ;\nuniform float pspec ;\nuniform float pref ;\nuniform float dspec ;\nuniform vec3 ambcolor ;\nuniform vec3 lvec[2];\nuniform vec3 lcol[2];\nuniform vec2 lparam[2] ;\nuniform float time ;\n\nuniform int mode ;\nuniform sampler2D tex1;\nuniform sampler2D tex2;\nuniform int stereo ;\nuniform float asp ;\nuniform float angh ;\n\nvarying vec3 tpos ;\nvarying vec3 tnorm ;\nvarying vec4 tcolor ;\nvarying vec2 tuv;\n\nconst float PI = radians(180.) ;\nconst vec3 spcol = vec3(1.,1.,1.) ;\nconst float dd = 0.5 ;\nconst float gamma = 1.0 ;\nconst float checkdiv = 0.02 ;\n\nvec3 skycol(vec2 uv) {\n\tvec3 col ;\n\tconst vec3 skycol = vec3(0.4,0.4,1.0);\n\tconst vec3 horizoncol = vec3(0.8,0.8,0.8) ;\n\tconst vec3 fieldcol = vec3(0.4,1.0,0.4) ;\n\tif(uv.y<0.5) col = mix(skycol,horizoncol,pow(uv.y*2.,5.)) ;\n\telse col = mix(horizoncol,fieldcol,pow(uv.y-0.5,1.)*2.);\n\treturn col ;\n}\n\nvec3 shade(vec3 col,vec3 norm) {\n\tvec3 ev = eyevec - tpos ;\n\tint i ;\n\tfloat diff,spec ;\n\tvec3 fcolor = vec3(0.);\n\tvec3 rcolor = vec3(0.) ;\n\t\n\tfor(int i=0;i<lnum;i++) {\n\t\tfloat lp = lparam[i].x ;\n\t\tif(lp==0.) continue ;\n\t\tvec3 lv = lvec[i] ;\n\t\tif(lparam[i].y!=0.) {\n\t\t\tlv = lv - tpos ;\n\t\t\tlp = (1.- pow(clamp(length(lv)/lparam[i].y,0.,1.),2.))*lparam[i].x ;\n\t\t}\n\t\tlv = normalize(lv) ;\n\t\tdiff= clamp((dot(norm,lv)+dd)/(1.+dd),0.0,1.0);\n\t\tif(pspec>0.)\n\t\t\tspec= pow(clamp(dot(norm,normalize(lv+normalize(ev))),0.0,1.0),dspec);\n\t\tfcolor = fcolor + (col * diff * pdiff + spcol* spec * pspec)*lcol[i].rgb*lp;\n\t}\n\tif(pref>0.) {\n\t\tvec3 ref = normalize(reflect(tpos - eyevec, tnorm));\n\t\tvec2 tc = vec2(\n\t\t\t\t(sign(ref.x)*acos(ref.z/sqrt(ref.x*ref.x+ref.z*ref.z))/PI+1.0)/2.0,\n\t\t\t\tacos(ref.y)/PI\n\t\t\t) ;\n\t\trcolor = skycol(tc) ;\n\t}\n\tfcolor = fcolor + col * ambcolor * pamb + rcolor * pref ;\n\tfcolor = pow(fcolor,vec3(1./gamma)) ;\n\treturn fcolor ;\n}\n\nvec3 gb(sampler2D map,vec2 px, float b) {\n\tvec3 p = texture2D(map, px).xyz ;\n\treturn p ;\n}\nvec3 vrmap(int mode) {\n\tconst float PI = radians(180.0) ;\n\tconst float PI2 = PI+PI ;\n\tvec2 tc = tuv ;\n\tvec3 col ;\n\tif(mode==3) {\n\t\tfloat ah = 180./angh ;\n\t\tfloat aw = 360./(angh*asp) ;\n\t\tfloat px = tc.x*aw*2.0 ;\n\t\tfloat py = tc.y*ah+(0.5-ah/2.);\n\t\tif(py<0. || py>1. || px-aw+1.<0. || px-aw>1.) col = bcolor.rgb ;\n\t\telse col = (tc.x<0.5)?texture2D(tex1, vec2(px-aw+1.,py)).xyz:\n\t\t\ttexture2D(tex2, vec2(px-aw,py)).xyz ;\t\t\n\t} else if(mode==2) {\n\t\tcol = (tc.x<0.25||tc.x>0.75)?bcolor.rgb:\n\t\t((stereo==1)?texture2D(tex1, vec2(tc.x*2.0-0.5,tc.y)).xyz:\n\t\t\ttexture2D(tex2, vec2(tc.x*2.0-0.5,tc.y)).xyz) ;\n\t} else if(mode==1) {\n\t\tcol = (tc.x<0.5)?texture2D(tex1, vec2(tc.x*2.0,tc.y/2.+((stereo==2)?0.5:0.))).xyz:\n\t\t\ttexture2D(tex2, vec2((tc.x-0.5)*2.0,tc.y/2.+((stereo==2)?0.5:0.))).xyz ;\n\t} else if(mode==5) {\n\t\tif(tc.y > 0.5) col = ambcolor ;\n\t\telse {\n\t\t\tfloat r = tc.x * PI2 + PI;\n\t\t\tfloat l = tc.y  ;\n\t\t\tcol = texture2D(tex1,\n\t\t\t\tvec2( l*sin(r)+0.5 ,l*cos(r)+0.5)).xyz ;\n\t\t}\n\t} else {\n\t\tcol = (tc.x<0.5)?texture2D(tex1, vec2(tc.x*2.0,tc.y)).xyz:\n\t\t\ttexture2D(tex2, vec2((tc.x-0.5)*2.0,tc.y)).xyz ;\n\t}\t\n\treturn col ;\n}\nvoid main() {\n\tvec4 color = (colmode==1)?tcolor:(colmode==2)?texture2D(tex1,tuv):bcolor ;\n\tvec3 col = color.rgb ;\n\tif(colmode==3) {\n\t\tcol = col * \n\t\t(((mod(tuv.x ,checkdiv) < checkdiv/2.) ^^ (mod(tuv.y ,checkdiv) < checkdiv/2.))?1.:0.8) ;\n\t}\n\tif(colmode==4) {\n\t\tfloat sun = clamp(dot(normalize(lvec[0]),-normalize(reflect(normalize(tpos), tnorm))),0.,1.) ;\n\t\tcol = skycol(tuv) + pow(sun,80.) * lcol[0]*0.6 ;\n\t}\n\tif(colmode==10) {\n\t\tcol = vrmap(mode) ;\n\t}\n\tvec3 norm = normalize(tnorm) ;\n\n\tgl_FragColor = vec4((shmode!=1)?shade(col,norm):col,color.a);\n}\n"}

function $(e){return document.getElementById(e)}
document.addEventListener("DOMContentLoaded",()=> {
	document.querySelectorAll('div.poxe').forEach((o)=>{
		const dsrc = o.getAttribute("data-src")
		if(!dsrc) return 
		const sb = document.createElement("div")
		sb.innerHTML = "<div class=sbtn>▶︎</div>"
		o.appendChild(sb) ;
		sb.addEventListener("click", (ev)=>{
			ev.target.style.display = "none" ;	
			setpox(o,{src:src,param:[dsrc,o.getAttribute("data-mode")]})
			document.querySelectorAll('div.poxe').forEach((to)=>{
				if(to!=o && to.poxp) to.poxp.param.pause = true ;
			})
		})
	})
})
function setpox(base,param) {
	const p = `<div class=cc>
 <span class=oswitch><label><input type=checkbox class=pause><span class=sbtn></span></label></span>
 <div class=pui></div></div>
<div class=loading><img src="img/guruguru.gif"></div>
<div class=vrbtn></div>
<div class=footer><a href="https://github.com/wakufactory/vr360/" target="_blank">vr360</a></div>`
	const div = document.createElement("div")
	div.innerHTML = p 
	base.appendChild(div)
	const can = document.createElement("canvas") 
	base.appendChild(can)
	var poxp = new PoxPlayer(can,{ui:{
		autorot:base.querySelector(".autorot"),
		pause:base.querySelector(".pause"),
		isStereo:base.querySelector(".isStereo"),
		fps:base.querySelector(".fps")}}) ;
	base.poxp = poxp
	var ss ;
	if(param.param[1]==1 || param.param[1]==2) poxp.param.isStereo=true 

	poxp.load(param.src).then(function(src) {
		ss = src ;
		poxp.set(src,{param:param.param}).then(function(pox){
			if(pox.setting.copyright) $("footer").innerHTML += "&nbsp;&nbsp;"+pox.setting.copyright;
			poxp.setParam($('pui'))
		})
	}).catch(function(err) {
		base.querySelector(".loading").style.display = "none" ;
		alert(err) ;
	})
	poxp.renderStart = function() {
		base.querySelector(".thumb").style.display = "none" ;	
		base.querySelector(".loading").style.display = "none" ;	
	}
	poxp.setError( function(msg) {
		console.log(msg) ;
	})

	base.querySelector(".vrbtn").addEventListener("click", (ev)=>{
		const o = ev.target.closest("div.poxe")
		document.querySelectorAll('div.poxe').forEach((to)=>{
			if(to!=o && to.poxp) to.poxp.param.pause = true ;
		})
		o.poxp.param.pause = false 
		if(!poxp.enterVR()) {
			location.href="view.html?"+param.src
		}
	}) 
}
})()
