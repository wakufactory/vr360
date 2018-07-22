(function(){
const src = {"m":"let src = \"360/pano_2014-12-06.jpg\" ;\nlet mode = 3\nlet angh = 63 \nif(POX.param.param) {\n\tsrc = POX.param.param[0] ;\n\tmode = 0 \n\tif(POX.param.param[1]) mode = POX.param.param[1] ;\n\tif(mode==3 && POX.param.param[2]) angh = POX.param.param[2] ;\n}\n\n//settings\nPOX.setting={\n\tname:\"theta_view_vr171\",\n\tscale:1.0,\n\tgyro:true,\n\thighRefreshRate:true,\n\tfoveationLevel:0,\n\tcam:{gPad:true,\n\tcamAngle:90,\n\tcamRX:0,\n\tcamRZ:0,\n\tcamRY:-90,\n\tcamFar:200,\n\tcamNear:0.001}\n};\n\n//scenedatass\nPOX.loadImage(src).then(function(img) {\n\tconst can1 = document.createElement('canvas') ;\n\tconst can2 = document.createElement('canvas') ;\n\tlet cw = (POX.wwg.version==1)?4096:img.width/2 \n\tlet ch = (POX.wwg.version==1)?4096:img.height\n\tif(cw>4096) {\n\t\tch = ch * cw/4096 ;cw = 4096 ;\n\t}\n\tconsole.log(cw+\"*\"+ch)\n\tcan1.width = cw ;\n\tcan1.height = ch ;\n\tlet  ctx = can1.getContext(\"2d\") ;\n\tctx.drawImage(img,0,0,img.width/2,img.height,0,0,cw,ch) ;\n\tcan2.width = cw \n\tcan2.height = ch \n\tctx = can2.getContext(\"2d\") \n\tctx.drawImage(img,img.width/2,0,img.width/2,img.height,0,0,cw,ch) ;\n\t\n\tconst sky = new WWModel();\n\tsky.primitive(\"sphere\",{div:40,wx:20,wy:20,wz:20,ninv:true});\n\t\n\tconst scene={\n\t\tenv:{clear_color:[0.0,0.0,0.0,1.0],cull:true},\n\t\tvs_uni:{\n\t\t    col:[0.5,0.5,1.0,1.0]\n\t\t},\n\t\tfs_uni:{\n\t\t\tlvec:[-0.01,0.5,1],\n\t\t\tbcolor:[0.,0.,0.,1.0],\n\t\t\ttex1:0,\n\t\t\tmode:0,\n\t\t\tasp:img.width/img.height,\n\t\t\tangh:angh\n\t\t},\n\t\ttexture:[\n\t\t\t{canvas:can1,opt:{flevel:1,repeat:2}},\n\t\t\t{canvas:can2,opt:{flevel:1,repeat:2}}\n\t\t],\n\t\tmodel:[\n\t\t\t{geo:sky.objModel(),\n\t\t\tbm:new CanvasMatrix4().rotate(0,1,0,0).rotate(0,0,0,1),\n\t\t\tfs_uni:{tex1:0,tex2:1,mode:mode}\n\t\t\t},\n\t\t]\n\t}\n\tPOX.setScene(scene) ;\n})\nPOX.event = function(ev,d) {\n\tif(ev==\"vrchange\") {\n\t\tPOX.log(\"vr \"+d)\n\t\tif(d==1) {\n\t\t\tPOX.cam.camRX = 0 \n\t\t}\n\t}\n\tif(ev==\"gpad\") {\n\t\tif(Math.abs(d.axes[0])>Math.abs(d.axes[1]))\n\t\t\tPOX.cam.camRY += d.axes[0]/2\n\t\telse \n\t\t\tPOX.cam.camRX += d.axes[1]/2\t\t\n\t}\n\treturn true \n}\n\n//sceneupdate\nPOX.update=function(render,cam,time){\n\tconst ret={};\n\n\treturn ret;\n}\t\n","vs":"attribute vec3 position;\nattribute vec3 norm;\nattribute vec2 uv ;\n\nuniform mat4 modelMatrix;\nuniform mat4 mvpMatrix;\nuniform mat4 invMatrix;\nuniform vec4 col ;\n\nvarying vec3 tpos ;\nvarying vec3 tnorm ;\nvarying vec4 color ;\nvarying vec2 texCoord;\n\nvoid main() {\n\tvec2 uv2 = uv ;\n\tcolor = col ;\n\ttexCoord\t= vec2(1.0-uv.x,1.0-uv.y);\n\ttpos = (modelMatrix * vec4(position,1.0)).xyz ;\n\ttnorm = (invMatrix * vec4(norm,0.0)).xyz ;\n\tgl_Position = mvpMatrix * vec4(position, 1.0) ;\n}\n","fs":"precision highp float;\n\nuniform int mode ;\nuniform vec4 bcolor ;\nuniform vec3 eyevec ;\nuniform vec3 lvec ;\t\nuniform sampler2D tex1;\nuniform sampler2D tex2;\nuniform int stereo ;\nuniform float asp ;\nuniform float angh ;\n\nvarying vec3 tpos ;\nvarying vec3 tnorm ;\nvarying vec4 color ;\nvarying vec2 texCoord;\n\nvec3 gb(sampler2D map,vec2 px, float b) {\n\tvec3 p = texture2D(map, px).xyz ;\n\treturn p ;\n}\n\nvoid main() {\n\tconst float PI = radians(180.0) ;\n\tconst float PI2 = PI+PI ;\n\tvec3 norm = normalize(tnorm) ;\n\tvec2 tc = texCoord ;\n\tvec3 col ;\n\tif(mode==3) {\n\t\tfloat ah = 180./angh ;\n\t\tfloat aw = 360./(angh*asp) ;\n\t\tfloat px = tc.x*aw*2.0 ;\n\t\tfloat py = tc.y*ah+(0.5-ah/2.);\n\t\tif(py<0. || py>1. || px-aw+1.<0. || px-aw>1.) col = bcolor.rgb ;\n\t\telse col = (tc.x<0.5)?texture2D(tex1, vec2(px-aw+1.,py)).xyz:\n\t\t\ttexture2D(tex2, vec2(px-aw,py)).xyz ;\t\t\n\t} else if(mode==2) {\n\t\tcol = (tc.x<0.25||tc.x>0.75)?bcolor.rgb:\n\t\t((stereo==1)?texture2D(tex1, vec2(tc.x*2.0-0.5,tc.y)).xyz:\n\t\t\ttexture2D(tex2, vec2(tc.x*2.0-0.5,tc.y)).xyz) ;\n\t} else if(mode==1) {\n\t\tcol = (tc.x<0.5)?texture2D(tex1, vec2(tc.x*2.0,tc.y/2.+((stereo==2)?0.5:0.))).xyz:\n\t\t\ttexture2D(tex2, vec2((tc.x-0.5)*2.0,tc.y/2.+((stereo==2)?0.5:0.))).xyz ;\n\t} else {\n\t\tcol = (tc.x<0.5)?texture2D(tex1, vec2(tc.x*2.0,tc.y)).xyz:\n\t\t\ttexture2D(tex2, vec2((tc.x-0.5)*2.0,tc.y)).xyz ;\n\t}\n\tvec3 fcolor = col ;\n\tgl_FragColor = vec4(fcolor,color.w);\n}\n","version":"0.1"}
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
 <label><input type=checkbox class=autorot>Rotate</label>
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
