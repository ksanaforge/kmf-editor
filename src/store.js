var files={"1n8":require("../data/1n8"), dn33:require("../data/dn33")
,"ds":require("../data/ds"),"amitaba":require("../data/amitaba")};
var filename="1n8";

var written=JSON.parse(localStorage.getItem(filename)||"null");
var content= written || files[filename];

//build P tags by crlf
var autoP=function(text){
	var tags=[],lastidx=0;
	text.replace(/\r?\n/g,function(m,idx){
		if (lastidx) tags.push([lastidx,idx-lastidx,"p"]);
		lastidx=idx;
	});
	tags.push([lastidx,text.length-lastidx,"p"]);
	return tags;
}
if (!files.ds.tags||!files.ds.tags.length) files.ds.tags=autoP(files.ds.text);
if (!files.amitaba.tags||!files.amitaba.tags.length) files.amitaba.tags=autoP(files.amitaba.text);


var {standoffutils,tagutils}=require("ksana-master-format");

var {action,store,getter,registerGetter,unregisterGetter}=require("./model");
var self={};
var author="";

registerGetter("content",function(){
	return content;
});

registerGetter("filename",function(){
	return filename;
});

registerGetter("author",function(){
	return author;
})

store.listen("write",function(){
	action("commitTouched",{},function(){
		localStorage.setItem(filename,JSON.stringify(content));
		alert("Written to localstorage")
	});
});

store.listen("reset",function(){
	var written=JSON.parse(localStorage.getItem(filename)||"null");
  content= written || files[filename];	

	action("content",{text:content.text,tags:content.tags,mode:"",author:""});
	alert("click Save to permanently lost your changes");
});

var buildAnnotation=function(opts,content){
	var {text,tags}=standoffutils.layout(content,opts.tag);
	text=require("./annotation").insertBr(content,text,tags,opts.author);
	text=require("./annotation").insertComment(content,text,tags,opts.author);

	return {text,tags};
}

store.listen("mode",function(opts){
	action("commitTouched",{},function(){
		setTimeout(function(){//return before firing another action
			if (opts.filename && opts.filename!==filename) {
				filename=opts.filename;

				var written=JSON.parse(localStorage.getItem(filename)||"null");
  			content= written || files[filename];	
			}

			if (opts.tag) { //annotation mode
				var {text,tags}=buildAnnotation(opts,content);

				author=opts.author;
				action("content",{text,tags,mode:opts.tag,author:opts.author});
			} else { //raw mode
				action("content",{text:content.text,tags:content.tags,mode:"",author:opts.author});
			}
		},50);
	});
});