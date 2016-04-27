var files={"1n8":require("../data/1n8"), dn33:require("../data/dn33")};
var filename="1n8";

var written=JSON.parse(localStorage.getItem(filename)||"null");
var content= written || files[filename];


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
	content=files[filename];
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
				content=files[filename];
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