const  POXP = {} ;
function $(e){return document.getElementById(e)}
POXP.init= function(cb,src=null,query=null) {
	const poxp = new PoxPlayer('#screen1', 
		{capture:true,noWebGL2:false}) ;
	POXP.poxp = poxp 
	poxp.setError( POXP.msg) ;
	let p = location.search.substr(1).split("&")
	if(p[0].match(/.+\.json/)) {
		poxp.load(p[0]+"?"+ Math.random()).then((src)=>{
			if(cb) cb(src)
			p.shift()
			POXP.set(src,{query:p}).then(()=>{
				document.title = `PoExE:${POXP.setting.name}`
			})
		})
	} else if(typeof src =="string") {
		poxp.load(src+"?"+ Math.random()).then((src)=>{
			if(cb) cb(src)
			POXP.set(src,{query:p}).then(()=>{
				document.title = `PoExE:${POXP.setting.name}`
			})
		})	
	} else if(src!==null) {	
		POXP.set(src,{query:p}).then(()=>{
			document.title = `PoExE:${POXP.setting.name}`
			if(cb) cb(src)		
		})
	} else {
		var s = localStorage.getItem("poxe_save") ;
		var data ;
		if(s) data = JSON.parse(s)

//		console.log(data);
		poxp.load(data).then((src)=>{
			POXP.set(src).then(()=>{
				document.title = `PoExE:${POXP.setting.name}`
				if(cb) cb(src)
			})
		}).catch((err)=>{
			alert("cannot load source")
		})
	}

	$("vrbtn").addEventListener("click", (ev)=>{
	  if (
	    window.DeviceOrientationEvent &&
	    DeviceOrientationEvent.requestPermission &&
	    typeof DeviceOrientationEvent.requestPermission === 'function'
	  ) {
	    DeviceOrientationEvent.requestPermission();
	  }
		window.addEventListener("deviceorientation", function(ev) {
			var or = window.orientation ;
			var d = (or==90||or==-90) ;
			poxp.param.isStereo = d ;
			$("cc").style.opacity = d?0.:0.4 ;
			$("footer").style.display = d?"none":"block" ;
			$("vrbtn").style.display = d?"none":"block" ;
			$("padl").style.opacity = d?0.:0.4 ;
			$("padr").style.opacity = d?0.:0.4 ;
			window.scrollTo(0,1000)
		})
		poxp.enterVR()
	}) 
	$("screen1").addEventListener("mousedown", (ev)=>{
		poxp.keyElelment.focus()
	}) 
	let padl={},padr={} 
	function clearpad(cpad,left) {
		 cpad.buttons = [{pressed:false,touched:false},{pressed:false,touched:false},{pressed:false,touched:false},{pressed:false,touched:false},{pressed:false,touched:false},{pressed:false,touched:false}]
		 cpad.axes=[0,0]
		 cpad.hand = left?"left":"right"
	}	
	clearpad(padl,true)
	poxp.pox.gPad.set(padl)
	clearpad(padr,false)
	poxp.pox.gPad2.set(padr)

	function mover(pad,tpad,ev) {
		const id = ev.target.getAttribute("data-key")
		if(id==2) {
			const d = ev.target.getAttribute("data-dir")
			pad.axes[(d&2)?1:0] =  (d&1)?0.8:-0.8 			
		} 
		pad.buttons[id].touched = true 
		if(tpad) tpad.set(pad) 
		ev.preventDefault()		
	}
	function tstart(pad,tpad,ev){
		const id = ev.target.getAttribute("data-key")
		if(id==2) {
			const d = ev.target.getAttribute("data-dir")
			pad.axes[(d&2)?1:0] =  (d&1)?0.8:-0.8 			
		} 
		pad.buttons[id].touched = true 
		pad.buttons[id].pressed = true 
		if(tpad) tpad.set(pad) 
		ev.preventDefault()		
	}
	function mdown(pad,tpad,ev){
		const id = ev.target.getAttribute("data-key") 
		pad.buttons[id].pressed = true 
		if(tpad) tpad.set(pad)  
		ev.preventDefault()		
	}
	function mup(pad,tpad,ev) {
		const id = ev.target.getAttribute("data-key") 
		pad.buttons[id].pressed = false  
		if(tpad) tpad.set(pad) 
		ev.preventDefault()		
	}
	function tend(pad,tpad,left,ev){
		const id = ev.target.getAttribute("data-key") 
		pad.buttons[id].touched = false 
		pad.buttons[id].pressed = false 
		clearpad(pad,left)
		if(tpad) tpad.set(pad) 
		ev.preventDefault()		
	}
	function clear(pad,tpad,left,ev) {
		clearpad(pad,left)
		if(tpad) tpad.set(pad)  
		ev.preventDefault()		
	}

	document.querySelectorAll("#padl button").forEach((o)=>{
		o.addEventListener("mouseover", (ev)=>{	mover(padl,poxp.pox.leftPad,ev)})
		o.addEventListener("touchstart", (ev)=>{tstart(padl,poxp.pox.leftPad,ev)})
		o.addEventListener("mousedown", (ev)=>{mdown(padl,poxp.pox.leftPad,ev)})
		o.addEventListener("mouseup", (ev)=>{mup(padl,poxp.pox.leftPad,ev)})
		o.addEventListener("touchend", (ev)=>{tend(padl,poxp.pox.leftPad,true,ev)})
		o.addEventListener("mouseout", (ev)=>{clear(padl,poxp.pox.leftPad,true,ev)})
		o.addEventListener("touchcancel", (ev)=>{clear(padl,poxp.pox.leftPad,true,ev)})
	})

	document.querySelectorAll("#padr button").forEach((o)=>{
		o.addEventListener("mouseover", (ev)=>{	mover(padr,poxp.pox.rightPad,ev)})
		o.addEventListener("touchstart", (ev)=>{tstart(padr,poxp.pox.rightPad,ev)})
		o.addEventListener("mousedown", (ev)=>{mdown(padr,poxp.pox.rightPad,ev)})
		o.addEventListener("mouseup", (ev)=>{mup(padr,poxp.pox.rightPad,ev)})
		o.addEventListener("touchend", (ev)=>{tend(padr,poxp.pox.rightPad,false,ev)})
		o.addEventListener("mouseout", (ev)=>{clear(padr,poxp.pox.rightPad,false,ev)})
		o.addEventListener("touchcancel", (ev)=>{clear(padr,poxp.pox.rightPad,false,ev)})
	})	
}

POXP.set = function(src,q) {
	return new Promise((resolve,reject)=>{
	POXP.poxp.set(src,q,$('pui')).then((pox)=> {
		if(pox===null) {
			POXP.msg(POXP.poxp.emsg)
			reject()
			return 
		}
		POXP.msg("eval ok") ;
//		console.log(pox);
		POXP.setting = pox.setting ;
			
//		poxp.setParam($('pui'))
//		$('bc').style.display = (pox.setting.cam && pox.setting.cam.camMode=="walk")?"block":"none" 
		if(POXP.setting.copyright) $("footer").innerHTML = POXP.setting.copyright ;
		resolve(pox)
	}).catch((err)=>{
		console.log(err)
		console.log("catch")
		POXP.msg(POXP.poxp.emsg);
		reject()
	})
})
}
POXP.msg = (msg)=> {
	if(!$("msgc")) {
		console.log(msg)
		return
	}
	const e = document.createElement("div")
	if( typeof msg == "string")
		msg = msg.replace(/\(http.*?\)/g,"").replace(/at PoxPlayer\.\w+/g,"").replace(/at Object\.\w+/g,"").replace(/at Object\.POX\.\w+/g,"").replace(/at new Function \(.+?\)/g,"") ;
	e.innerHTML =  msg
	$("msgc").appendChild(e) ;
	$("msg").scrollTop = $("msgc").offsetHeight ;
}