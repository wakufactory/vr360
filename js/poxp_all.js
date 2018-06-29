//WWG Simple WebGL wrapper library
// Version 0.9 
// 2016-2017 wakufactory.jp 
// license: MIT 
// WWG
//   init(canvas)
//   init2(canvas)
//   loadAjax(src,opt)
//   loadImageAjax(src)
//   createRender()
// Render
//   setRender(scene)
//   draw(update,cls)
//   addModel(model)
//   updateModel(name,mode,buf)
//   addTex(texobj)
//   loadTex(tex)

function WWG() {
	this.version = "0.9.7" ;
	this.can = null ;
	this.gl = null ;
	this.vsize = {"float":1,"vec2":2,"vec3":3,"vec4":4,"mat2":4,"mat3":9,"mat4":16} ;
}
WWG.prototype.init = function(canvas,opt) {
	this.can = canvas ;
	var gl 
	if(!((gl = canvas.getContext("experimental-webgl",opt)) || (gl = canvas.getContext("webgl",opt)))) { return false } ;
	if(!window.Promise) return false ;
	this.gl = gl 
	this.ext_vao = gl.getExtension('OES_vertex_array_object');
	if(this.ext_vao) {
		this.vao_create = function(){return this.ext_vao.createVertexArrayOES()} ;
		this.vao_bind = function(o){this.ext_vao.bindVertexArrayOES(o)} ;
	}
	this.ext_inst = gl.getExtension('ANGLE_instanced_arrays');
	if(this.ext_inst) {
		this.inst_divisor = function(p,d){this.ext_inst.vertexAttribDivisorANGLE(p, d)}
		this.inst_draw = function(m,l,s,o,c){this.ext_inst.drawElementsInstancedANGLE(m,l, s, o, c);}
		this.inst_drawa = function(m,s,o,c) {this.ext_inst.drawArrayInstancedANGLE(m, s, o, c);}
	}
	this.ext_anis = gl.getExtension("EXT_texture_filter_anisotropic");
	this.ext_ftex = gl.getExtension('OES_texture_float');
	this.ext_mrt = gl.getExtension('WEBGL_draw_buffers');
	if(this.ext_mrt) {
		this.mrt_att = this.ext_mrt.COLOR_ATTACHMENT0_WEBGL ;
		this.mrt_draw = function(b,d){return this.ext_mrt.drawBuffersWEBGL(b,d)} ;
	}
	this.ext_i32 = gl.getExtension('OES_element_index_uint')
	this.dmodes = {"tri_strip":gl.TRIANGLE_STRIP,"tri":gl.TRIANGLES,"points":gl.POINTS,"lines":gl.LINES,"line_strip":gl.LINE_STRIP }
	this.version = 1 ;
	return true ;
}
WWG.prototype.init2 = function(canvas,opt) {
	this.can = canvas ;
	var gl 
	if(!((gl = canvas.getContext("experimental-webgl2",opt)) || (gl = canvas.getContext("webgl2",opt)))) { return false } ;
	if(!window.Promise) return false ;
	console.log("init for webGL2") ;
	this.gl = gl ;
	
	this.ext_vao = true ;
	this.vao_create = function(){ return this.gl.createVertexArray()} ;
	this.vao_bind = function(o){this.gl.bindVertexArray(o)} ;
	this.ext_inst = true ;
	this.inst_divisor = function(p,d){this.gl.vertexAttribDivisor(p, d)}
	this.inst_draw = function(m,l,s,o,c){this.gl.drawElementsInstanced(m,l, s, o, c);}
	this.inst_drawa = function(m,s,o,c) {this.gl.drawArrayInstanced(m, s, o, c);}
	this.ext_anis = gl.getExtension("EXT_texture_filter_anisotropic");
	this.ext_ftex = true ;
	this.ext_mrt = (gl.getParameter(gl.MAX_DRAW_BUFFERS)>1) ;
	if(this.ext_mrt) {
		this.mrt_att = gl.COLOR_ATTACHMENT0 ;
		this.mrt_draw =  function(b,d){return gl.drawBuffers(b,d)} ;
	}
	this.ext_i32 = true ;
	this.dmodes = {"tri_strip":gl.TRIANGLE_STRIP,"tri":gl.TRIANGLES,"points":gl.POINTS,"lines":gl.LINES,"line_strip":gl.LINE_STRIP }
	this.version = 2 ;
	return true ;
}
WWG.prototype.loadAjax = function(src,opt) {
	return new Promise(function(resolve,reject) {
		var req = new XMLHttpRequest();
		req.open("get",src,true) ;
		req.responseType = (opt && opt.type)?opt.type:"text" ;
		req.onload = function() {
			if(this.status==200) {
				resolve(this.response) ;
			} else {
				reject("Ajax error:"+this.statusText) ;					
			}
		}
		req.onerror = function() {
			reject("Ajax error:"+this.statusText)
		}
		req.send() ;
	})
}
WWG.prototype.loadImageAjax = function(src) {
	var self = this ;
	return new Promise(function(resolve,reject){
		self.loadAjax(src,{type:"blob"}).then(function(b){
			var timg = new Image ;
			timg.onload = function() {
				resolve(timg) ;
			}
			timg.src = URL.createObjectURL(b);
			b = null ;
		}).catch(function(err){
			resolve(null) ;
		})
	})
}

// Render unit
WWG.prototype.createRender = function() {
	return new this.Render(this) ;
}
WWG.prototype.Render = function(wwg) {
	this.wwg = wwg ;
	this.gl = wwg.gl ;
	this.env = {} ;
	this.obuf = [] ;
	this.modelCount = 0 ;
}
WWG.prototype.Render.prototype.setUnivec = function(uni,value) {
//	console.log("set "+uni.type+"("+uni.pos+") = "+value) ;
	let ar = [] ;
	if(uni.dim>0) for(let i=0;i<uni.dim;i++) ar = ar.concat(value[i])
	switch(uni.type) {
		case "mat2":
			this.gl.uniformMatrix2fv(uni.pos,false,this.f32Array(value)) ;
			break ;
		case "mat3":
			this.gl.uniformMatrix3fv(uni.pos,false,this.f32Array(value)) ;
			break ;
		case "mat4":
			this.gl.uniformMatrix4fv(uni.pos,false,this.f32Array(value)) ;
			break ;
		case "vec2":
			this.gl.uniform2fv(uni.pos, this.f32Array(value)) ;
			break ;
		case "vec2v":
			this.gl.uniform2fv(uni.pos, this.f32Array(ar)) ;
			break ;
		case "vec3":
			this.gl.uniform3fv(uni.pos, this.f32Array(value)) ;
			break ;
		case "vec3v":
			this.gl.uniform3fv(uni.pos, this.f32Array(ar))
			break ;
		case "vec4":
			this.gl.uniform4fv(uni.pos, this.f32Array(value)) ;
			break ;
		case "vec4v":
			this.gl.uniform4fv(uni.pos, this.f32Array(ar)) ;
			break ;
		case "int":
		case "bool":
			this.gl.uniform1i(uni.pos,value) ;
			break ;
		case "ivec2":
		case "bvec2":
			this.gl.uniform2iv(uni.pos, this.i16Array(value)) ;
			break ;
		case "ivec2v":
		case "bvec2v":
			this.gl.uniform2iv(uni.pos, this.i16Array(ar)) ;
			break ;
		case "ivec3":
		case "bvec3":
			this.gl.uniform3iv(uni.pos, this.i16Array(value)) ;
			break ;
		case "ivec3v":
		case "bvec3v":
			this.gl.uniform3iv(uni.pos, this.i16Array(ar)) ;
			break ;
		case "ivec4":
		case "bvec4":
			this.gl.uniform4iv(uni.pos, this.i16Array(value)) ;
			break ;
		case "ivec4v":
		case "bvec4v":
			this.gl.uniform4iv(uni.pos, this.i16Array(ar)) ;
			break ;
		case "intv":
		case "boolv":
			this.gl.uniform1iv(uni.pos,this.i16Array(value)) ;
			break ;
		case "float":
			this.gl.uniform1f(uni.pos,value) ;
			break ;
		case "floatv":
			this.gl.uniform1fv(uni.pos,this.f32Array(value)) ;
			break ;
		case "sampler2D":
			if(typeof value == 'string') {
				for(var i=0;i<this.data.texture.length;i++) {
					if(this.data.texture[i].name==value) break;
				}
				value = i ;
			}
			this.gl.activeTexture(this.gl.TEXTURE0+uni.texunit);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texobj[value]);
			if(this.data.texture && this.data.texture[value].video) {
				this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.data.texture[value].video);	
			}
			this.gl.uniform1i(uni.pos,uni.texunit) ;
			break ;
	}
}

WWG.prototype.Render.prototype.setShader = function(data) {
	var tu = 0 ;
	function parse_shader(src) {
		var l = src.split("\n") ;
		var uni = [] ;
		var att = [] ;

		for(i=0;i<l.length;i++) {
			var ln = l[i] ;
			if( ln.match(/^\s*uniform\s*([0-9a-z]+)\s*([0-9a-z_]+)(\[[^\]]+\])?/i)) {
				var u = {type:RegExp.$1,name:RegExp.$2} ;
				if(RegExp.$3!="") {
					u.type = u.type+"v" ;
					u.dim = parseInt(RegExp.$3.substr(1)) ;
				}
				if(u.type=="sampler2D") u.texunit = tu++ ;
				uni.push(u) ;
			}
			if( ln.match(/^\s*(?:attribute|in)\s*([0-9a-z]+)\s*([0-9a-z_]+)/i)) {
				att.push( {type:RegExp.$1,name:RegExp.$2}) ;
			}
		}
		return {uni:uni,att:att} ;
	}

	var gl = this.gl ;
	var self = this ;
	return new Promise(function(resolve,reject) {
		if(!data.vshader) { reject("no vshader") ;return false;}
		if(!data.fshader) { reject("no fshader") ;return false;}
		var vss ;
		var fss ;
		var pr = [] ;
		if(data.vshader.text ) vss = data.vshader.text ;
		else if(data.vshader.src) {
			pr.push( self.wwg.loadAjax(data.vshader.src).then(function(result) {
				vss = result ;
				resolve() ;
			}).catch(function(err) {
				reject(err) ;
			}))
		}
		if(data.fshader.text ) fss = data.fshader.text ;
		else if(data.fshader.src) {
			pr.push( self.wwg.loadAjax(data.fshader.src).then(function(result) {
				fss = result ;
				resolve() ;
			}).catch(function(err) {
				reject(err) ;
			}))
		}
		Promise.all(pr).then(function(res) {
//			console.log(vss) ;
//			console.log(fss) ;
			var ret = {} ;
			var vshader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vshader, vss);
			gl.compileShader(vshader);
			if(!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
				reject("vs error:"+gl.getShaderInfoLog(vshader)); return false;
			}
			ret.vshader = vshader ;
		
			var fshader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fshader, fss);
			gl.compileShader(fshader);
			if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
				reject("fs error:"+gl.getShaderInfoLog(fshader)); return false;
			}
			ret.fshader = fshader ;
			
			var program = gl.createProgram();
			gl.attachShader(program, vshader);
			gl.attachShader(program, fshader);
			gl.linkProgram(program);
			if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				reject("link error:"+gl.getProgramInfoLog(program)); return false;
			}
			ret.program = program ;
			gl.useProgram(program);
		
			var vr = parse_shader(vss) ;	
//			console.log(vr) ;
			ret.vs_att = {} ;	
			for(var i in vr.att) {
				vr.att[i].pos = gl.getAttribLocation(program,vr.att[i].name) ;
				ret.vs_att[vr.att[i].name] = vr.att[i] ;
			}
			ret.vs_uni = {} ;
			for(var i in vr.uni) {
				vr.uni[i].pos = gl.getUniformLocation(program,vr.uni[i].name) ;
				ret.vs_uni[vr.uni[i].name] = vr.uni[i] ;
			}
		
			var fr = parse_shader(fss) ;	
//			console.log(fr);	
			ret.fs_uni = {} ;
			for(var i in fr.uni) {
				fr.uni[i].pos = gl.getUniformLocation(program,fr.uni[i].name) ;
				ret.fs_uni[fr.uni[i].name] = fr.uni[i] ;
			}
			resolve(ret) ;
		}).catch(function(err){
			reject(err) ;
		}) ;
	})
}
WWG.prototype.Render.prototype.setUniValues = function(data) {
	if(data.vs_uni) {
		for(var i in data.vs_uni) {
			if(this.vs_uni[i]) {
				this.setUnivec(this.vs_uni[i], data.vs_uni[i]) ;
			}  ;
		}
	}
	if(data.fs_uni) {
		for(var i in data.fs_uni) {
			if(this.fs_uni[i]) {
				this.setUnivec(this.fs_uni[i], data.fs_uni[i]) ;
			}  ;
		}
	}
	return true ;
}
WWG.prototype.Render.prototype.genTex = function(img,option) {
	if(!option) option={flevel:0} ;
	var gl = this.gl ;
	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	if(!option.nomipmap) gl.generateMipmap(gl.TEXTURE_2D);
	//NEAREST LINEAR NEAREST_MIPMAP_NEAREST NEAREST_MIPMAP_LINEAR LINEAR_MIPMAP_NEAREST LINEAR_MIPMAP_LINEAR
	switch(option.flevel) {
	case 0:
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		break;
	case 1:
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		break;
	case 2:
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		break;
	}
	if(option.repeat==2) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	} else if(option.repeat==1) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);				
	} else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	}
	if(this.wwg.ext_anis && option.anisotropy) {
		gl.texParameteri(gl.TEXTURE_2D, this.wwg.ext_anis.TEXTURE_MAX_ANISOTROPY_EXT, option.anisotropy);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);	
	return tex ;	
}
WWG.prototype.Render.prototype.loadTex = function(tex) {
//	console.log( tex);
	var self = this ;
	var gl = this.gl ;

	return new Promise(function(resolve,reject) {
		if(tex.src) {
			if(tex.opt && tex.opt.cors) {
				self.wwg.loadImageAjax(tex.src).then(function(img) {
					resolve( self.genTex(img,tex.opt)) ;
				});
			} else {
				var img = new Image() ;
				img.onload = function() {
					resolve( self.genTex(img,tex.opt) ) ;
				}
				img.onerror = function() {
					reject("cannot load image") ;
				}
				img.src = tex.src ;
			}
		} else if(tex.img instanceof Image) {
			resolve( self.genTex(tex.img,tex.opt) ) 
		} else if(tex.video ) {
			resolve( self.genTex(tex.video,{nomipmap:true,flevel:0,repeat:2}) ) 
		} else if(tex.buffer) {
			if(tex.mrt!=undefined) {
				resolve( tex.buffer.fb.t[tex.mrt])
			}
			else resolve( tex.buffer.fb.t) ;
		} else if(tex.texture) {
			resolve( tex.texture) ;
		} else if(tex.canvas) {
			resolve( self.genTex(tex.canvas,tex.opt)) ;
		} else {
			reject("no image")
		}
	})
}
WWG.prototype.Render.prototype.addTex = function(texobj) {
	this.texobj.push(texobj) ;
	return this.texobj.length-1 ;
}
WWG.prototype.Render.prototype.frameBuffer = function(os) {
	var gl = this.gl ;
	console.log("create framebuffer "+os.width+"x"+os.height) ;
	var mrt = os.mrt ;
	var ttype = gl.UNSIGNED_BYTE ;
	var tfilter = gl.LINEAR ;
	if(this.wwg.ext_ftex && os.float ) {
		ttype = gl.FLOAT ;
		tfilter = gl.NEAREST ;
		console.log("use float tex") ;
	}
	var fblist = [] ;
	var frameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	//depth
	var renderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, os.width, os.height);	
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
	//texture
	if(mrt) {
		var fTexture = [] ;
		for(var i=0;i<mrt;i++) {
			fTexture[i] = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, fTexture[i]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, os.width, os.height, 0, gl.RGBA, ttype, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, tfilter);
		    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, tfilter);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.wwg.mrt_att + i, gl.TEXTURE_2D, fTexture[i], 0);	
			fblist.push(this.wwg.mrt_att + i)		
		}
	} else {
		var fTexture = gl.createTexture()
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, os.width, os.height, 0, gl.RGBA, ttype, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, tfilter);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, tfilter);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);	

	var ret = {width:os.width,height:os.height,f:frameBuffer,d:renderBuffer,t:fTexture}
	if(mrt) ret.fblist = fblist ;
	return ret ;
}
WWG.prototype.Render.prototype.setRender =function(data) {
	var gl = this.gl ;
	this.env = data.env ;
	this.data = data ;
	var self = this ;

	return new Promise(function(resolve,reject) {
		if(!gl) { reject("no init") ;return ;}
		var pr = [] ;
		self.setShader({fshader:data.fshader,vshader:data.vshader}).then(function(ret) {
			//set program
			self.vshader = ret.vshader ;
			self.fshader = ret.fshader ;
			self.program = ret.program ;
			self.vs_uni = ret.vs_uni ;
			self.vs_att = ret.vs_att ;
			self.fs_uni = ret.fs_uni ;
			
			// load textures
			if(data.texture) {
				for(var i=0;i<data.texture.length;i++) {
					pr.push(self.loadTex( data.texture[i])) ;
				}
			}

			Promise.all(pr).then(function(result) {
//				console.log(result) ;
				self.texobj = result ;
				// set initial values
				if(!self.setUniValues(data)) {
					reject("no uniform name") ;
					return ;
				}
				
				if(self.env.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
				if(self.env.face_cw) gl.frontFace(gl.CW); else gl.frontFace(gl.CCW);
				if(!self.env.nodepth) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);		
		
				//set model 
				for(var i =0;i<data.model.length;i++) {
					self.obuf[i] = self.setObj( data.model[i],true) ;
				}
				self.modelCount = data.model.length ;
//				console.log(self.obuf);
				
				if(self.env.offscreen) {// renderbuffer 
					if(self.env.offscreen.mrt) { //MRT
						if(!self.wwg.ext_mrt) reject("MRT not support") ;
					}
					self.fb = self.frameBuffer(self.env.offscreen) ;	
				}
				resolve(self) ;
				
			}).catch(function(err) {
				reject(err) ;
			})
		}).catch(function(err) {reject(err);})
	});
}

WWG.prototype.Render.prototype.clear = function() {
	var cc = this.env.clear_color ;
	this.gl.clearColor(cc[0],cc[1],cc[2],cc[3]);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
}

WWG.prototype.Render.prototype.f32Array = function(ar) {
	if(ar instanceof Float32Array) return ar ;
	else return new Float32Array(ar) ;
}
WWG.prototype.Render.prototype.i16Array = function(ar) {
	if(ar instanceof Int16Array) return ar ;
	else return new Int16Array(ar) ;
}
WWG.prototype.Render.prototype.i32Array = function(ar) {
	if(ar instanceof Uint32Array) return ar ;
	else return new Uint32Array(ar) ;
}
WWG.prototype.Render.prototype.setObj = function(obj,flag) {
	var gl = this.gl
	var geo = obj.geo ;
	var inst = obj.inst ;
	ret = {} ;
	
	if(this.wwg.ext_vao) {
		var vao = this.wwg.vao_create() ;
		this.wwg.vao_bind(vao);
		ret.vao = vao ;
	}
	
	var vbo = gl.createBuffer() 
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo) ;

	var tl = 0 ;
	var ats = [] ;
	for(var i=0;i<geo.vtx_at.length;i++) {
		ats.push( this.vs_att[geo.vtx_at[i]] ) ;
		tl += this.wwg.vsize[this.vs_att[geo.vtx_at[i]].type] ;
	}
	tl = tl*4 ;

	ret.ats = ats ;
	ret.tl = tl ;
	var ofs = 0 ;
	for(var i in this.vs_att ) {
		gl.disableVertexAttribArray(this.vs_att[i].pos);
	}
	for(var i=0;i<ats.length;i++) {
		var s = this.wwg.vsize[ats[i].type] ;
		gl.enableVertexAttribArray(this.vs_att[ats[i].name].pos);
		gl.vertexAttribPointer(this.vs_att[ats[i].name].pos, s, gl.FLOAT, false, tl, ofs);
		ofs += s*4 ;	
	} 	
	ret.vbo = vbo ;

	if(geo.idx) {
		var ibo = gl.createBuffer() ;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo) ;
		ret.ibo = ibo ;
	}
	if(inst) {
		var ibuf = gl.createBuffer() 
		gl.bindBuffer(gl.ARRAY_BUFFER, ibuf) ;
		var tl = 0 ;
		var ats = [] ;
		for(var i=0;i<inst.attr.length;i++) {
			ats.push( this.vs_att[inst.attr[i]] ) ;
			tl += this.wwg.vsize[this.vs_att[inst.attr[i]].type] ;
		}
		tl = tl*4 ;
		ret.iats = ats ;
		ret.itl = tl ;
		var ofs = 0 ;
		for(var i=0;i<ats.length;i++) {
			var divisor = (inst.divisor)?inst.divisor[i]:1 ;
			var s = this.wwg.vsize[ats[i].type] ;
			var pos = this.vs_att[ats[i].name].pos
			gl.enableVertexAttribArray(pos);
			gl.vertexAttribPointer(pos, s, gl.FLOAT, false, tl, ofs);
			ofs += s*4 ;
			this.wwg.inst_divisor(pos, divisor)	
		} 
		ret.inst = ibuf 
	}
	
	if(this.wwg.ext_vao) this.wwg.vao_bind(null);

	if(this.wwg.ext_vao) this.wwg.vao_bind(vao);
	if(flag) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo) ;
		gl.bufferData(gl.ARRAY_BUFFER, 
			this.f32Array(geo.vtx), (geo.dynamic)?gl.DYNAMIC_DRAW:gl.STATIC_DRAW) ;
	}
	if(flag && geo.idx) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo) ;
		if(geo.vtx.length/(ret.tl/4) > 65536 && this.wwg.ext_i32) {
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
				this.i32Array(geo.idx),gl.STATIC_DRAW ) ;
			ret.i32 = true ;
		} else {
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
				this.i16Array(geo.idx),gl.STATIC_DRAW ) ;
			ret.i32 = false ;
		}
	}
	if(flag && inst) {
		gl.bindBuffer(gl.ARRAY_BUFFER, ibuf) ;
		gl.bufferData(gl.ARRAY_BUFFER, 
			this.f32Array(inst.data),(inst.dynamic)?gl.DYNAMIC_DRAW:gl.STATIC_DRAW ) ;
	}
	if(this.wwg.ext_vao) this.wwg.vao_bind(null);
		
	return ret ;
}
WWG.prototype.Render.prototype.getModelIdx = function(name) {
	var idx = -1 ;
	if(typeof name != 'string') idx = parseInt(name) ;
	else {
		for(var i=0;i<this.data.model.length;i++) {
			if(this.data.model[i].name==name) break ;
		}
		idx =i ;
	}	
	return idx ;	
}
// add model
WWG.prototype.Render.prototype.addModel = function(model) {
	this.data.model.push(model) ;
	this.obuf.push(this.setObj(model,true)) ;
	this.modelCount = this.data.model.length ;
}
// update attribute buffer 
WWG.prototype.Render.prototype.updateModel = function(name,mode,buf,subflag=true) {
	var idx = this.getModelIdx(name) ;
	var obuf = this.obuf[idx] ;
	switch(mode) {
		case "vbo":	
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obuf.vbo) ;
			break ;
		case "inst":
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obuf.inst) ;
			break ;
	}
	if(subflag) 
		this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.f32Array(buf))	
	else
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.f32Array(buf),this.gl.DYNAMIC_DRAW ) ;
}
WWG.prototype.Render.prototype.updateModelInstance = function(name,buf,count) {
	var idx = this.getModelIdx(name) ;
	var obuf = this.obuf[idx] ;
	this.data.model[idx].inst.count = count ;
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obuf.inst) ; 
//		this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.f32Array(buf))	
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.f32Array(buf),this.gl.DYNAMIC_DRAW ) ;
}
WWG.prototype.Render.prototype.getModelData =function(name) {
	var idx = this.getModelIdx(name) ;
	return this.data.model[idx] ;
}
// update texture 
WWG.prototype.Render.prototype.updateTex = function(idx,tex,opt) {
	this.gl.bindTexture(this.gl.TEXTURE_2D, this.texobj[idx]);
	if(!opt)
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, tex);
	else {
		if(opt.wx>0 && opt.wy>0)
			this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, opt.sx,opt.sy,opt.wx,opt.wy,this.gl.RGBA, this.gl.UNSIGNED_BYTE, tex);	
		else 	
			this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, opt.sx,opt.sy , this.gl.RGBA, this.gl.UNSIGNED_BYTE, tex);
	}
	if(this.data.texture[idx].opt && !this.data.texture[idx].opt.nomipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D);
}
//update uniform values
WWG.prototype.Render.prototype.pushUniValues = function(u) {
	if(u.vs_uni) {
		for(var i in u.vs_uni) {
			this.update_uni.vs_uni[i] = u.vs_uni[i] ;
		}
	}
	if(u.fs_uni) {
		for(var i in u.fs_uni) {
			this.update_uni.fs_uni[i] = u.fs_uni[i] ;
		}
	}
}
WWG.prototype.Render.prototype.updateUniValues = function(u) {
	if(!u) {
		this.update_uni = {vs_uni:{},fs_uni:{}} ;
		return ;
	}
//	console.log(this.update_uni);
	this.setUniValues(this.update_uni)
}

// draw call
WWG.prototype.Render.prototype.draw = function(update,cls) {
//	console.log("draw");

	var gl = this.gl ;
	gl.useProgram(this.program);

	if(this.env.offscreen) {// renderbuffer 
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.f);
		if(this.env.offscreen.mrt) this.wwg.mrt_draw(this.fb.fblist);
		gl.viewport(0,0,this.fb.width,this.fb.height) ;
	}
	if(!cls) this.clear() ;
	for(var b=0;b<this.obuf.length;b++) {
		var cmodel = this.data.model[b] ;
		if(cmodel.hide) continue ;
		var geo = cmodel.geo ;

		this.updateUniValues(null) ;
		this.pushUniValues(this.data) ;
		this.pushUniValues(cmodel);
		if(update) {
			// set modified values
			this.pushUniValues(update) ;
			this.pushUniValues(cmodel);
			if(update.model) {
				var model =update.model[b] ;
				if(model) this.pushUniValues(model) ;
			}
		}
		this.updateUniValues(1)

		var obuf = this.obuf[b] ;
		var ofs = 0 ;
		if(this.wwg.ext_vao)  this.wwg.vao_bind(obuf.vao);
		else {
			gl.bindBuffer(gl.ARRAY_BUFFER, obuf.vbo) ;
			var aofs = 0 ;
			for(var i in this.vs_att ) {
				gl.disableVertexAttribArray(this.vs_att[i].pos);
			}
			for(var i=0;i<obuf.ats.length;i++) {
				var s = this.wwg.vsize[obuf.ats[i].type] ;
				gl.enableVertexAttribArray(this.vs_att[obuf.ats[i].name].pos);
				gl.vertexAttribPointer(this.vs_att[obuf.ats[i].name].pos, s, gl.FLOAT, false, obuf.tl, aofs);
				aofs += s*4 ;	
			}
			if(this.obuf[b].ibo) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.obuf[b].ibo) ;
			if(this.obuf[b].inst) {
				var inst = cmodel.inst ;
				gl.bindBuffer(gl.ARRAY_BUFFER, this.obuf[b].inst) ;
				var aofs = 0 ;
				for(var i=0;i<obuf.iats.length;i++) {
					var divisor = (inst.divisor)?inst.divisor[i]:1 ;
					var s = this.wwg.vsize[obuf.iats[i].type] ;
					var pos = this.vs_att[obuf.iats[i].name].pos
					gl.enableVertexAttribArray(pos);
					gl.vertexAttribPointer(pos, s, gl.FLOAT, false, obuf.itl, aofs);
					aofs += s*4 ;
					this.wwg.inst_divisor(pos, divisor)		
				}
			}
		}
		if(cmodel.preFunction) {
			
			cmodel.preFunction(gl,cmodel,this.obuf[b]) ;
		}
		if(cmodel.blend!==undefined) {
			gl.enable(gl.BLEND) ;
			if(cmodel.blend=="alpha") gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
		}
		if(cmodel.cull!==undefined) {
			if(cmodel.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
		}
		var gmode = this.wwg.dmodes[geo.mode]
		if(gmode==undefined) {
				console.log("Error: illigal draw mode") ;
				return false ;
		}
		if(cmodel.inst) {
			if(geo.idx) this.wwg.inst_draw(gmode, geo.idx.length, (obuf.i32)?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT, ofs, cmodel.inst.count);
			else this.wwg.inst_drawa(gmode, gl.UNSIGNED_SHORT, ofs, cmodel.inst.count);
		} else {
			if(geo.idx) gl.drawElements(gmode, geo.idx.length, (obuf.i32)?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT, ofs);
			else gl.drawArrays(gmode, ofs,geo.vtx.length/3);
		}
		if(this.wwg.ext_vao) this.wwg.vao_bind(null);
		else {
			
		}
		if(cmodel.blend!==undefined) {
			gl.disable(gl.BLEND) ;
		}
		if(cmodel.cull!==undefined) {
			if(this.env.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
		}
		if(cmodel.postFunction) {
			cmodel.postFunction(gl,cmodel) ;
		}
	}
	if(this.env.offscreen) {// unbind renderbuffer 
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0,0,this.wwg.can.width,this.wwg.can.height) ;
	}
	return true ;
}//Model library for WWG
// Version 0.9 
// 2016-2017 wakufactory.jp 
// license: MIT 

var WWModel = function(){
	
}
WWModel.prototype.loadAjax = function(src) {
	return new Promise(function(resolve,reject) {
		var req = new XMLHttpRequest();
		req.open("get",src,true) ;
		req.responseType = "text" ;
		req.onload = function() {
			if(this.status==200) {
				resolve(this.response) ;
			} else {
				reject("Ajax error:"+this.statusText) ;					
			}
		}
		req.onerror = function() {
			reject("Ajax error:"+this.statusText)
		}
		req.send() ;
	})
}
// load .obj file
WWModel.prototype.loadObj = async function(path,scale) {
	var self = this ;
	if(!scale) scale=1.0 ;
	return new Promise(function(resolve,reject) {
		self.loadAjax(path).then(function(data) {
//			console.log(data) ;
			var l = data.split("\n") ;
			var v = [];
			var n = [] ;
			var x = [] ;
			var t = [] ;
			var xi = {} ;
			var xic = 0 ;

			for(var i = 0;i<l.length;i++) {
				if(l[i].match(/^#/)) continue ;
				if(l[i].match(/^eof/)) break ;
				var ll = l[i].split(/\s+/) ;
				if(ll[0] == "v") {
					v.push([ll[1]*scale,ll[2]*scale,ll[3]*scale]) ;
				}
				if(ll[0] == "vt") {
					t.push([ll[1],ll[2]]) ;
				}
				if(ll[0] == "vn") {
					n.push([ll[1],ll[2],ll[3]]) ;
				}
				if(ll[0] == "f") {
					var ix = [] ;
					for(var ii=1;ii<ll.length;ii++) {
						if(ll[ii]=="") continue ;
						if(!(ll[ii] in xi)) xi[ll[ii]] = xic++ ; 
						ix.push(xi[ll[ii]]) ;
					}
					x.push(ix) ;
				}
			}
			self.obj_v = [] ;
			self.obj_i =x ;
			if(n.length>0) self.obj_n = [] ;
			if(t.length>0) self.obj_t = [] ;
			for(var i in xi) {
				var si = i.split("/") ;
				var ind = xi[i] ;
				self.obj_v[ind] = v[si[0]-1] ;
				if(t.length>0) self.obj_t[ind] = t[si[1]-1] ;
				if(n.length>0) self.obj_n[ind] = n[si[2]-1] ;
			}
			console.log("loadobj "+path+" vtx:"+v.length+" norm:"+n.length+" tex:"+t.length+" idx:"+x.length+" vbuf:"+self.obj_v.length) ;
			resolve(self) ;
		}).catch(function(err) {
			reject(err) ;
		})
	}) ;
}
//convert vtx data to vbo array
WWModel.prototype.objModel  = function(addvec,mode) {
	var v = this.obj_v ;
	var s = this.obj_i ;
	var n = this.obj_n ;
	var t = this.obj_t ;

	var vbuf = [] ;
	var ibuf = [] ;
	var sf = [] ;
	var sn = [] ;
	var ii = 0 ;
	if(!n) this.obj_n = [] ;

	for(var i=0;i<s.length;i++) {
		var p = s[i] ;
		if(!n) {
			//面法線算出
			var pa = [] ;
			for(var j=0;j<3;j++) {
				pa[j] = v[p[j]] ;
			}
			var yx = pa[1][0]-pa[0][0];
			var yy = pa[1][1]-pa[0][1];
			var yz = pa[1][2]-pa[0][2];
			var zx = pa[2][0]-pa[0][0];
			var zy = pa[2][1]-pa[0][1];
			var zz = pa[2][2]-pa[0][2];				
			var xx =  yy * zz - yz * zy;
			var xy = -yx * zz + yz * zx;
			var xz =  yx * zy - yy * zx;
			var vn = Math.sqrt(xx*xx+xy*xy+xz*xz) ;
			xx /= vn ; xy /= vn ; xz /= vn ;
			sf.push( [xx,xy,xz]) ;
			//面リスト
			for(var j=0;j<p.length;j++) {
				if(!sn[p[j]]) sn[p[j]] = [] ;
				sn[p[j]].push(i) ;
			}
		}
		//3角分割
		for(var j=1;j<p.length-1;j++) {
			ibuf.push(p[0]) ;
			ibuf.push(p[j]) ;
			ibuf.push(p[j+1] ) ;
		}
		ii += p.length ;
	}
	console.log(" vert:"+v.length);
	console.log(" poly:"+ibuf.length/3);
	for(var i=0;i<v.length;i++) {
		vbuf.push( v[i][0] ) ;
		vbuf.push( v[i][1] ) ;
		vbuf.push( v[i][2] ) ;
		var nx=0,ny=0,nz=0 ;		
		if(n) {
			nx = n[i][0] ;
			ny = n[i][1] ;
			nz = n[i][2] ;
		} else {
			//面法線の合成
			for(var j=0;j<sn[i].length;j++) {
				var ii = sn[i][j] ;
				nx += sf[ii][0] ;
				ny += sf[ii][1] ;
				nz += sf[ii][2] ;
			}
		}
		var vn = Math.sqrt(nx*nx+ny*ny+nz*nz) ;
		vbuf.push(nx/vn) ;
		vbuf.push(ny/vn) ;
		vbuf.push(nz/vn) ;
		if(!n) {
			this.obj_n.push([nx/vn,ny/vn,nz/vn]); 
		}
		if(t) {
			vbuf.push(t[i][0]) ;
			vbuf.push(t[i][1]) ;
		}
		if(addvec) {
			for(av=0;av<addvec.length;av++) {
				vbuf = vbuf.concat(addvec[av].data[i]) ;
			}
		}
	}

//	console.log(vbuf) ;
//	console.log(ibuf) ;
	this.ibuf = ibuf ;
	this.vbuf = vbuf ;
	var ret = {mode:"tri",vtx_at:["position","norm"],vtx:vbuf,idx:ibuf} ;
	if(t) ret.vtx_at.push("uv") ;
	if(addvec) {
		for(av=0;av<addvec.length;av++) ret.vtx_at.push(addvec[av].attr) ;
	}
	return ret ;
}
// generate normal vector lines
WWModel.prototype.normLines = function() {
	var nv = [] ;
	var v = this.obj_v
	var n = this.obj_n ;
	var vm = 0.1
	for(var i=0;i<v.length;i++) {
		nv.push(v[i][0]) ;
		nv.push(v[i][1]) ;
		nv.push(v[i][2]) ;
		nv.push(v[i][0]+n[i][0]*vm) ;
		nv.push(v[i][1]+n[i][1]*vm) ;
		nv.push(v[i][2]+n[i][2]*vm) ;
	}
	return  {mode:"lines",vtx_at:["position"],vtx:nv} ;
}
// generate wireframe lines
WWModel.prototype.wireframe = function() {
	var nv = [] ;
	var v = this.obj_v ;
	var s = this.obj_i ;
	for(var k=0;k<s.length;k++) {
		var ss = s[k]; 
		for(var i=1;i<ss.length;i++) {
			nv.push(v[ss[i-1]][0]) ;
			nv.push(v[ss[i-1]][1]) ;
			nv.push(v[ss[i-1]][2]) ;
			nv.push(v[ss[i]][0]) ;
			nv.push(v[ss[i]][1]) ;
			nv.push(v[ss[i]][2]) ;
		}
		nv.push(v[ss[i-1]][0]) ;
		nv.push(v[ss[i-1]][1]) ;
		nv.push(v[ss[i-1]][2]) ;		
		nv.push(v[ss[0]][0]) ;
		nv.push(v[ss[0]][1]) ;
		nv.push(v[ss[0]][2]) ;	
	}
	return  {mode:"lines",vtx_at:["position"],vtx:nv} ;	
}

// mult 4x4 matrix
WWModel.prototype.multMatrix4 = function(m4) {
	var inv = new CanvasMatrix4(m4).invert().transpose() ;
	for(var i=0;i<this.obj_v.length;i++) {
		var v = this.obj_v[i] ;
		var vx = m4.m11 * v[0] + m4.m21 * v[1] + m4.m31 * v[2] + m4.m41 ;
		var vy = m4.m12 * v[0] + m4.m22 * v[1] + m4.m32 * v[2] + m4.m42 ;
		var vz = m4.m13 * v[0] + m4.m23 * v[1] + m4.m33 * v[2] + m4.m43 ;
		this.obj_v[i] = [vx,vy,vz] ;
	}
}
WWModel.prototype.mergeModels = function(models) {
	var m = this ;
	var ofs = 0 ;
	for(var i=0;i<models.length;i++) {
		m.obj_v = m.obj_v.concat(models[i].obj_v) 
		m.obj_n = m.obj_n.concat(models[i].obj_n) 
		m.obj_t = m.obj_t.concat(models[i].obj_t)
		for(var j=0;j<models[i].obj_i.length;j++) {
			var p = models[i].obj_i[j] ;
			var pp = [] ;
			for( n=0;n<p.length;n++) {
				pp.push( p[n]+ofs ) ;
			}
			m.obj_i.push(pp) ;
		}
		ofs += models[i].obj_v.length ;
	}
	return m ;
}
// generate primitive
WWModel.prototype.primitive  = function(type,param) {
	if(!param) param = {} ;
	var wx = (param.wx)?param.wx:1.0 ;
	var wy = (param.wy)?param.wy:1.0 ;
	var wz = (param.wz)?param.wz:1.0 ;
	var div = (param.div)?param.div:10 ;
	var ninv = (param.ninv)?-1:1 ;
	var p = [] ;
	var n = [] ;
	var t = [] ;
	var s = [] ;
	var PHI = Math.PI *2 ;
	switch(type) {
	case "sphere":
		for(var i = 0 ; i <= div ; ++i) {
			var v = i / (0.0+div);
			var y = Math.cos(Math.PI * v), r = Math.sin(Math.PI * v);
			for(var j = 0 ; j <= div*2 ; ++j) {
				var u = j / (0.0+div*2) ;
				var x = (Math.cos(PHI * u) * r)
				var z = (Math.sin(PHI * u) * r)
				p.push([x*wx,y*wy,z*wz])
				n.push([x*ninv,y*ninv,z*ninv])
				t.push([1-u,1-v])
			}
		}
		var d2 = div*2+1 ;
		for(var j = 0 ; j < div ; ++j) {
			var base = j * d2;
			for(var i = 0 ; i < div*2 ; ++i) {
				if(ninv>0) s.push(
					[base + i,	  base + i + 1, base + i     + d2],
					[base + i + d2, base + i + 1, base + i + 1 + d2]);
				else s.push(
					[base + i     + d2,	base + i + 1, base + i],
					[base + i + 1 + d2, base + i + 1, base + i + d2 ]);

			}
		}
		break;
	case "cylinder":
		for(var i = 0 ; i <= div ; ++i) {
			var v = i / (0.0+div);
			var z = Math.cos(PHI * v)*wz, x = Math.sin(PHI * v)*wx;
			p.push([x,wy,z])
			n.push([x*ninv,0,z*ninv])
			t.push([v,1])
			p.push([x,-wy,z])
			n.push([x*ninv,0,z*ninv,0])
			t.push([v,0])			
		}
		for(var j =0; j < div ;j++) {
			if(ninv<0)s.push([j*2,j*2+2,j*2+3,j*2+1]) ;
			else s.push([j*2,j*2+1,j*2+3,j*2+2]) ;
		}
		break; 
	case "cone":
		for(var i = 0 ; i <= div ; ++i) {
			var v = i / (0.0+div);
			var z = Math.cos(PHI * v)*wz, x = Math.sin(PHI * v)*wx;
			p.push([0,wy,0])
			n.push([x*ninv,0,z*ninv])
			t.push([v,1])
			p.push([x,-wy,z])
			n.push([x*ninv,0,z*ninv,0])
			t.push([v,0])			
		}
		for(var j =0; j < div ;j++) {
			if(ninv<0)s.push([j*2,j*2+2,j*2+3,j*2+1]) ;
			else s.push([j*2,j*2+1,j*2+3,j*2+2]) ;
		}
		break; 
	case "disc":
		for(var i = 0 ; i < div ; ++i) {
			var v = i / (0.0+div);
			var z = Math.cos(PHI * v)*wz, x = Math.sin(PHI * v)*wx;
			p.push([x,0,z])
			n.push([0,1,0])
			t.push([(x/wx+1)/2,(z/wz+1)/2])	
		}
		p.push([0,0,0])
		n.push([0,1,0])
		t.push([0.5,0.5])
		for(var j =0; j < div-1 ;j++) {
			s.push([j,j+1,div]) ;
		}
		s.push([j,0,div])
		break; 
	case "plane":
		p = [[wx,0,wz],[wx,0,-wz],[-wx,0,-wz],[-wx,0,wz]]
		n = [[0,1,0],[0,1,0],[0,1,0],[0,1,0]]
		t = [[1,0],[1,1],[0,1],[0,0]]
		s = [[0,1,2],[2,3,0]]
		break ;
	case "box":
		p = [
			[wx,wy,wz],[wx,-wy,wz],[-wx,-wy,wz],[-wx,wy,wz],
			[wx,wy,-wz],[wx,-wy,-wz],[-wx,-wy,-wz],[-wx,wy,-wz],
			[wx,wy,wz],[wx,-wy,wz],[wx,-wy,-wz],[wx,wy,-wz],
			[-wx,wy,wz],[-wx,-wy,wz],[-wx,-wy,-wz],[-wx,wy,-wz],
			[wx,wy,wz],[wx,wy,-wz],[-wx,wy,-wz],[-wx,wy,wz],
			[wx,-wy,wz],[wx,-wy,-wz],[-wx,-wy,-wz],[-wx,-wy,wz],
		]
		n = [
			[0,0,ninv],[0,0,ninv],[0,0,ninv],[0,0,ninv],
			[0,0,-ninv],[0,0,-ninv],[0,0,-ninv],[0,0,-ninv],
			[ninv,0,0],[ninv,0,0],[ninv,0,0],[ninv,0,0],
			[-ninv,0,0],[-ninv,0,0],[-ninv,0,0],[-ninv,0,0],
			[0,ninv,0],[0,ninv,0],[0,ninv,0],[0,ninv,0],
			[0,-ninv,0],[0,-ninv,0],[0,-ninv,0],[0,-ninv,0]
		]
		t = [
			[1,1],[1,0],[0,0],[0,1],
			[0,1],[0,0],[1,0],[1,1],
			[0,1],[0,0],[1,0],[1,1],
			[1,1],[1,0],[0,0],[0,1],
			[1,0],[1,1],[0,1],[0,0],
			[1,1],[1,0],[0,0],[0,1]
		]
		s = (ninv>0)?[
			[3,1,0],[2,1,3],
			[4,5,7],[7,5,6],
			[8,9,11],[11,9,10],
			[15,13,12],[14,13,15],	
			[16,17,19],[19,17,18],
			[23,21,20],[22,21,23],		
		]:[
			[0,1,3],[3,1,2],
			[7,5,4],[6,5,7],
			[11,9,8],[10,9,11],
			[12,13,15],[15,13,14],	
			[19,17,16],[18,17,19],
			[20,21,23],[23,21,22],		
		]
		break ;
	case "mesh":
		this.parametricModel( function(u,v) {
			var r = {
				px:(u-0.5)*wx, py:0, pz:(v-0.5)*wz,
				nx:0, ny:1, nz:0,
				mu:u, mv:v }
			return r ;
		},{start:1.0,end:0,div:div},{start:0,end:1,div:div},{ninv:param.ninv}) ;
		return this ;		
		break ;
	case "torus":
		this.parametricModel( function(u,v) {
			var R = 1.0 ;
			var sr = (param.sr)?param.sr:0.5 ;
			var du = u ;
			var dv = -v ;
			var cx = Math.sin(du*PHI) ;
			var cz = Math.cos(du*PHI) ;
			var vx = Math.sin(dv*PHI) ;
			var vy = Math.cos(dv*PHI) ;
			var tx = 1
			var mx = sr*vx*cx ;
			var mz = sr*vx*cz ;
			var my = sr*vy ;
			var ml = Math.sqrt(mx*mx+my*my+mz*mz) ;
	
			var px = R*cx + tx*mx ;
			var pz = R*cz + tx*mz ;
			var py = tx*my ;
			var r = {
				px:px*wx, py:py*wy, pz:pz*wz,
				nx:0, ny:0, nz:0,
				mu:u, mv:v }
			return r ;			
			
		},{start:0,end:1.0,div:div*2},{start:0,end:1,div:div},{ninv:param.ninv}) ;
		return this ;
	case "polyhedron":
		var m = { "r05":{"v":[[-0.52573111,-0.7236068,0.4472136],[-0.85065081,0.2763932,0.4472136],[-0,0.89442719,0.4472136],[0.85065081,0.2763932,0.4472136],[0.52573111,-0.7236068,0.4472136],[0,-0.89442719,-0.4472136],[-0.85065081,-0.2763932,-0.4472136],[-0.52573111,0.7236068,-0.4472136],[0.52573111,0.7236068,-0.4472136],[0.85065081,-0.2763932,-0.4472136],[0,0,1],[-0,0,-1]],"s":[[0,1,6],[0,6,5],[0,5,4],[0,4,10],[0,10,1],[1,2,7],[1,7,6],[1,10,2],[2,3,8],[2,8,7],[2,10,3],[3,4,9],[3,9,8],[3,10,4],[4,5,9],[5,6,11],[5,11,9],[6,7,11],[7,8,11],[8,9,11]]},
		"r04":{"v":[[-0.35682209,-0.49112347,0.79465447],[0.35682209,-0.49112347,0.79465447],[0.57735027,-0.79465447,0.18759247],[0,-0.98224695,-0.18759247],[-0.57735027,-0.79465447,0.18759247],[-0.57735027,0.18759247,0.79465447],[0.57735027,0.18759247,0.79465447],[0.93417236,-0.303531,-0.18759247],[-0,-0.607062,-0.79465447],[-0.93417236,-0.303531,-0.18759247],[-0.93417236,0.303531,0.18759247],[0,0.607062,0.79465447],[0.93417236,0.303531,0.18759247],[0.57735027,-0.18759247,-0.79465447],[-0.57735027,-0.18759247,-0.79465447],[-0.57735027,0.79465447,-0.18759247],[0,0.98224695,0.18759247],[0.57735027,0.79465447,-0.18759247],[0.35682209,0.49112347,-0.79465447],[-0.35682209,0.49112347,-0.79465447]],"s":[[0,1,6,11,5],[0,5,10,9,4],[0,4,3,2,1],[1,2,7,12,6],[2,3,8,13,7],[3,4,9,14,8],[5,11,16,15,10],[6,12,17,16,11],[7,13,18,17,12],[8,14,19,18,13],[9,10,15,19,14],[15,16,17,18,19]]},
		"r03":{"v":[[-0.57735027,-0.57735027,0.57735027],[-0.57735027,0.57735027,0.57735027],[0.57735027,0.57735027,0.57735027],[0.57735027,-0.57735027,0.57735027],[-0.57735027,-0.57735027,-0.57735027],[-0.57735027,0.57735027,-0.57735027],[0.57735027,0.57735027,-0.57735027],[0.57735027,-0.57735027,-0.57735027]],"s":[[0,1,5,4],[0,4,7,3],[0,3,2,1],[1,2,6,5],[2,3,7,6],[4,5,6,7]]},
		"r02":{"v":[[-0.70710678,-0.70710678,0],[-0.70710678,0.70710678,0],[0.70710678,0.70710678,0],[0.70710678,-0.70710678,0],[0,0,-1],[0,0,1]],"s":[[0,1,4],[0,4,3],[0,3,5],[0,5,1],[1,2,4],[1,5,2],[2,3,4],[2,5,3]]},
		"r01":{"v":[[-0.81649658,-0.47140452,0.33333333],[0.81649658,-0.47140452,0.33333333],[0,0,-1],[0,0.94280904,0.33333333]],"s":[[0,1,3],[0,3,2],[0,2,1],[1,2,3]]},
		"s11":{"v":[[-0.13149606,-0.40470333,0.90494412],[-0.34426119,-0.25012042,0.90494412],[-0.42553024,-1.0e-8,0.90494412],[-0.34426119,0.2501204,0.90494412],[-0.13149606,0.40470332,0.90494412],[0.13149611,0.40470332,0.90494412],[0.34426124,0.2501204,0.90494412],[0.42553028,-1.0e-8,0.90494412],[0.34426124,-0.25012042,0.90494412],[0.13149611,-0.40470333,0.90494412],[-0.13149606,-0.62841783,0.76668096],[-0.34426119,-0.69754941,0.6284178],[-0.42553024,-0.80940666,0.4047033],[-0.34426119,-0.92126391,0.18098881],[-0.13149606,-0.99039549,0.04272564],[0.13149611,-0.99039549,0.04272564],[0.34426124,-0.92126391,0.18098881],[0.42553028,-0.80940666,0.4047033],[0.34426124,-0.69754941,0.6284178],[0.13149611,-0.62841783,0.76668096],[-0.55702632,-0.5429665,0.6284178],[-0.55702632,-0.319252,0.76668096],[-0.63829537,-0.06913159,0.76668096],[-0.76979145,0.11185724,0.6284178],[-0.90128753,0.15458291,0.4047033],[-0.98255658,0.04272566,0.1809888],[-0.98255658,-0.18098884,0.04272564],[-0.90128753,-0.43110925,0.04272564],[-0.76979145,-0.61209808,0.18098881],[-0.63829537,-0.65482375,0.4047033],[-0.82001848,0.54296648,0.18098881],[-0.82001848,0.40470332,0.4047033],[-0.6885224,0.36197765,0.6284178],[-0.47575727,0.43110923,0.76668096],[-0.26299214,0.58569215,0.76668096],[-0.13149606,0.76668098,0.6284178],[-0.13149606,0.90494414,0.4047033],[-0.26299214,0.94766981,0.18098881],[-0.47575727,0.87853823,0.04272564],[-0.6885224,0.72395531,0.04272564],[0.47575732,0.87853821,0.04272564],[0.26299219,0.94766979,0.1809888],[0.13149611,0.90494413,0.4047033],[0.13149611,0.76668098,0.6284178],[0.26299219,0.58569215,0.76668096],[0.47575732,0.43110923,0.76668096],[0.68852245,0.36197765,0.6284178],[0.82001853,0.4047033,0.40470331],[0.82001853,0.54296646,0.18098881],[0.68852245,0.72395529,0.04272564],[0.63829541,-0.65482375,0.4047033],[0.7697915,-0.61209808,0.18098881],[0.90128758,-0.43110925,0.04272564],[0.98255663,-0.18098884,0.04272564],[0.98255647,0.04272561,0.18098879],[0.9012875,0.15458288,0.40470331],[0.7697915,0.11185724,0.6284178],[0.63829541,-0.06913159,0.76668096],[0.55702637,-0.319252,0.76668096],[0.55702637,-0.5429665,0.6284178],[-0.47575727,-0.87853824,-0.04272569],[-0.6885224,-0.72395533,-0.04272569],[-0.82001848,-0.5429665,-0.18098886],[-0.82001848,-0.40470333,-0.40470335],[-0.6885224,-0.36197767,-0.62841785],[-0.47575727,-0.43110925,-0.76668101],[-0.26299214,-0.58569216,-0.76668101],[-0.13149605,-0.76668099,-0.62841784],[-0.13149606,-0.90494416,-0.40470335],[-0.26299214,-0.94766982,-0.18098885],[-0.90128753,-0.15458292,-0.40470335],[-0.98255658,-0.04272567,-0.18098885],[-0.98255658,0.18098882,-0.04272569],[-0.90128753,0.43110923,-0.04272569],[-0.76979145,0.61209806,-0.18098885],[-0.63829536,0.65482373,-0.40470335],[-0.55702632,0.54296648,-0.62841785],[-0.55702632,0.31925199,-0.76668101],[-0.63829537,0.06913157,-0.76668101],[-0.76979145,-0.11185726,-0.62841785],[-0.13149606,0.62841781,-0.76668101],[-0.34426119,0.6975494,-0.62841785],[-0.42553023,0.80940665,-0.40470335],[-0.34426119,0.92126389,-0.18098885],[-0.13149606,0.99039547,-0.04272569],[0.13149611,0.99039546,-0.04272569],[0.34426124,0.92126387,-0.18098886],[0.42553028,0.80940661,-0.40470335],[0.34426124,0.69754939,-0.62841785],[0.13149611,0.62841781,-0.76668101],[0.76979153,-0.11185725,-0.62841782],[0.63829541,0.06913155,-0.76668097],[0.55702634,0.31925197,-0.76668097],[0.55702635,0.54296649,-0.62841782],[0.63829541,0.6548237,-0.40470335],[0.76979149,0.61209803,-0.18098885],[0.9012875,0.43110919,-0.04272571],[0.98255648,0.18098877,-0.04272572],[0.9825564,-0.04272561,-0.18098874],[0.90128711,-0.15458281,-0.4047032],[0.26299219,-0.94766982,-0.18098885],[0.13149611,-0.90494416,-0.40470335],[0.13149611,-0.76668098,-0.62841784],[0.26299219,-0.58569215,-0.76668099],[0.47575682,-0.43110886,-0.76668009],[0.68852237,-0.36197738,-0.6284173],[0.82001805,-0.40470325,-0.40470322],[0.82001853,-0.5429665,-0.18098885],[0.68852245,-0.72395533,-0.04272569],[0.47575732,-0.87853824,-0.04272569],[-0.13149606,-0.40470333,-0.90494417],[-0.34426119,-0.25012042,-0.90494417],[-0.42553024,-0,-0.90494417],[-0.34426119,0.2501204,-0.90494417],[-0.13149606,0.40470332,-0.90494417],[0.13149611,0.40470332,-0.90494417],[0.3442612,0.25012038,-0.90494414],[0.42553027,-3.0e-8,-0.90494414],[0.3442606,-0.25012001,-0.90494332],[0.13149611,-0.40470332,-0.90494416]],"s":[[0,1,21,20,11,10],[0,10,19,9],[0,9,8,7,6,5,4,3,2,1],[1,2,22,21],[2,3,33,32,23,22],[3,4,34,33],[4,5,44,43,35,34],[5,6,45,44],[6,7,57,56,46,45],[7,8,58,57],[8,9,19,18,59,58],[10,11,12,13,14,15,16,17,18,19],[11,20,29,12],[12,29,28,61,60,13],[13,60,69,14],[14,69,68,101,100,15],[15,100,109,16],[16,109,108,51,50,17],[17,50,59,18],[20,21,22,23,24,25,26,27,28,29],[23,32,31,24],[24,31,30,73,72,25],[25,72,71,26],[26,71,70,63,62,27],[27,62,61,28],[30,31,32,33,34,35,36,37,38,39],[30,39,74,73],[35,43,42,36],[36,42,41,85,84,37],[37,84,83,38],[38,83,82,75,74,39],[40,41,42,43,44,45,46,47,48,49],[40,49,95,94,87,86],[40,86,85,41],[46,56,55,47],[47,55,54,97,96,48],[48,96,95,49],[50,51,52,53,54,55,56,57,58,59],[51,108,107,52],[52,107,106,99,98,53],[53,98,97,54],[60,61,62,63,64,65,66,67,68,69],[63,70,79,64],[64,79,78,112,111,65],[65,111,110,66],[66,110,119,103,102,67],[67,102,101,68],[70,71,72,73,74,75,76,77,78,79],[75,82,81,76],[76,81,80,114,113,77],[77,113,112,78],[80,81,82,83,84,85,86,87,88,89],[80,89,115,114],[87,94,93,88],[88,93,92,116,115,89],[90,91,92,93,94,95,96,97,98,99],[90,99,106,105],[90,105,104,118,117,91],[91,117,116,92],[100,101,102,103,104,105,106,107,108,109],[103,119,118,104],[110,111,112,113,114,115,116,117,118,119]]},
		"s06":{"v":[[-0.20177411,-0.27771823,0.93923362],[-0.40354821,-0.55543646,0.72707577],[-0.20177411,-0.8331547,0.51491792],[0.20177411,-0.8331547,0.51491792],[0.40354821,-0.55543646,0.72707577],[0.20177411,-0.27771823,0.93923362],[-0.32647736,0.10607893,0.93923362],[-0.65295472,0.21215785,0.72707577],[-0.85472883,-0.06556038,0.51491792],[-0.73002557,-0.44935754,0.51491792],[-0.73002557,-0.66151539,0.17163931],[-0.40354821,-0.89871508,0.17163931],[-0.20177411,-0.96427546,-0.17163931],[0.20177411,-0.96427546,-0.17163931],[0.40354821,-0.89871508,0.17163931],[0.73002557,-0.66151539,0.17163931],[0.73002557,-0.44935754,0.51491792],[0.85472883,-0.06556038,0.51491792],[0.65295472,0.21215785,0.72707577],[0.32647736,0.10607893,0.93923362],[-0,0.34327861,0.93923362],[-0.65295472,0.55543646,0.51491792],[-0.85472883,0.48987608,0.17163931],[-0.97943209,0.10607893,0.17163931],[-0.97943209,-0.10607892,-0.17163931],[-0.85472883,-0.48987608,-0.17163931],[-0.65295472,-0.55543646,-0.51491792],[-0.32647736,-0.79263615,-0.51491792],[-0,-0.68655723,-0.72707577],[0.32647736,-0.79263615,-0.51491792],[0.65295472,-0.55543646,-0.51491792],[0.85472883,-0.48987608,-0.17163931],[0.97943209,-0.10607893,-0.17163931],[0.97943209,0.10607893,0.17163931],[0.85472883,0.48987608,0.17163931],[0.65295472,0.55543646,0.51491792],[0.32647736,0.79263615,0.51491792],[0,0.68655723,0.72707577],[-0.32647736,0.79263615,0.51491792],[-0.73002557,0.66151539,-0.17163931],[-0.73002557,0.44935754,-0.51491792],[-0.85472883,0.06556038,-0.51491792],[-0.65295472,-0.21215785,-0.72707577],[-0.32647736,-0.10607892,-0.93923362],[0,-0.34327861,-0.93923362],[0.32647736,-0.10607892,-0.93923362],[0.65295472,-0.21215785,-0.72707577],[0.85472883,0.06556038,-0.51491792],[0.73002557,0.44935754,-0.51491792],[0.73002557,0.66151539,-0.17163931],[0.40354821,0.89871508,-0.17163931],[0.20177411,0.96427546,0.17163931],[-0.20177411,0.96427546,0.17163931],[-0.40354821,0.89871508,-0.17163931],[-0.20177411,0.83315469,-0.51491792],[-0.40354821,0.55543646,-0.72707577],[-0.20177411,0.27771823,-0.93923362],[0.2017741,0.27771823,-0.93923362],[0.40354821,0.55543646,-0.72707577],[0.20177411,0.83315469,-0.51491792]],"s":[[0,5,19,20,6],[0,6,7,8,9,1],[0,1,2,3,4,5],[1,9,10,11,2],[2,11,12,13,14,3],[3,14,15,16,4],[4,16,17,18,19,5],[6,20,37,38,21,7],[7,21,22,23,8],[8,23,24,25,10,9],[10,25,26,27,12,11],[12,27,28,29,13],[13,29,30,31,15,14],[15,31,32,33,17,16],[17,33,34,35,18],[18,35,36,37,20,19],[21,38,52,53,39,22],[22,39,40,41,24,23],[24,41,42,26,25],[26,42,43,44,28,27],[28,44,45,46,30,29],[30,46,47,32,31],[32,47,48,49,34,33],[34,49,50,51,36,35],[36,51,52,38,37],[39,53,54,55,40],[40,55,56,43,42,41],[43,56,57,45,44],[45,57,58,48,47,46],[48,58,59,50,49],[50,59,54,53,52,51],[54,59,58,57,56,55]]}
		} ;
		if(!m[param.shape]) return null ;
		var vt = m[param.shape].v ;
		var si = m[param.shape].s ;
		var vi = 0 ;
		for(var i =0;i<si.length;i++) {
			var nx=0,ny=0,nz=0 ;
			var vs = [] ;
			for(var h = si[i].length-1 ;h>=0;h--) {
				var v = vt[si[i][h]] ;
				p.push([v[0],v[2],v[1]]) ;
				nx += v[0] ;
				ny += v[2] ;
				nz += v[1] ;
				vs.push(vi) ;
				vi++ ;
			}
			var vl = Math.sqrt(nx*nx+ny*ny+nz*nz) ;
			for(var h = 0 ;h <si[i].length;h++) n.push([nx/vl,ny/vl,nz/vl]) ;
			s.push(vs) ;
		}
		t = null ;
		break ;
	}
	this.obj_v = p 
	this.obj_n = n
	this.obj_t = t
	this.obj_i = s
//	console.log(p)
//	console.log(n)
//	console.log(t)
//	console.log(s)
	return this ;
}
// generate parametric model by function
WWModel.prototype.parametricModel =function(func,pu,pv,opt) {
	var pos = [] ;
	var norm = [] ;
	var uv = [] ;
	var indices = [] ;
	var ninv = (opt && opt.ninv)?-1:1 ;

	var du = (pu.end - pu.start)/pu.div ;
	var dv = (pv.end - pv.start)/pv.div ;
	for(var iu =0; iu <= pu.div ;iu++ ) {
		for(var iv = 0 ;iv<= pv.div; iv++ ) {
			var u = pu.start+du*iu ;
			var v = pv.start+dv*iv ;
			var p = func(u,v) ;
			pos.push( [p.px,p.py,p.pz] ) ;
			if(p.mu!=undefined) uv.push([p.mu,p.mv]) ;
			// calc normal
			if(p.nx==0&&p.ny==0&&p.nz==0) {
				var dud = du/10 ; var dvd = dv/10 ;
				var du0 = func(u-dud,v) ; var du1 = func(u+dud,v) ;
				var nux = (du1.px - du0.px)/(dud*2) ;
				var nuy = (du1.py - du0.py)/(dud*2) ;
				var nuz = (du1.pz - du0.pz)/(dud*2) ;
				var dv0 = func(u,v-dvd) ; var dv1 = func(u,v+dvd) ;
				var nvx = (dv1.px - dv0.px)/(dvd*2) ;
				var nvy = (dv1.py - dv0.py)/(dvd*2) ;
				var nvz = (dv1.pz - dv0.pz)/(dvd*2) ;
				var nx = nuy*nvz - nuz*nvy ;
				var ny = nuz*nvx - nux*nvz ;
				var nz = nux*nvy - nuy*nvx ;
				var nl = Math.sqrt(nx*nx+ny*ny+nz*nz); 
				p.nx = nx/nl ;
				p.ny = ny/nl ;
				p.nz = nz/nl ;
			}
			norm.push([p.nx*ninv, p.ny*ninv,p.nz*ninv] ) ;
		}
	}
	var d2 = pv.div+1 ;
	for(var j = 0 ; j < pu.div ; ++j) {
		var base = j * d2;
		for(var i = 0 ; i < pv.div ; ++i) {
			if(ninv>0) indices.push([base+i,base+i+d2,base+i+d2+1,base+i+1])	
			else  indices.push([base+i+1,base+i+d2+1,base+i+d2,base+i])	
		}	

	}
	this.obj_v = pos
	this.obj_n = norm
	if(uv.length>0) this.obj_t = uv
	this.obj_i = indices 
	return this ;
}

// other utils 
WWModel.HSV2RGB = function( H, S, V ,a) {
	var ih;
	var fl;
	var m, n;
	var rr,gg,bb ;
	H = H * 6 ;
	ih = Math.floor( H );
	fl = H - ih;
	if( !(ih & 1)) fl = 1 - fl;
	m = V * ( 1 - S );
	n = V * ( 1 - S * fl );
	switch( ih ){
		case 0:
		case 6:
			rr = V; gg = n; bb = m; break;
		case 1: rr = n; gg = V; bb = m; break;
		case 2: rr = m; gg = V; bb = n; break;
		case 3: rr = m; gg = n; bb = V; break;
		case 4: rr = n; gg = m; bb = V; break;
		case 5: rr = V; gg = m; bb = n; break;
	}
	return [rr,gg,bb,(a===undefined)?1.0:a] ;
}
WWModel.snormal = function(pa) {
	var yx = pa[1][0]-pa[0][0];
	var yy = pa[1][1]-pa[0][1];
	var yz = pa[1][2]-pa[0][2];
	var zx = pa[2][0]-pa[0][0];
	var zy = pa[2][1]-pa[0][1];
	var zz = pa[2][2]-pa[0][2];				
	var xx =  yy * zz - yz * zy;
	var xy = -yx * zz + yz * zx;
	var xz =  yx * zy - yy * zx;
	var vn = Math.sqrt(xx*xx+xy*xy+xz*xz) ;
	xx /= vn ; xy /= vn ; xz /= vn ;
	return [xx,xy,xz] ;
}/*
 * Copyright (C) 2009 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */
/* modified by wakufactory */
/*
    CanvasMatrix4 class
    
    This class implements a 4x4 matrix. It has functions which
    duplicate the functionality of the OpenGL matrix stack and
    glut functions.
    
    IDL:
    
    [
        Constructor(in CanvasMatrix4 matrix),           // copy passed matrix into new CanvasMatrix4
        Constructor(in sequence<float> array)           // create new CanvasMatrix4 with 16 floats (row major)
        Constructor()                                   // create new CanvasMatrix4 with identity matrix
    ]
    interface CanvasMatrix4 {
        attribute float m11;
        attribute float m12;
        attribute float m13;
        attribute float m14;
        attribute float m21;
        attribute float m22;
        attribute float m23;
        attribute float m24;
        attribute float m31;
        attribute float m32;
        attribute float m33;
        attribute float m34;
        attribute float m41;
        attribute float m42;
        attribute float m43;
        attribute float m44;

        void load(in CanvasMatrix4 matrix);                 // copy the values from the passed matrix
        void load(in sequence<float> array);                // copy 16 floats into the matrix
        sequence<float> getAsArray();                       // return the matrix as an array of 16 floats
        WebGLFloatArray getAsWebGLFloatArray();           // return the matrix as a WebGLFloatArray with 16 values
        void makeIdentity();                                // replace the matrix with identity
        void transpose();                                   // replace the matrix with its transpose
        void invert();                                      // replace the matrix with its inverse
        
        void translate(in float x, in float y, in float z); // multiply the matrix by passed translation values on the right
        void scale(in float x, in float y, in float z);     // multiply the matrix by passed scale values on the right
        void rotate(in float angle,                         // multiply the matrix by passed rotation values on the right
                    in float x, in float y, in float z);    // (angle is in degrees)
        void multRight(in CanvasMatrix matrix);             // multiply the matrix by the passed matrix on the right
        void multLeft(in CanvasMatrix matrix);              // multiply the matrix by the passed matrix on the left
        void ortho(in float left, in float right,           // multiply the matrix by the passed ortho values on the right
                   in float bottom, in float top, 
                   in float near, in float far);
        void frustum(in float left, in float right,         // multiply the matrix by the passed frustum values on the right
                     in float bottom, in float top, 
                     in float near, in float far);
        void perspective(in float fovy, in float aspect,    // multiply the matrix by the passed perspective values on the right
                         in float zNear, in float zFar);
        void lookat(in float eyex, in float eyey, in float eyez,    // multiply the matrix by the passed lookat 
                    in float ctrx, in float ctry, in float ctrz,    // values on the right
                    in float upx, in float upy, in float upz);
    }
*/

CanvasMatrix4 = function(m)
{
    if (typeof m == 'object') {
        if ("length" in m && m.length >= 16) {
            this.load(m);
            return this;
        }
        else if (m instanceof CanvasMatrix4) {
            this.load(m);
            return this;
        }
    }
    this.makeIdentity();
    return this ;
}

CanvasMatrix4.prototype.load = function()
{
    if (arguments.length == 1 && typeof arguments[0] == 'object') {
        var matrix = arguments[0];
        
        if ("length" in matrix && matrix.length == 16) {
            this.m11 = matrix[0];
            this.m12 = matrix[1];
            this.m13 = matrix[2];
            this.m14 = matrix[3];

            this.m21 = matrix[4];
            this.m22 = matrix[5];
            this.m23 = matrix[6];
            this.m24 = matrix[7];

            this.m31 = matrix[8];
            this.m32 = matrix[9];
            this.m33 = matrix[10];
            this.m34 = matrix[11];

            this.m41 = matrix[12];
            this.m42 = matrix[13];
            this.m43 = matrix[14];
            this.m44 = matrix[15];
            return this ;
        }
            
        if (arguments[0] instanceof CanvasMatrix4) {
        
            this.m11 = matrix.m11;
            this.m12 = matrix.m12;
            this.m13 = matrix.m13;
            this.m14 = matrix.m14;

            this.m21 = matrix.m21;
            this.m22 = matrix.m22;
            this.m23 = matrix.m23;
            this.m24 = matrix.m24;

            this.m31 = matrix.m31;
            this.m32 = matrix.m32;
            this.m33 = matrix.m33;
            this.m34 = matrix.m34;

            this.m41 = matrix.m41;
            this.m42 = matrix.m42;
            this.m43 = matrix.m43;
            this.m44 = matrix.m44;
            return this ;
        }
    }
    
    this.makeIdentity();
    return this ;
}

CanvasMatrix4.prototype.getAsArray = function()
{
    return [
        this.m11, this.m12, this.m13, this.m14, 
        this.m21, this.m22, this.m23, this.m24, 
        this.m31, this.m32, this.m33, this.m34, 
        this.m41, this.m42, this.m43, this.m44
    ];
}

CanvasMatrix4.prototype.getAsWebGLFloatArray = function()
{
    return new Float32Array(this.getAsArray());
}

CanvasMatrix4.prototype.makeIdentity = function()
{
    this.m11 = 1;
    this.m12 = 0;
    this.m13 = 0;
    this.m14 = 0;
    
    this.m21 = 0;
    this.m22 = 1;
    this.m23 = 0;
    this.m24 = 0;
    
    this.m31 = 0;
    this.m32 = 0;
    this.m33 = 1;
    this.m34 = 0;
    
    this.m41 = 0;
    this.m42 = 0;
    this.m43 = 0;
    this.m44 = 1;
    return this ;
}

CanvasMatrix4.prototype.transpose = function()
{
    var tmp = this.m12;
    this.m12 = this.m21;
    this.m21 = tmp;
    
    tmp = this.m13;
    this.m13 = this.m31;
    this.m31 = tmp;
    
    tmp = this.m14;
    this.m14 = this.m41;
    this.m41 = tmp;
    
    tmp = this.m23;
    this.m23 = this.m32;
    this.m32 = tmp;
    
    tmp = this.m24;
    this.m24 = this.m42;
    this.m42 = tmp;
    
    tmp = this.m34;
    this.m34 = this.m43;
    this.m43 = tmp;
    return this ;
}

CanvasMatrix4.prototype.invert = function()
{
    // Calculate the 4x4 determinant
    // If the determinant is zero, 
    // then the inverse matrix is not unique.
    var det = this._determinant4x4();

    if (Math.abs(det) < 1e-8)
        return null;

    this._makeAdjoint();

    // Scale the adjoint matrix to get the inverse
    this.m11 /= det;
    this.m12 /= det;
    this.m13 /= det;
    this.m14 /= det;
    
    this.m21 /= det;
    this.m22 /= det;
    this.m23 /= det;
    this.m24 /= det;
    
    this.m31 /= det;
    this.m32 /= det;
    this.m33 /= det;
    this.m34 /= det;
    
    this.m41 /= det;
    this.m42 /= det;
    this.m43 /= det;
    this.m44 /= det;
    return this ;
}

CanvasMatrix4.prototype.translate = function(x,y,z)
{
    if (x == undefined)
        x = 0;
        if (y == undefined)
            y = 0;
    if (z == undefined)
        z = 0;
    
    var matrix = new CanvasMatrix4();
    matrix.m41 = x;
    matrix.m42 = y;
    matrix.m43 = z;

    this.multRight(matrix);
    return this ;
}

CanvasMatrix4.prototype.scale = function(x,y,z)
{
    if (x == undefined)
        x = 1;
    if (z == undefined) {
        if (y == undefined) {
            y = x;
            z = x;
        }
        else
            z = 1;
    }
    else if (y == undefined)
        y = x;
    
    var matrix = new CanvasMatrix4();
    matrix.m11 = x;
    matrix.m22 = y;
    matrix.m33 = z;
    
    this.multRight(matrix);
    return this ;
}

CanvasMatrix4.prototype.rotate = function(angle,x,y,z)
{
    // angles are in degrees. Switch to radians
    angle = angle / 180 * Math.PI;
    
    angle /= 2;
    var sinA = Math.sin(angle);
    var cosA = Math.cos(angle);
    var sinA2 = sinA * sinA;
    
    // normalize
    var length = Math.sqrt(x * x + y * y + z * z);
    if (length == 0) {
        // bad vector, just use something reasonable
        x = 0;
        y = 0;
        z = 1;
    } else if (length != 1) {
        x /= length;
        y /= length;
        z /= length;
    }
    
    var mat = new CanvasMatrix4();

    // optimize case where axis is along major axis
    if (x == 1 && y == 0 && z == 0) {
        mat.m11 = 1;
        mat.m12 = 0;
        mat.m13 = 0;
        mat.m21 = 0;
        mat.m22 = 1 - 2 * sinA2;
        mat.m23 = 2 * sinA * cosA;
        mat.m31 = 0;
        mat.m32 = -2 * sinA * cosA;
        mat.m33 = 1 - 2 * sinA2;
        mat.m14 = mat.m24 = mat.m34 = 0;
        mat.m41 = mat.m42 = mat.m43 = 0;
        mat.m44 = 1;
    } else if (x == 0 && y == 1 && z == 0) {
        mat.m11 = 1 - 2 * sinA2;
        mat.m12 = 0;
        mat.m13 = -2 * sinA * cosA;
        mat.m21 = 0;
        mat.m22 = 1;
        mat.m23 = 0;
        mat.m31 = 2 * sinA * cosA;
        mat.m32 = 0;
        mat.m33 = 1 - 2 * sinA2;
        mat.m14 = mat.m24 = mat.m34 = 0;
        mat.m41 = mat.m42 = mat.m43 = 0;
        mat.m44 = 1;
    } else if (x == 0 && y == 0 && z == 1) {
        mat.m11 = 1 - 2 * sinA2;
        mat.m12 = 2 * sinA * cosA;
        mat.m13 = 0;
        mat.m21 = -2 * sinA * cosA;
        mat.m22 = 1 - 2 * sinA2;
        mat.m23 = 0;
        mat.m31 = 0;
        mat.m32 = 0;
        mat.m33 = 1;
        mat.m14 = mat.m24 = mat.m34 = 0;
        mat.m41 = mat.m42 = mat.m43 = 0;
        mat.m44 = 1;
    } else {
        var x2 = x*x;
        var y2 = y*y;
        var z2 = z*z;
    
        mat.m11 = 1 - 2 * (y2 + z2) * sinA2;
        mat.m12 = 2 * (x * y * sinA2 + z * sinA * cosA);
        mat.m13 = 2 * (x * z * sinA2 - y * sinA * cosA);
        mat.m21 = 2 * (y * x * sinA2 - z * sinA * cosA);
        mat.m22 = 1 - 2 * (z2 + x2) * sinA2;
        mat.m23 = 2 * (y * z * sinA2 + x * sinA * cosA);
        mat.m31 = 2 * (z * x * sinA2 + y * sinA * cosA);
        mat.m32 = 2 * (z * y * sinA2 - x * sinA * cosA);
        mat.m33 = 1 - 2 * (x2 + y2) * sinA2;
        mat.m14 = mat.m24 = mat.m34 = 0;
        mat.m41 = mat.m42 = mat.m43 = 0;
        mat.m44 = 1;
    }
    this.multRight(mat);
    return this ;
}

CanvasMatrix4.prototype.multRight = function(mat)
{
    var m11 = (this.m11 * mat.m11 + this.m12 * mat.m21
               + this.m13 * mat.m31 + this.m14 * mat.m41);
    var m12 = (this.m11 * mat.m12 + this.m12 * mat.m22
               + this.m13 * mat.m32 + this.m14 * mat.m42);
    var m13 = (this.m11 * mat.m13 + this.m12 * mat.m23
               + this.m13 * mat.m33 + this.m14 * mat.m43);
    var m14 = (this.m11 * mat.m14 + this.m12 * mat.m24
               + this.m13 * mat.m34 + this.m14 * mat.m44);

    var m21 = (this.m21 * mat.m11 + this.m22 * mat.m21
               + this.m23 * mat.m31 + this.m24 * mat.m41);
    var m22 = (this.m21 * mat.m12 + this.m22 * mat.m22
               + this.m23 * mat.m32 + this.m24 * mat.m42);
    var m23 = (this.m21 * mat.m13 + this.m22 * mat.m23
               + this.m23 * mat.m33 + this.m24 * mat.m43);
    var m24 = (this.m21 * mat.m14 + this.m22 * mat.m24
               + this.m23 * mat.m34 + this.m24 * mat.m44);

    var m31 = (this.m31 * mat.m11 + this.m32 * mat.m21
               + this.m33 * mat.m31 + this.m34 * mat.m41);
    var m32 = (this.m31 * mat.m12 + this.m32 * mat.m22
               + this.m33 * mat.m32 + this.m34 * mat.m42);
    var m33 = (this.m31 * mat.m13 + this.m32 * mat.m23
               + this.m33 * mat.m33 + this.m34 * mat.m43);
    var m34 = (this.m31 * mat.m14 + this.m32 * mat.m24
               + this.m33 * mat.m34 + this.m34 * mat.m44);

    var m41 = (this.m41 * mat.m11 + this.m42 * mat.m21
               + this.m43 * mat.m31 + this.m44 * mat.m41);
    var m42 = (this.m41 * mat.m12 + this.m42 * mat.m22
               + this.m43 * mat.m32 + this.m44 * mat.m42);
    var m43 = (this.m41 * mat.m13 + this.m42 * mat.m23
               + this.m43 * mat.m33 + this.m44 * mat.m43);
    var m44 = (this.m41 * mat.m14 + this.m42 * mat.m24
               + this.m43 * mat.m34 + this.m44 * mat.m44);
    
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;
    
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;
    
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;
    
    this.m41 = m41;
    this.m42 = m42;
    this.m43 = m43;
    this.m44 = m44;
    return this ;
}

CanvasMatrix4.prototype.multLeft = function(mat)
{
    var m11 = (mat.m11 * this.m11 + mat.m12 * this.m21
               + mat.m13 * this.m31 + mat.m14 * this.m41);
    var m12 = (mat.m11 * this.m12 + mat.m12 * this.m22
               + mat.m13 * this.m32 + mat.m14 * this.m42);
    var m13 = (mat.m11 * this.m13 + mat.m12 * this.m23
               + mat.m13 * this.m33 + mat.m14 * this.m43);
    var m14 = (mat.m11 * this.m14 + mat.m12 * this.m24
               + mat.m13 * this.m34 + mat.m14 * this.m44);

    var m21 = (mat.m21 * this.m11 + mat.m22 * this.m21
               + mat.m23 * this.m31 + mat.m24 * this.m41);
    var m22 = (mat.m21 * this.m12 + mat.m22 * this.m22
               + mat.m23 * this.m32 + mat.m24 * this.m42);
    var m23 = (mat.m21 * this.m13 + mat.m22 * this.m23
               + mat.m23 * this.m33 + mat.m24 * this.m43);
    var m24 = (mat.m21 * this.m14 + mat.m22 * this.m24
               + mat.m23 * this.m34 + mat.m24 * this.m44);

    var m31 = (mat.m31 * this.m11 + mat.m32 * this.m21
               + mat.m33 * this.m31 + mat.m34 * this.m41);
    var m32 = (mat.m31 * this.m12 + mat.m32 * this.m22
               + mat.m33 * this.m32 + mat.m34 * this.m42);
    var m33 = (mat.m31 * this.m13 + mat.m32 * this.m23
               + mat.m33 * this.m33 + mat.m34 * this.m43);
    var m34 = (mat.m31 * this.m14 + mat.m32 * this.m24
               + mat.m33 * this.m34 + mat.m34 * this.m44);

    var m41 = (mat.m41 * this.m11 + mat.m42 * this.m21
               + mat.m43 * this.m31 + mat.m44 * this.m41);
    var m42 = (mat.m41 * this.m12 + mat.m42 * this.m22
               + mat.m43 * this.m32 + mat.m44 * this.m42);
    var m43 = (mat.m41 * this.m13 + mat.m42 * this.m23
               + mat.m43 * this.m33 + mat.m44 * this.m43);
    var m44 = (mat.m41 * this.m14 + mat.m42 * this.m24
               + mat.m43 * this.m34 + mat.m44 * this.m44);
    
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;

    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;

    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;

    this.m41 = m41;
    this.m42 = m42;
    this.m43 = m43;
    this.m44 = m44;
    return this ;
}

CanvasMatrix4.prototype.ortho = function(left, right, bottom, top, near, far)
{
    var tx = (left + right) / (right - left);
    var ty = (top + bottom) / (top - bottom);
    var tz = (far + near) / (far - near);
    
    var matrix = new CanvasMatrix4();
    matrix.m11 = 2 / (right - left);
    matrix.m12 = 0;
    matrix.m13 = 0;
    matrix.m14 = 0;
    matrix.m21 = 0;
    matrix.m22 = 2 / (top - bottom);
    matrix.m23 = 0;
    matrix.m24 = 0;
    matrix.m31 = 0;
    matrix.m32 = 0;
    matrix.m33 = -2 / (far - near);
    matrix.m34 = 0;
    matrix.m41 = tx;
    matrix.m42 = ty;
    matrix.m43 = -tz;
    matrix.m44 = 1;
    
    this.multRight(matrix);
    return this ;
}

CanvasMatrix4.prototype.frustum = function(left, right, bottom, top, near, far)
{
    var matrix = new CanvasMatrix4();
    var A = (right + left) / (right - left);
    var B = (top + bottom) / (top - bottom);
    var C = -(far + near) / (far - near);
    var D = -(2 * far * near) / (far - near);
    
    matrix.m11 = (2 * near) / (right - left);
    matrix.m12 = 0;
    matrix.m13 = 0;
    matrix.m14 = 0;
    
    matrix.m21 = 0;
    matrix.m22 = 2 * near / (top - bottom);
    matrix.m23 = 0;
    matrix.m24 = 0;
    
    matrix.m31 = A;
    matrix.m32 = B;
    matrix.m33 = C;
    matrix.m34 = -1;
    
    matrix.m41 = 0;
    matrix.m42 = 0;
    matrix.m43 = D;
    matrix.m44 = 0;
    
    this.multRight(matrix);
    return this ;
}

CanvasMatrix4.prototype.perspective = function(fovy, aspect, zNear, zFar)
{
    var top = Math.tan(fovy * Math.PI / 360) * zNear;
    var bottom = -top;
    var left = aspect * bottom;
    var right = aspect * top;
    this.frustum(left, right, bottom, top, zNear, zFar);
    return this ;
}
CanvasMatrix4.prototype.pallarel = function(width, aspect, zNear, zFar)
{
    var right = width/2;
    var left = -right;
	var top = right / aspect ;
	var bottom = -top ;
    this.ortho(left, right, bottom, top, zNear, zFar);
    return this ;
}
CanvasMatrix4.prototype.lookat = function(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz)
{
    var matrix = new CanvasMatrix4();
    
    // Make rotation matrix

    // Z vector
    var zx = eyex - centerx;
    var zy = eyey - centery;
    var zz = eyez - centerz;
    var mag = Math.sqrt(zx * zx + zy * zy + zz * zz);
    if (mag) {
        zx /= mag;
        zy /= mag;
        zz /= mag;
    }

    // X vector = Y cross Z
    xx =  upy * zz - upz * zy;
    xy = -upx * zz + upz * zx;
    xz =  upx * zy - upy * zx;

    // Recompute Y = Z cross X
    yx = zy * xz - zz * xy;
    yy = -zx * xz + zz * xx;
    yz = zx * xy - zy * xx;

    // cross product gives area of parallelogram, which is < 1.0 for
    // non-perpendicular unit-length vectors; so normalize x, y here

    mag = Math.sqrt(xx * xx + xy * xy + xz * xz);
    if (mag) {
        xx /= mag;
        xy /= mag;
        xz /= mag;
    }

    mag = Math.sqrt(yx * yx + yy * yy + yz * yz);
    if (mag) {
        yx /= mag;
        yy /= mag;
        yz /= mag;
    }

    matrix.m11 = xx;
    matrix.m12 = yx;
    matrix.m13 = zx;
    matrix.m14 = 0;
    
    matrix.m21 = xy;
    matrix.m22 = yy;
    matrix.m23 = zy;
    matrix.m24 = 0;
    
    matrix.m31 = xz;
    matrix.m32 = yz;
    matrix.m33 = zz;
    matrix.m34 = 0;
    
    matrix.m41 = -(xx * eyex + xy * eyey + xz * eyez);
    matrix.m42 = -(yx * eyex + yy * eyey + yz * eyez);
    matrix.m43 = -(zx * eyex + zy * eyey + zz * eyez);
    matrix.m44 = 1;
 //   matrix.translate(-eyex, -eyey, -eyez);
    
    this.multRight(matrix);
    return this ;
}

// Support functions
CanvasMatrix4.prototype._determinant2x2 = function(a, b, c, d)
{
    return a * d - b * c;
}

CanvasMatrix4.prototype._determinant3x3 = function(a1, a2, a3, b1, b2, b3, c1, c2, c3)
{
    return a1 * this._determinant2x2(b2, b3, c2, c3)
         - b1 * this._determinant2x2(a2, a3, c2, c3)
         + c1 * this._determinant2x2(a2, a3, b2, b3);
}

CanvasMatrix4.prototype._determinant4x4 = function()
{
    var a1 = this.m11;
    var b1 = this.m12; 
    var c1 = this.m13;
    var d1 = this.m14;

    var a2 = this.m21;
    var b2 = this.m22; 
    var c2 = this.m23;
    var d2 = this.m24;

    var a3 = this.m31;
    var b3 = this.m32; 
    var c3 = this.m33;
    var d3 = this.m34;

    var a4 = this.m41;
    var b4 = this.m42; 
    var c4 = this.m43;
    var d4 = this.m44;

    return a1 * this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4)
         - b1 * this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4)
         + c1 * this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4)
         - d1 * this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
}

CanvasMatrix4.prototype._makeAdjoint = function()
{
    var a1 = this.m11;
    var b1 = this.m12; 
    var c1 = this.m13;
    var d1 = this.m14;

    var a2 = this.m21;
    var b2 = this.m22; 
    var c2 = this.m23;
    var d2 = this.m24;

    var a3 = this.m31;
    var b3 = this.m32; 
    var c3 = this.m33;
    var d3 = this.m34;

    var a4 = this.m41;
    var b4 = this.m42; 
    var c4 = this.m43;
    var d4 = this.m44;

    // Row column labeling reversed since we transpose rows & columns
    this.m11  =   this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
    this.m21  = - this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
    this.m31  =   this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
    this.m41  = - this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
        
    this.m12  = - this._determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
    this.m22  =   this._determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
    this.m32  = - this._determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
    this.m42  =   this._determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);
        
    this.m13  =   this._determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
    this.m23  = - this._determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
    this.m33  =   this._determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
    this.m43  = - this._determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);
        
    this.m14  = - this._determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
    this.m24  =   this._determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
    this.m34  = - this._determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
    this.m44  =   this._determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);
}

CanvasMatrix4.prototype.multVec4 = function(x,y,z,w) {
	var xx = this.m11*x + this.m21*y + this.m31*z + this.m41*w ;
	var yy = this.m12*x + this.m22*y + this.m32*z + this.m42*w ;
	var zz = this.m13*x + this.m23*y + this.m33*z + this.m43*w ;
	var ww = this.m14*x + this.m24*y + this.m34*z + this.m44*w ;
	return [xx,yy,zz,ww] ;
}//mouse and touch event handler
Pointer = function(t,cb) {
	var self = this ;
	var touch,gesture,EV_S,EV_E,EV_M ;
	function pos(ev) {
		var x,y ;
		if(touch && ev.touches.length>0) {
			x = ev.touches[0].pageX - ev.target.offsetLeft ;
			y = ev.touches[0].pageY - ev.target.offsetTop ;
		} else {
			x = ev.offsetX ;
			y = ev.offsetY ;
		}
		return {x:x,y:y} ;
	}
	t.addEventListener("mousedown", startev,false ) ;
	t.addEventListener("touchstart", startev,false ) ;
	function startev(ev) {
		if(gesture) return ;
		if(!EV_S) {
			touch = (ev.type=="touchstart") ;
			setevent() ;
			first = false ;
		}
		self.mf = true ;
		self.dx = self.dy = 0 ;
		self.s = pos(ev) ;
		self.lastd = self.s ;
		if(cb.down) if(!cb.down({x:self.s.x,y:self.s.y,sx:self.s.x,sy:self.s.y})) ev.preventDefault() ;	
	}
	function setevent() {
		if(touch) {
			EV_S = "touchstart" ;
			EV_E = "touchend" ;
			EV_O = "touchcancel" ;
			EV_M = "touchmove" ;
		} else {
			EV_S = "mousedown" ;
			EV_E = "mouseup" ;
			EV_O = "mouseout" ;
			EV_M = "mousemove" ;	
		}
		t.addEventListener(EV_E, function(ev) {
			var c = pos(ev) ;
			var d = (ev.type=="touchend")?self.lastd:pos(ev) ;
			self.mf = false ;
			if(cb.up) if(!cb.up({x:c.x,y:c.y,ex:d.x,ey:d.y,dx:self.dx,dy:self.dy})) ev.preventDefault() ;
		},false);
		t.addEventListener(EV_O, function(ev) {
			self.mf = false ;
			var c = pos(ev) ;
			if(cb.out) if(!cb.out({x:c.x,y:c.y,dx:self.dx,dy:self.dy})) ev.preventDefault() ;
		},false);
		t.addEventListener(EV_M, function(ev) {
			if(gesture) return ;
			var d = pos(ev) ;
			self.lastd = d ;
			if(self.mf) {
				self.dx = (d.x-self.s.x) ;
				self.dy = (d.y-self.s.y) ;
				if(cb.move) if(!cb.move({x:d.x,y:d.y,ox:d.x,oy:d.y,dx:self.dx,dy:self.dy})) ev.preventDefault() ;
			}
		},false)	
	}
	if(cb.contextmenu) {
		t.addEventListener("contextmenu", function(ev){
			if(!cb.contextmenu({px:ev.offsetX,py:ev.offsetY})) ev.preventDefault() ;
		},false )
	}
	if(cb.wheel) {
		t.addEventListener("wheel", function(ev){
			if(!cb.wheel(ev.deltaY)) ev.preventDefault() ;
		},false ) ;
	}
	if(cb.gesture) {
		t.addEventListener("gesturestart", function(ev){
			gesture = true ;
			if(!cb.gesture(0,0)) ev.preventDefault() ;
		})
		t.addEventListener("gesturechange", function(ev){
		
			if(!cb.gesture(ev.scale,ev.rotation)) ev.preventDefault() ;
		})
		t.addEventListener("gestureend", function(ev){
			gesture = false ;
		})
	}
	if(cb.gyro) {
		window.addEventListener("deviceorientation", function(ev) {
			var or = window.orientation ;
			var rx,ry,rz ;
			rx = null ;ry = null; rz = null ;
			switch( or ){
				case 90:
					if(ev.gamma<0) {
						rx = ev.gamma+90 ;
						ry = 180-ev.alpha ;
						rz = ev.beta+180 ;						
					} else {
						rx = ev.gamma-90 ;
						ry = 360-ev.alpha ;
						rz = ev.beta ;						
					}
					break ;
				case -90:
					if(ev.gamma<0) {
						rx = -ev.gamma-90 ;
						ry = 180-ev.alpha ;
						rz = -ev.beta+180 ;	
					} else {
						rx = -ev.gamma+90 ;
						ry = 360-ev.alpha ;
						rz = -ev.beta ;						
					}

					break ;	
				default:
		
			}

			cb.gyro({rx:rx,ry:ry,rz:rz,orientation:or}) ;
		})
	}
}
GPad = {conn:false} ;

GPad.init = function() {
	if(!navigator.getGamepads) return false ;
	gamepads = navigator.getGamepads();
	console.log(gamepads)
	if(gamepads[0]) {
		console.log("gpad connected "+0) ;
		GPad.axes =gamepads[0].axes 
		GPad.conn = true ;
	}
	addEventListener("gamepadconnected", function(e) {
		console.log("gpad reconnected "+e.gamepad.index) ;
		console.log(e.gamepad) ;
		GPad.axes = e.gamepad.axes 
		GPad.conn = true; 
	})	
	addEventListener("gamepaddisconnected", function(e) {
		console.log("disconnected "+e.gamepad.index) ;
		GPad.conn = false ;
	})
	return true ;
}
GPad.get = function(pad) {
	if(!GPad.conn) return null ;
	var gamepads = navigator.getGamepads();
	var gp = gamepads[0];
	if(!gp || gp.buttons.length==0) return null ;
	gp.faxes = [] 
	for(var i=0;i<gp.axes.length;i++) {
		gp.faxes[i] = gp.axes[i] - GPad.axes[i] ;
		if(Math.abs(gp.faxes[i])<0.05) gp.faxes[i] = 0 
	}
	return gp ;	
}//WBind 
// license MIT
// 2017 wakufactory 
WBind = { } 

WBind.create = function(init) {
	var obj = new WBind.obj ;
	if(init!==undefined) {
		for(var i in init) {
			obj[i] = init[i] ;
		}
	}
	return obj ;
}
WBind.obj = function() {
	this.prop = {} ;
	this._elem = {} ;
	this._check = {} ;
	this._func = {} ;
	this._tobjs = {} ;
}

WBind._getobj = function(elem,root) {
	if(!root) root = document ;
	var e ;
	if(typeof elem == "string") {
		e = root.querySelectorAll(elem) ;
		if(e.length==1) e = e[0] ;
		if(e.length==0) e = null ;
	} else {
		e = elem ;
	}
	return e ;		
}
WBind._getval = function(e) {
	var v = e.value ;
	if(e.type=="checkbox") {
		v = e.checked ;
	}
	if(e.type=="select-multiple") {
		var o = e.querySelectorAll("option") ;
		v = [] ;
		for(var i=0;i<o.length;i++ ) {
			if(o[i].selected) v.push(o[i].value) ;
		}
	}
	if(e.type=="range") v = parseFloat(v) ;
	return v ;		
}

// bind innerHTML
WBind.obj.prototype.bindHtml= function(name,elem,func) {
	var e = WBind._getobj(elem);
	if(!e) return this ;
	this._elem[name] = e ;
	if(!func) func={} ;
	this._func[name] = func ;

	Object.defineProperty(this,name,{
		configurable: true,
		get: function() {
//			WBind.log("get "+name)
			if((e instanceof NodeList || Array.isArray(e))) this.prop[name] = e[0].innerHTML ;
			else this.prop[name] = e.innerHTML ;
			return this.prop[name]  ;
		},
		set:function(val) {
//			WBind.log("set "+name) 
			if(this._func[name].set) val = this._func[name].set(val) ;
			this.prop[name] = val ;
			if((e instanceof NodeList || Array.isArray(e))) {
				for(var i=0;i<e.length;i++) {
//					console.log(this._elem[name][i])
					this._elem[name][i].innerHTML = val 
				}
			} else  this._elem[name].innerHTML = val ;
		}
	})
	if((e instanceof NodeList || Array.isArray(e))) this.prop[name] = e[0].innerHTML ;
	else this.prop[name] = e.innerHTML ;
	return this ;
}
//bind css
WBind.obj.prototype.bindStyle= function(name,elem,css,func) {
	var e = WBind._getobj(elem);
	if(!e) return this ;
	this._elem[name] = e ;
	if(!func) func={} ;
	this._func[name] = func ;	

	Object.defineProperty(this,name,{
		configurable: true,
		get: function() {
//			WBind.log("get "+name)
			if((e instanceof NodeList || Array.isArray(e))) this.prop[name] = e[0].style[css] ;
			else this.prop[name] = e.style[css] ;
			return this.prop[name]  ;
		},
		set:function(val) {
//			WBind.log("set "+name) 
			if(this._func[name].set) val = this._func[name].set(val) ;
			this.prop[name] = val ;
			if((e instanceof NodeList || Array.isArray(e))) {
				for(var i=0;i<e.length;i++) {
					this._elem[name][i].style[css] = val 
				}
			} else this._elem[name].style[css] = val ;
		}
	})
	if((e instanceof NodeList || Array.isArray(e))) this.prop[name] = e[0].style[css] ;
	else this.prop[name] = e.style[css] ;
	return this ;	
}
//bind attribute
WBind.obj.prototype.bindAttr= function(name,elem,attr,func) {
	var e = WBind._getobj(elem);
	if(!e) return this ;
	this._elem[name] = e ;
	if(!func) func={} ;
	this._func[name] = func ;	

	Object.defineProperty(this,name,{
		configurable: true,
		get: function() {
//			WBind.log("get "+name)
			if((e instanceof NodeList || Array.isArray(e))) this.prop[name] = e[0].getAttribute(attr) ;
			else this.prop[name] = e.getAttribute(attr) ;
			return this.prop[name]  ;
		},
		set:function(val) {
//			WBind.log("set "+name) 
			if(this._func[name].set) val = this._func[name].set(val) ;
			this.prop[name] = val ;
			if((e instanceof NodeList || Array.isArray(e))) {
				for(var i=0;i<e.length;i++) {
					this._elem[name][i].setAttribute(attr,val) 
				}
			} else this._elem[name].setAttribute(attr,val) ;
		}
	})
	if((e instanceof NodeList || Array.isArray(e))) this.prop[name] = e[0].getAttribute(attr) ;
	else this.prop[name] = e.getAttribute(attr) ;
	return this ;	
}
// bind input
WBind.obj.prototype.bindInput= function(name,elem,func) {
	var e = WBind._getobj(elem);
	if(!e) return this ;
	if(!func) func={} ;
	this._func[name] = func ;
	if((e instanceof NodeList || Array.isArray(e))&&
		e[0].type!="checkbox"&&e[0].type!="radio") e = e[0] ;
	var exist = (this.prop[name]!=undefined) ;
	this._elem[name] = e ;
	Object.defineProperty(this,name,{
		configurable: true,
		get: function() {
//			this.prop[name] = e.value ;
			var v = _getprop(name) ;
			if(this._func[name].get) v = this._func[name].get(v) ;
			return v  ;
		},
		set:function(val) {
//			WBind.log("set "+name) 
			if(this._func[name].set) val = this._func[name].set(val) ;
			this.prop[name] = val ;
			_setval(name,val) ;
			if(this._func[name].change) this._func[name].change(_getprop(name)) ;
			if(this._func[name].input) this._func[name].input(_getprop(name)) ;
		}
	})
	var self = this ;
	var v = null ;
	
	if((e instanceof NodeList || Array.isArray(e))) {

		if(e[0].type=="checkbox") self._check[name] = {} ;
		for(var i=0;i<e.length;i++) {
			if( typeof e[i] != "object") continue ;
			if(!exist) e[i].addEventListener("change", function(ev) {
				var val ;
				if(this.type=="checkbox" ) {
					self._check[name][this.value] = this.checked ;
					val = _getprop(name);
				}
				else val = this.value ;
				self.prop[name] = val ;
				if(self._func[name].get) val = self._func[name].get(val) ;
				WBind.log("get "+name+"="+val)
				if(self._func[name].change) self._func[name].change(val) ;
			})
			
			if(e[i].type=="radio" && e[i].checked) v = e[i].value ;
			else if(e[i].type=="checkbox" )  {
				self._check[name][e[i].value] = e[i].checked;
			}
		}
		if(e[0].type=="checkbox") v = _getprop(name);
	} else {
		v = WBind._getval(e) ;
		if(!exist) e.addEventListener("change", function(ev) {
			var val = WBind._getval(this) ;
			self.prop[name] = val ;
			if(self._func[name].get) val = self._func[name].get(val) ;
//			WBind.log("get "+name+"="+val)
			if(self._func[name].change) self._func[name].change(val) ;
		})
		if(!exist) e.addEventListener("input", function(ev) {
			var val = WBind._getval(this) ;
			self.prop[name] = val ;
			if(self._func[name].get) val = self._func[name].get(val) ;
	//		WBind.log("get "+name+"="+this.value)
			if(self._func[name].input) self._func[name].input(val) ;
		})
	}
	if(this._func[name].get) v = this._func[name].get(v) ;
	this.prop[name] = v ;
	if(self._func[name].input) this._func[name].input(v) ;
	if(self._func[name].change) this._func[name].change(v) ;


	function _getprop(name) {
		var v ;
		if(self._check[name]) {
			v = [] ;
			for(var i in self._check[name]) {
				if(self._check[name][i]) v.push(i);
			}
			self.prop[name] = v ;
		} else  v = self.prop[name] ;
		return v ;
	}

	function _setval(name,v) {
		var e = self._elem[name] ;
		if(e instanceof NodeList || Array.isArray(e)) {
			if(e[0].type=="radio") {
				for(var i=0;i<e.length;i++ ) {
					if(e[i].value == v) e[i].checked = true ;
				}
			}
			else if(e[0].type=="checkbox") {
				var chk = {} ;
				for(var i=0; i<v.length;i++) {
					chk[v[i]] = true ;
				}
				for(var i=0;i<e.length;i++ ) {
					e[i].checked = chk[e[i].value] ;
				}
				self._check[name] = chk ;
			}
		} 
		else if(e.type=="checkbox") e.checked = v ;
		else if(e.type=="select-multiple") {
			var o = e.querySelectorAll("option") ;
			for(var i=0;i<o.length;i++ ) {
				o[i].selected = false ;
				for(var vi=0;vi<v.length;vi++) {
					if(o[i].value==v[vi]) o[i].selected = true ;
				}
			}			
		}
		else e.value = v ;	
	}
	return this ;
}

WBind.obj.prototype.getCheck = function(name) {
	return this._check[name] ;
}
//set callback function
WBind.obj.prototype.setFunc = function(name,func) {
	for(var f in func) {
		this._func[name][f] = func[f] ;
	}
	var val = WBind._getval( this._elem[name]) ;
	if(this._func[name].get) val = this._func[name].get(val) ;
	this.prop[name] = val ;
	return this._func[name]  ;
}
//bind all input elements
WBind.obj.prototype.bindAllInput = function(base) {
	if(!base) base = document ;
	var o = base.querySelectorAll("input,select,textarea") ;
	var na = {} ;
	for(var i=0;i<o.length;i++) {
		var n = o[i].name ;
		if(na[n]) {
			if(Array.isArray(na[n])) na[n].push(o[i]) ;
			else na[n] = [na[n],o[i]] ;
		} else na[n] = o[i] ;
	}
	for(var i in na) {
		this.bindInput(i,na[i])
	}
	return na ;
}
WBind.obj.prototype.bindAll = function(selector,base) {
	if(base==null) base = document ;
	var b = base.querySelectorAll(selector) ;
	for(var i=0;i<b.length;i++) {
		var name = b[i].getAttribute("data-bind") ;
		if(b[i].tagName=="INPUT"||b[i].tagName=="SELECT") {
			this.bindInput(name,b[i]) ;
		} else {
			this.bindHtml(name,b[i])
		}
	}
}
//bind timer
WBind.obj.prototype.setTimer = function(name,to,ttime,opt) {
	if(Array.isArray(to)) {
		return this.setTimerM(name,to) ;
	}
	if(!opt) opt = {} ;
	var cd ;
	var sfx = null ;
	if(opt.from) cd = opt.from  ;
	else cd = this[name] ;
	if(isNaN(cd)) {
		if(cd.match(/^([0-9\-\.]+)(.*)$/)) {
			cd = parseFloat(RegExp.$1) ;
			opt.sfx = RegExp.$2 ;
		}
		else cd = 0 ;	
	} ;
	if(cd == to) return this;
	var delay = 0 ;
	if(opt.delay) delay = opt.delay ;
	var now = new Date().getTime() ;
	var o =  {from:cd,to:to,st:now+delay,et:now+delay+ttime,opt:opt} ;
	this._tobjs[name] = {tl:[o],tc:0} ;
//	WBind.log(o) ;
	return this ;
}
WBind.obj.prototype.setTimerM = function(name,s) {
	var o = [] ;
	var now = new Date().getTime() ;
	var cd = this[name] ;
	for(var i=0;i<s.length;i++) {
		var to = s[i].to ;
		var ttime = s[i].time ;
		var opt = s[i].opt ;
		if(!opt) opt = {} ;

		var sfx = null ;
		if(isNaN(cd)) {
			if(cd.match(/^([0-9\-\.]+)(.*)$/)) {
				cd = parseFloat(RegExp.$1) ;
				opt.sfx = RegExp.$2 ;
			}
			else cd = 0 ;	
		} ;
//		if(cd == to) continue ;
		var delay = 0 ;
		if(opt.delay) delay = opt.delay ;
		o.push({from:cd,to:to,st:now+delay,et:now+delay+ttime,opt:opt}) ;
		cd = to ;
	}
	this._tobjs[name] = {tl:o,tc:0} ;
	console.log(o);
	return this ;
}
WBind.obj.prototype.clearTimer = function(name) {
	delete(this._tobjs[name])
}
WBind.obj.prototype.updateTimer = function() {
	var now = new Date().getTime() ;
	for(var name in this._tobjs) {
		var obj = (this._tobjs[name])
		var o = obj.tl[obj.tc] ;
//		console.log(o);
		if(o===undefined) continue ;
		
		if(o.st>now) continue ;
		if(o.et<=now) {
			var v = o.to ;
			if(o.opt.sfx) v = v + o.opt.sfx ;
			this[name] = v ;
//			WBind.log("timeup "+o.key) ;
			obj.tc++ ;
			if(this._tobjs[name].tl.length<obj.tc) delete(this._tobjs[name]) ;
			if(o.opt.efunc) o.opt.efunc(o.to) ;

		} else {
			var t = (now-o.st)/(o.et-o.st) ;
			if(o.opt.tfunc) {
				if(typeof o.opt.tfunc =="string") {
					switch(o.opt.tfunc) {
						case "ease-in":
							t = t*t ;
							break ;
						case "ease-out":
							t = t*(2-t) ;
							break ;
						case "ease-inout":
							t = t*t*(3-2*t) ;
							break;
					}
				} else t = o.opt.tfunc(t) ;
			}
			var v = o.from + (o.to-o.from)* t;
			if(o.opt.sfx) v = v + o.opt.sfx ;
//			WBind.log(o.key+"="+v) ;
			this[name] = v ;
		}
	}
}


//utils
WBind.log = function(msg) {
	console.log(msg) ;
}
WBind.addev = function(id,event,fn,root) {
	var e = WBind._getobj(id,root) ;
	if(e) {
		if(!(e instanceof NodeList) && !Array.isArray(e)) e = [e] 
		for(var i=0;i<e.length;i++) {
			e[i].addEventListener(event,function(ev) {
				if(!fn(ev)) ev.preventDefault() ;
			}) ;
		}
	}
}
WBind.set = function(data,root) {
	if(!root) root = document ;
	if(!(data instanceof Array)) data = [data] ;

	for(var i =0;i<data.length;i++) {
		var d = data[i] ;
		var e ;
		if(d.obj) e = WBind._getobj(d.obj,root) ;
		if(d.id) e = root.getElementById(d.id) ;
		if(d.sel) e = root.querySelectorAll(d.sel) ;
		if(!e) continue ;
		if(!(e instanceof NodeList || Array.isArray(e))) e = [e] ;
		for(var ee=0;ee<e.length;ee++ ) {
			if(d.html !=undefined) e[ee].innerHTML = d.html ;
			if(d.value !=undefined) e[ee].value = d.value ;
			if(d.attr !=undefined) e[ee].setAttribute(d.attr,d.value) ;
			if(d.style !=undefined) {
				for(s in d.style) e[ee].style[s] = d.style[s] ;
			}
		}
	}
}
//poxplayer.js
//  PolygonExplorer Player
//   wakufactory.jp
"use strict" ;
const VRDisplay = {exist:navigator.getVRDisplays}
VRDisplay.getDisplay = function() {
	
}

const PoxPlayer  = function(can,opt) {
	if(!Promise) {
		alert("This browser is not supported!!") ;
		return null ;		
	}
	if(!opt) opt = {} 
	this.can = (can instanceof HTMLElement)?can:document.querySelector(can)  ;

	// wwg initialize
	const wwg = new WWG() ;
	const useWebGL2 = true
	if(!(useWebGL2 && wwg.init2(this.can,{preserveDrawingBuffer: true})) && !wwg.init(this.can,{preserveDrawingBuffer: true})) {
		alert("wgl not supported") ;
		return null ;
	}
	if(opt.needWebGL2 && wwg.version!=2) {
		alert("needs wgl2")
		return null 
	}
	this.wwg = wwg ;
	if(window.WAS!=undefined) this.synth = new WAS.synth() 
	
	const Param = WBind.create() ;
	this.param = Param ;
	Param.bindInput("isStereo",(opt.ui && opt.ui.isStereo)?opt.ui.isStereo:"#isstereo") ;
	Param.bindInput("autorot",(opt.ui && opt.ui.autorot)?opt.ui.autorot:"#autorot") ;
	Param.bindInput("pause",(opt.ui && opt.ui.pause)?opt.ui.pause:"#pause") ;
	Param.bindHtml("fps",(opt.ui && opt.ui.fps)?opt.ui.fps:"#fps") ;

	this.pixRatio = 1 
	this.pox = {} ;

	// canvas initialize
	this.resize() ;
	window.addEventListener("resize",()=>{this.resize()}) ;
	this.pause = true ;

	//set key capture dummy input
	const e = document.createElement("input") ;
	e.setAttribute("type","checkbox") ;
	e.style.position = "absolute" ; e.style.zIndex = -100 ;
	e.style.top = 0
	e.style.width = 10 ; e.style.height =10 ; e.style.padding = 0 ; e.style.border = "none" ; e.style.opacity = 0 ;
	this.can.parentNode.appendChild(e) ;
	this.keyElelment = e ;
	this.keyElelment.focus() ;

	this.setEvent() ;
	// VR init 
	if(navigator.getVRDisplays) {
		navigator.getVRDisplays().then((displays)=> {
			this.vrDisplay = displays[displays.length - 1]
			console.log(this.vrDisplay)
			window.addEventListener('vrdisplaypresentchange', ()=>{
				console.log("vr presenting= "+this.vrDisplay.isPresenting)
				if(this.vrDisplay.isPresenting) {
					if(this.pox.event) this.pox.event("vrchange",1)
				} else {
					this.resize() ;
					if(this.pox.event) this.pox.event("vrchange",0)
				}
			}, false);
			window.addEventListener('vrdisplayactivate', ()=>{
				console.log("vr active")
			}, false);
			window.addEventListener('vrdisplaydeactivate', ()=>{
				console.log("vr deactive")
			}, false);
		})
	}
	console.log(this)
}
PoxPlayer.prototype.enterVR = function() {
	let ret = true
	if(this.vrDisplay) {
		console.log("enter VR")
		this.vrDisplay.requestPresent([{ source: this.can }]).then( () =>{
			console.log("present ok")
			var leftEye = this.vrDisplay.getEyeParameters("left");
			var rightEye = this.vrDisplay.getEyeParameters("right");
			this.can.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
			this.can.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
			if(this.vrDisplay.displayName=="Oculus Go") {
				this.can.width = 2560
				this.can.height = 1280
			}
			this.can.width= this.can.width * this.pixRatio 
			this.can.height= this.can.height * this.pixRatio 
			console.log("vr canvas:"+this.can.width+" x "+this.can.height);
		}).catch((err)=> {
			console.log(err)
		})
	} else if(document.body.webkitRequestFullscreen) {
		console.log("fullscreen")
		const base = this.can.parentNode
		this.ssize = {width:base.offsetWidth,height:base.offsetHeight}
		document.addEventListener("webkitfullscreenchange",(ev)=>{
			console.log("fs "+document.webkitFullscreenElement)
			if( document.webkitFullscreenElement) {
				base.style.width = window.innerWidth + "px"
				base.style.height = window.innerHeight + "px"				
			} else {
				base.style.width = this.ssize.width + "px"
				base.style.height = this.ssize.height + "px"					
			}
		})
		base.webkitRequestFullscreen()
	} else ret = false 
	return ret 
}
PoxPlayer.prototype.resize = function() {
//	console.log("wresize:"+document.body.offsetWidth+" x "+document.body.offsetHeight);
	if(this.can.offsetWidth < 300 || 
		(this.vrDisplay && this.vrDisplay.isPresenting)) return 
	this.can.width= this.can.offsetWidth*this.pixRatio  ;
	this.can.height = this.can.offsetHeight*this.pixRatio  ;
	console.log("canvas:"+this.can.width+" x "+this.can.height);		
}
PoxPlayer.prototype.load = async function(d) {
	return new Promise((resolve,reject) => {
		if(typeof d == "string") {
			const req = new XMLHttpRequest();
			req.open("get",d,true) ;
			req.responseType = "json" ;
			req.onload = () => {
				if(req.status==200) {
//					console.log(req.response) ;
					resolve(req.response) ;
				} else {
					reject("Ajax error:"+req.statusText) ;
				}
			}
			req.onerror = ()=> {
				reject("Ajax error:"+req.statusText)
			}
			req.send() ;
		} else resolve(d) ;
	})
}

PoxPlayer.prototype.loadImage = function(path) {
	if(path.match(/^https?:/)) {
		return this.wwg.loadImageAjax(path)
	}else {
		return new Promise((resolve,reject) => {
			const img = new Image() ;
			img.onload = ()=> {
				resolve( img ) ;
			}
			img.onerror = ()=> {
				reject("cannot load image") ;
			}
			img.src = path ;
		})
	}
}

PoxPlayer.prototype.set = async function(d,param={}) { 
//	return new Promise((resolve,reject) => {
	const VS = d.vs ;
	const FS = d.fs ;
	this.pox  = {src:d,can:this.can,wwg:this.wwg,synth:this.synth,param:param} ;
	const POX = this.pox ;
	POX.loadImage = this.loadImage 

	function V3add() {
		let x=0,y=0,z=0 ;
		for(let i=0;i<arguments.length;i++) {
			x += arguments[i][0] ;y += arguments[i][1] ;z += arguments[i][2] ;
		}
		return [x,y,z] ;
	}
	function V3len(v) {
		return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) ;
	}
	function V3norm(v,s) {
		const l = V3len(v) ;
		if(s===undefined) s = 1 ;
		return (l==0)?[0,0,0]:[v[0]*s/l,v[1]*s/l,v[2]*s/l] ;
	}
	function V3mult(v,s) {
		return [v[0]*s,v[1]*s,v[2]*s] ;
	}
	function V3dot(v1,v2) {
		return v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2] ;
	}

	POX.setScene = async (scene)=> {
		return new Promise((resolve,reject) => {
			this.setScene(scene).then( () => {
				resolve() ;
			})
		})
	}
	POX.log = (msg)=> {
		if(this.errCb) this.errCb(msg) ;
	}
//	this.parseJS(d.m).then((m)=> {
	const m = await this.parseJS(d.m) ;
		try {
			eval(m);	 //EVALUATE CODE
		}catch(err) {
			this.emsg = ("eval error "+err);
			console.log("eval error "+err)
			return(null);
		}
		if(POX.init) POX.init() ;
		return(POX) ;
//	})
	
//	})
}
PoxPlayer.prototype.parseJS = function(src) {

	return new Promise((resolve,reject) => {
		const s = src.split("\n") ;
		const inc = [] ;
		for(let v of s) {
			if(v.match(/^\/\/\@INCLUDE\("(.+)"\)/)) {
				inc.push( this.wwg.loadAjax(RegExp.$1)) ;
			} 
		}
		Promise.all(inc).then((res)=>{
			let ret = [] ;
			let c = 0 ;
			for(let v of s) {
				if(v.match(/^\/\/\@INCLUDE\("(.+)"\)/)) {
					ret = ret.concat(res[c++].split("\n"))
				} else ret.push(v) ;
			}
			resolve( ret.join("\n"))  ;
		})
	})
}
PoxPlayer.prototype.setPacked = function(param={}) { 
	
}
PoxPlayer.prototype.stop = function() {
	window.cancelAnimationFrame(this.loop) ; 
	if(this.pox.unload) this.pox.unload() ;
}
PoxPlayer.prototype.cls = function() {
	if(this.render) this.render.clear() ;
}
PoxPlayer.prototype.setError = function(err) {
	this.errCb = err ;
}
PoxPlayer.prototype.setParam = function(dom) {
	const param = this.pox.setting.param ;
	if(param===undefined) return ;
	this.uparam = WBind.create()
	const input = [] ;
	for(let i in param) {
		const p = param[i] ;
		const name = (p.name)?p.name:i ;
		if(!p.type) p.type = "range" 
		let tag = `<div class=t>${name}</div> <input type=${p.type} id="${i}" min=0 max=100 style="${(p.type=="disp")?"display:none":""}"  /><span id=${"d_"+i}></span><br/>`
		input.push(
			tag
		)
	}
	dom.innerHTML = input.join("") 
	function _tohex(v) {
		let s = (v*255).toString(16) ;
		if(s.length==1) s = "0"+s ;
		return s ;
	}
	function _setdisp(i,v) {
		if(param[i].type=="color" && v ) {
			$('d_'+i).innerHTML = v.map((v)=>v.toString().substr(0,5)) ;
		} else if(param[i].type=="range")  $('d_'+i).innerHTML = v.toString().substr(0,5) ;	
		else $('d_'+i).innerHTML = v
	}
	for(let i in param) {
		this.uparam.bindInput(i,"#"+i)
		this.uparam.setFunc(i,{
			set:(v)=> {
				let ret = v ;
				if(param[i].type=="color") {
					ret = "#"+_tohex(v[0])+_tohex(v[1])+_tohex(v[2])
				} else if(param[i].type=="range") ret = (v - param[i].min)*100/(param[i].max - param[i].min)
				else ret = v ;
//				console.log(ret)
				_setdisp(i,v)
				return ret 	
			},
			get:(v)=> {
				let ret ;
				if(param[i].type=="color" ) {
					if(typeof v =="string" && v.match(/#[0-9A-F]+/i)) {
						ret =[parseInt(v.substr(1,2),16)/255,parseInt(v.substr(3,2),16)/255,parseInt(v.substr(5,2),16)/255] ;
					} else ret = v ;
				} else if(param[i].type=="range" ) ret = v*(param[i].max-param[i].min)/100+param[i].min	
				else ret = v ;		
				return ret ;
			},
			input:(v)=>{
				_setdisp(i,this.uparam[i])
//				this.keyElelment.focus()
			}
		})
		this.uparam[i] = param[i].value ;
	}
	this.pox.param = this.uparam ;
}
PoxPlayer.prototype.setEvent = function() {
	// mouse and key intaraction
	let dragging = false ;
	const Param = this.param ;
	const can = this.can ;

	//mouse intraction
	const m = new Pointer(can,{
		down:(d)=> {
			if(!this.ccam || Param.pause) return true ;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("down",{x:d.x*this.pixRatio,y:d.y*this.pixRatio,sx:d.sx*this.pixRatio,sy:d.sy*this.pixRatio}) ;
			if(ret) this.ccam.event("down",d)
			dragging = true ;
			if(this.ccam.cam.camMode=="walk") this.keyElelment.focus() ;
			return false ;
		},
		move:(d)=> {
			if(!this.ccam || Param.pause) return true;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("move",{x:d.x*this.pixRatio,y:d.y*this.pixRatio,ox:d.ox*this.pixRatio,oy:d.oy*this.pixRatio,dx:d.dx*this.pixRatio,dy:d.dy*this.pixRatio}) ;
			if(ret) this.ccam.event("move",d) 
			return false ;
		},
		up:(d)=> {
			if(!this.ccam) return true ;
			dragging = false ;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("up",{x:d.x*this.pixRatio,y:d.y*this.pixRatio,dx:d.dx*this.pixRatio,dy:d.dy*this.pixRatio,ex:d.ex*this.pixRatio,ey:d.ey*this.pixRatio}) ;
			if(ret) this.ccam.event("up",d)
			return false ;
		},
		out:(d)=> {
			if(!this.ccam) return true ;
			dragging = false ;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("out",{x:d.x*this.pixRatio,y:d.y*this.pixRatio,dx:d.dx*this.pixRatio,dy:d.dy*this.pixRatio}) ;
			if(ret) this.ccam.event("out",d) 
			return false ;
		},
		wheel:(d)=> {
			if(!this.ccam || Param.pause) return true;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("wheel",d) ;
			if(ret) this.ccam.event("wheel",d) 
			return false ;
		},
		gesture:(z,r)=> {
			if(!this.ccam || Param.pause) return true;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("gesture",{z:z,r:r}) ;
			if(ret) this.ccam.event("gesture",{z:z,r:r}) 
			return false ;
		},
		gyro:(ev)=> {
			if(!this.ccam || Param.pause || !this.pox.setting.gyro) return true;
			if(dragging) return true ;
			let ret = true ;
			if(this.pox.event) ret = this.pox.event("gyro",ev) ;
			if(ret) this.ccam.event("gyro",ev) 
			return false ;
		}
	})
	WBind.addev(this.keyElelment,"keydown", (ev)=>{
//		console.log("key:"+ev.key);
		if( Param.pause) return true ;
		if(this.pox.event) {
			if(!this.pox.event("keydown",ev)) return true ;
		}
		if(this.ccam) this.ccam.event("keydown",ev) 
		return false ;
	})
	WBind.addev(this.keyElelment,"keyup", (ev)=>{
//		console.log("key up:"+ev.key);
		if(Param.pause) return true ;
		if(this.pox.event) {
			if(!this.pox.event("keyup",ev)) return true ;
		}
		if(this.ccam) this.ccam.event("keyup",ev)
		return false ;
	})		
	document.querySelectorAll("#bc button").forEach((o)=>{
		o.addEventListener("mousedown", (ev)=>{
			if(this.pox.event) this.pox.event("btndown",ev.target.id) ;
			this.ccam.event("keydown",{key:ev.target.getAttribute("data-key")})
			ev.preventDefault()
		})
		o.addEventListener("touchstart", (ev)=>{
			if(this.pox.event) this.pox.event("touchstart",ev.target.id) ;
			this.ccam.event("keydown",{key:ev.target.getAttribute("data-key")})
			ev.preventDefault()
		})
		o.addEventListener("mouseup", (ev)=>{
			if(this.pox.event) this.pox.event("btnup",ev.target.id) ;
			this.ccam.event("keyup",{key:ev.target.getAttribute("data-key")})
			this.keyElelment.focus() ;
			ev.preventDefault()
		})
		o.addEventListener("touchend", (ev)=>{
			ret = true; 
			if(this.pox.event) ret = this.pox.event("touchend",ev.target.id) ;
			if(ret) this.ccam.event("keyup",{key:ev.target.getAttribute("data-key")})
			ev.preventDefault()
		})
	})
}

PoxPlayer.prototype.setScene = function(sc) {
//	console.log(sc) ;

	const wwg = this.wwg ;
	const pox = this.pox ;
	const can = this.can ;

	const pixRatio = this.pixRatio
	const Param = this.param ;
	const sset = pox.setting || {} ;
	if(!sset.scale) sset.scale = 1.0 ;
	

	sc.vshader = {text:pox.src.vs} ;
	sc.fshader = {text:pox.src.fs} ;
	pox.scene = sc ;

	//create render unit
	const r = wwg.createRender() ;
	this.render = r ;
	pox.render = r ;
	
	//create default camera
	const ccam = this.createCamera() ;
	this.ccam = ccam ;
	pox.cam = ccam.cam ;
	this.isVR = false 
	const self = this 
	return new Promise((resolve,reject) => {
	r.setRender(sc).then(()=> {	
		if(this.errCb) this.errCb("scene set ok") ;
		if(this.renderStart) this.renderStart() ;
		if(window.GPad) GPad.init() ;	
		if(pox.setting && pox.setting.pixRatio) { 
			this.pixRatio = pox.setting.pixRatio ;
		} else {
			this.pixRatio = window.devicePixelRatio ;
		}
		this.resize();

		if(pox.setting.cam) ccam.setCam(pox.setting.cam)
		if(ccam.cam.camMode=="walk") this.keyElelment.focus() ;
		this.keyElelment.value = "" ;
		
		resolve()
		//draw loop
		let st = new Date().getTime() ;
		let tt = 0 ;
		let rt = 0 ;
		let ft = st ;
		let fc = 0 ;
		let gp ;
		const loopf = () => {
			if(this.vrDisplay && this.vrDisplay.isPresenting) {
				this.loop = this.vrDisplay.requestAnimationFrame(loopf)
				this.isVR = true 

			} else {
				this.loop = window.requestAnimationFrame(loopf) ;
				this.isVR = false ;
			}
			const ct = new Date().getTime() ;
			if(Param.pause) {
				Param.fps=0;
				tt = rt ;
				st = ct ;
				return ;
			}
			rt = tt + ct-st ;
			fc++ ;
			if(ct-ft>=1000) {
				if(this.isVR) console.log(fc)
				Param.fps = fc ;
				fc = 0 ;
				ft = ct ; 
			}
			if(Param.autorot) ccam.setCam({camRY:(rt/100)%360}) ;
			if(window.GPad && ccam.cam.gPad && (gp = GPad.get())) {
				let ret = true ;
				if(pox.event) ret = pox.event("gpad",gp) 
				if(ret) ccam.setPad( gp )
			}
			ccam.update()	// camera update
			update(r,pox,ccam.cam,rt) ; // scene update 
			Param.updateTimer() ;
			if(this.vrDisplay && this.vrDisplay.isPresenting) this.vrDisplay.submitFrame()
		}
		loopf() ;		
	}).catch((err)=>{
		console.log(err) ;
		if(this.errCb) this.errCb(err) ;
		reject() 
	})
	}) // promise
	
	// calc model matrix
	function modelMtx(render,cam,update) {
		// calc each mvp matrix and invert matrix
		const mod = [] ;		
		for(let i=0;i<render.modelCount;i++) {
			let d = render.getModelData(i) ;
			let m = new CanvasMatrix4(d.bm) ;
			if(d.mm) m.multRight(d.mm) ;
			if(render.data.group) {
				let g = render.data.group ;
				for(let gi = 0 ;gi < g.length;gi++) {
					let gg = g[gi] ;
					if(!gg.bm) continue ;
					for(let ggi=0;ggi<gg.model.length;ggi++) {
						if(render.getModelIdx(gg.model[ggi])==i) m.multRight(gg.bm) ;
					}
				}
			}
			const uni = {
				vs_uni:{
					modelMatrix:new CanvasMatrix4(m).getAsWebGLFloatArray(),
					mvpMatrix:new CanvasMatrix4(m).
						multRight(cam.camM).getAsWebGLFloatArray(),
					invMatrix:new CanvasMatrix4(m).
						invert().transpose().getAsWebGLFloatArray(),
					eyevec:[cam.camX,cam.camY,cam.camZ]}
			}
			uni.fs_uni = uni.vs_uni
			uni.fs_uni.resolution = [can.width,can.height]
			mod[i]  = uni ;
		}
		update.model = mod ;
//	console.log(update) ;
		return update ;		
	}
	// update scene

	function update(render,scene,cam,time) {
		// draw call 
		let camm,update = {} ;
		if(Param.isStereo || self.isVR) {
			render.gl.viewport(0,0,can.width/2,can.height) ;
			if(!Param.pause) update = scene.update(render,cam,time,-1)
			camm = ccam.getMtx(sset.scale,-1) ;
			if(update.vs_uni==undefined) update.vs_uni = {} ;
			if(update.fs_uni==undefined) update.fs_uni = {} ;
			update.vs_uni.stereo = 1 ;
			update.fs_uni.stereo = 1 ;
			update.fs_uni.time = time/1000 ;
			render.draw(modelMtx(render,camm,update),false) ;
			render.gl.viewport(can.width/2,0,can.width/2,can.height) ;
//			if(!Param.pause) update = scene.update(render,cam,time,1)
			camm = ccam.getMtx(sset.scale,1) ;
//			if(update.vs_uni==undefined) update.vs_uni = {} ;
//			if(update.fs_uni==undefined) update.fs_uni = {} ;
			update.vs_uni.stereo = 2 ;
			update.fs_uni.stereo = 2 ;
//			update.fs_uni.time = time/1000 ;
			render.draw(modelMtx(render,camm,update),true) ;
		} else {
			render.gl.viewport(0,0,can.width,can.height) ;
			if(!Param.pause) update = scene.update(render,cam,time,0)
//			camm = camMtx(render,cam,0) ;
			camm = ccam.getMtx(sset.scale,0) ;
			if(update.vs_uni===undefined) update.vs_uni = {} ;
			if(update.fs_uni===undefined) update.fs_uni = {} ;
			update.vs_uni.stereo = 0 ;
			update.fs_uni.stereo = 0 ;
			update.fs_uni.time = time/1000 ;
			render.draw(modelMtx(render,camm,update),false) ;
		}
	}
}

// camera object
PoxPlayer.prototype.createCamera = function(cam) {
	return new this.Camera(this,cam) ;
}
PoxPlayer.prototype.Camera = function(poxp,cam) {
	this.poxp = poxp ;
	this.render = poxp.render ;
	//camera initial
	this.cam = {
		camCX:0,
		camCY:0,
		camCZ:0,
		camVX:0,
		camVY:0,
		camVZ:1,
		camUPX:0,
		camUPY:1,
		camUPZ:0,
		camRX:30,
		camRY:-30,
		camRZ:0,
		camd:5,
		camAngle:60,	//cam angle(deg) 
		camWidth:1.0,
		camNear:0.01, 	//near
		camFar:1000, 	//far
		camGyro:true, // use gyro
		sbase:0.05, 	//streobase 
		vcx:0,
		vcz:0,
		gyro:true 
	} ;
	for(let i in cam) {
		this.cam[i] = cam[i] ;
	}
	this.rotX = 0 ;
	this.rotY = 0 ;
	this.gev = null ;
	this.gx = 0 ; this.gy = 0 ; this.gz = 0 ;
	this.vrx = 0 ;this.vry = 0 ;
	this.keydown = false ;
	this.RAD = Math.PI/180 
	this.vr = false ;
}
PoxPlayer.prototype.Camera.prototype.setCam = function(cam) {
	for(let i in cam) {
		this.cam[i] = cam[i] ;
	}
}
PoxPlayer.prototype.Camera.prototype.event = function(ev,m) {
	const RAD = Math.PI/180 ;
	const mag = 300*this.poxp.pixRatio /this.poxp.can.width;
	const scale = this.poxp.pox.setting.scale ;

//	console.log("cam "+ev+" key:"+m.key)
	switch(ev) {
		case "down":
			this.rotX = this.cam.camRX
			this.rotY = this.cam.camRY
			break ;
		case "move":
			this.cam.camRX = this.rotX+m.dy*mag ;
			this.cam.camRY = this.rotY+m.dx*mag ;
			if(this.cam.camRX>89)this.cam.camRX=89;
			if(this.cam.camRX<-89)this.cam.camRX=-89;
			break ;
		case "up":
			this.rotX += m.dy*mag ;
			this.rotY += m.dx*mag; 
			if(this.gev!==null) {
				this.gx = this.gev.rx - this.rotX ;
				this.gy = this.gev.ry - this.rotY ;
//				console.log(this.gx+"/"+this.gy) ;
			}
			break ;
		case "out":
			this.rotX += m.dy*mag ;
			this.rotY += m.dx*mag; 
			break ;	
		case "wheel":
			this.cam.camd += m/100 * scale ;
			break ;	
		case "gesture":
			if(m.z==0) {
				this.gz = this.cam.camd ; 
				return false ;
			}
			this.cam.camd = this.gz / m.z ;
			break ;	
		case "gyro":
//		console.log(m)
			if(this.keydown || !this.cam.camGyro) return true ;
			if(m.rx===null) return true ;
			this.gev = m ;
			this.cam.camRX = m.rx - this.gx;
			this.cam.camRY = m.ry - this.gy ;
//		console.log(gx+"/"+gy) ;
			if(this.cam.camRX>89)this.cam.camRX=89 ;
			if(this.cam.camRX<-89)this.cam.camRX=-89 ;
			break ;
		case "keydown":
			const z = this.cam.camd ;
			const keymag= 1 ;
			let md = "" ;
			this.keydown = true ;
			if(m.altKey) {
				switch(m.key) {
					case "ArrowUp":this.cam.camd = this.cam.camd - keymag; if(this.cam.camd<0) cthis.am.camd = 0 ; break ;
					case "ArrowDown":this.cam.camd = this.cam.camd + keymag ; break ;
				}				
			} else {
				switch(m.key) {
					case "ArrowLeft":
					case "Left":
					case "h":
						this.vry = -keymag ;
						break ;
					case "ArrowUp":
					case "Up":
					case "k":
						this.vrx = -keymag ;
						break ;
					case "ArrowRight":
					case "Right":
					case "l":
						this.vry = keymag ;
						break ;
					case "ArrowDown":
					case "Down":
					case "j":
						this.vrx = keymag ;
						break ;
				
					case "w":
					case " ":
						md = "u" ; break ;
					case "z":
						md = "d" ;break ;
					case "a":
						md = "l" ;break ;
					case "s":
						md = "r" ;break ;					
				}
			}
			if(md!="") {
				const dir = ((md=="d")?-0.01:0.01)*keymag*scale 
				const cam = this.cam ;
				let ry = cam.camRY ;
				if(md=="l") ry = ry -90 ;
				if(md=="r") ry = ry +90 ;
				this.cam.vcx =  Math.sin(ry*this.RAD) *dir ;
				this.cam.vcz = -Math.cos(ry*this.RAD)* dir ;	
			}
			break ;
		case "keyup":
			this.keydown = false ;
			if(this.gev!==null) {
				this.gx = this.gev.rx - this.cam.camRX ;
				this.gy = this.gev.ry - this.cam.camRY ;
//				console.log(this.gx+"/"+this.gy) ;
			}
			switch(m.key) {
				case "ArrowLeft":
				case "Left":
				case "h":
				case "ArrowRight":
				case "Right":
				case "l":
					this.vry = 0 ; break ;
				case "ArrowUp":
				case "Up":
				case "k":
				case "ArrowDown":
				case "Down":
				case "j":
					this.vrx = 0  ; break ;
				case "w":
				case "z":
				case "a":
				case "s":
				case " ":
					this.cam.vcx = 0 ; this.cam.vcz = 0 ; break ;
				case "Dead": //mobile safari no keyup key
					this.vrx = 0 ; this.vry = 0 ; this.cam.vcx = 0 ; this.cam.vcz = 0 ; 
					break ;
			}			
			break ;	
		}
}
PoxPlayer.prototype.Camera.prototype.update = function(time) {
	if(this.cam.camMode!="fix") {
		this.cam.camRX += this.vrx ;
		if(this.cam.camRX<-89) this.cam.camRX = -89 ; 
		if(this.cam.camRX>89) this.cam.camRX = 89 ; 
		this.cam.camRY += this.vry ;
	}
	if(this.cam.camMode=="walk") {
		this.cam.camCX += this.cam.vcx ;
		this.cam.camCZ += this.cam.vcz ;
	}
}
PoxPlayer.prototype.Camera.prototype.setPad = function(gp) {
//	console.log(gp.faxes[0],gp.faxes[1])
//	console.log(gp.buttons[0],gp.buttons[1])

//	this.cam.camRY += gp.axes[0]/2
//	this.cam.camRX += gp.axes[1]/2
//	this.cam.camd = gp.faxes[1]*this.poxp.pox.setting.scale *0.1
	if(this.cam.camMode=="walk") {
		let sc = 0.01*this.poxp.pox.setting.scale ;
		let vd = (-gp.axes[1]*sc)

			let ry = this.cam.camRY ;
			this.cam.vcx =  Math.sin(ry*this.RAD) * vd;
			this.cam.vcz = -Math.cos(ry*this.RAD)* vd ;	
	}
}
PoxPlayer.prototype.Camera.prototype.getMtx = function(scale,sf) {
	const cam = this.cam ;
	const can = this.render.wwg.can ;
	const dx = sf * cam.sbase * scale ;	// stereo base
	const aspect = can.width/(can.height*((sf)?2:1)) ;
	const ret = {};
//console.log(cam);
//console.log(cam.camRX+"/"+cam.camRY) ;
	let cx,cy,cz,upx,upy,upz,camX,camY,camZ,camd ;
	camX = 0 ,camY = 0, camZ = 0 ;
	if(!this.poxp.isVR) {
		if(cam.camMode=="fix") {
			cx = cam.camVX ;
			cy = cam.camVY ;
			cz = cam.camVZ ;
			upx = cam.camUPX ;
			upy = cam.camUPY ;
			upz = cam.camUPZ ;		
		}
		else if(cam.camMode=="vr" || cam.camMode=="walk") {
			// self camera mode 
			cx = Math.sin(cam.camRY*this.RAD)*1*Math.cos(cam.camRX*this.RAD)
			cy = -Math.sin(cam.camRX*this.RAD)*1 ; 
			cz = -Math.cos(cam.camRY*this.RAD)*1*Math.cos(cam.camRX*this.RAD)
			upx =0 ,upy = 1 ,upz = 0 ;		
		} else  {
		// bird camera mode 
			camd=  cam.camd*scale ;
			camX = -Math.sin(cam.camRY*this.RAD)*camd*Math.cos(cam.camRX*this.RAD)
			camY = Math.sin(cam.camRX*this.RAD)*camd ; 
			camZ = Math.cos(cam.camRY*this.RAD)*camd*Math.cos(cam.camRX*this.RAD)
			cx = 0 ,cy = 0, cz = 0 ;
			if(camd<0) {
				cx = camX*2 ;cy = camY*2 ;cz = camZ*2 ;
			}
			upx = 0.,upy = 1 ,upz = 0. ;
		}
	
		// for stereo
		if(dx!=0 && !this.poxp.isVR) {
			let xx =  upy * (camZ-cz) - upz * (camY-cy);
			let xy = -upx * (camZ-cz) + upz * (camX-cx);
			let xz =  upx * (camY-cy) - upy * (camX-cx);
			const mag = Math.sqrt(xx * xx + xy * xy + xz * xz);
			xx *= dx/mag ; xy *=dx/mag ; xz *= dx/mag ;
	//			console.log(dx+":"+xx+"/"+xy+"/"+xz)
			camX += xx ;
			camY += xy ;
			camZ += xz ;
			cx += xx ;
			cy += xy ;
			cz += xz ;
		}
	}
	let camM 
	if(this.poxp.isVR) {
		let frameData = new VRFrameData()
		this.poxp.vrDisplay.depthNear = cam.camNear 
		this.poxp.vrDisplay.depthFar = cam.camFar 

		this.poxp.vrDisplay.getFrameData(frameData)
		camM = new CanvasMatrix4()
		camM.translate(-cam.camCX,-cam.camCY,-cam.camCZ)
		camM.rotate(cam.camRY,0,1,0)
		camM.rotate(cam.camRX,1,0,0)
		camM.rotate(cam.camRZ,0,0,1)
		camM.multRight( new CanvasMatrix4((dx<0)?frameData.leftViewMatrix:frameData.rightViewMatrix))
		camM.multRight(new CanvasMatrix4( (dx<0)?frameData.leftProjectionMatrix:frameData.rightProjectionMatrix) )
	} else {
		camM = new CanvasMatrix4().lookat(camX+cam.camCX,camY+cam.camCY,camZ+cam.camCZ,
		cx+cam.camCX,cy+cam.camCY,cz+cam.camCZ, upx,upy,upz) ;
		if(cam.camAngle!=0) camM = camM.perspective(cam.camAngle,aspect, cam.camNear, cam.camFar)
		else camM = camM.pallarel(cam.camd,aspect, cam.camNear, cam.camFar) ;
	}
//	console.log(camM)
	return {camX:camX,camY:camY,camZ:camZ,camM:camM} ;
}