var content=require("../data/1n8");
var {standoffutils,tagutils}=require("ksana-master-format");

var {action,store,getter,registerGetter,unregisterGetter}=require("./model");
var self={};

registerGetter("content",function(){
	return content;
});

var saveRaw=function(doc,cb){
	console.log("save Raw");
}

var createCommentTag=function(comments,author) {
	var tags=content.tags.filter(function(t){return !t[3] || t[3].author!==author });

	for (var i=0;i<comments.length;i++) {
		var comment=comments[i]
		tags.push([comment[0],0,"comment",{text:comment[1],author} ]);
	}

	tags.sort((t1,t2)=> t1[0]-t2[0] );
	content.tags=tags;
	//content.tags=tagutils.matchOpenCloseTag(tags);
}
var saveComment=function(doc,author,cb){
	//extract user text, assuming source mark is sorted.
	var marks=doc.getAllMarks(), markpos=[];

	//sort the source marks
	for (var i=0;i<marks.length;i++) {
		if (marks[i].className!=="source") continue;
		var pos=marks[i].find();
		var start=doc.indexFromPos(pos.from);
		var end=doc.indexFromPos(pos.to);
		var sourcepos=marks[i].payload.s;
		markpos.push([start,end, sourcepos]);
	}
	markpos.sort(function(m1,m2){return m1[0]-m2[0]});

	var out=[], last=0,text=doc.getValue();
	for (var i=0;i<markpos.length;i++) {
		var hasComment=false;
		var start=markpos[i][0],end=markpos[i][1];
		if (start>last) {
			for (var j=last;j<start;j++) { //ignore crlf
				if (text[j]!=="\n") {
					hasComment=true;
					break;
				}
			}
			if (hasComment) {
				var t=text.substring(last,start).replace(/\n/g,"");
				out.push([markpos[i][2], t]);
			}
		}
		last=end;
	}

	createCommentTag(out,author);
	cb(content);
}

store.listen("save",function(opts,cb){
	if (opts.author==="") saveRaw(opts.doc,cb);
	else saveComment(opts.doc,opts.author,cb);
});

var findSource=function(sourcetags,sourcepos){
	for (i=0;i<sourcetags.length;i++) {
		var sourcetag=sourcetags[i];
		var start=sourcetag[3].s, end=start+sourcetag[1];
		if (start<=sourcepos && end>=sourcepos) {
			return {start:sourcetag[0],offset:sourcepos-start, sourcetag};
		};
	}
	//not inside source tag
}
var insertComment=function(rawcontent,newtext,newtags,author){

	var comments=[];
	for (var i=0;i<rawcontent.tags.length;i++) {
		var tag=rawcontent.tags[i];
		if (tag[2]!=="comment") continue;
		var payload=tag[3];
		if (payload.author===author) {
			comments.push(tag);
		} else { //other people comment , put a bookmark

		}
	}

	comments.sort((c1,c2)=>c2[0]-c1[0]);


	var insertText=function(text,at,comment) {
		var fixSourceTag=function(){
			for (var i=0;i<newtags.length;i++) {
				if (newtags[i][0]>=at) {
					newtags[i][0]+=comment.length;
				}
			}
		}

		text=text.substr(0,at)+comment+text.substr(at);
		fixSourceTag();
		return text;
	}


	for (var i=0;i<comments.length;i++) {
		var comment=comments[i];
		var r=findSource(newtags,comment[0]);
		if (!r) continue;
		var {start,offset,sourcetag}=r;
		if (offset!==0) { //break source tag
			var part2s=sourcetag[3].s+offset;
			var part2len=sourcetag[1]-offset;
			if (part2len) {
				sourcetag[1]=offset;
				newtags.push([start+offset,part2len,"source",{s:part2s}])
			}
		}
		newtext=insertText(newtext,start+offset,comment[3].text);
	}

	newtags.sort(function(t1,t2){return t1[0]-t2[0]});

	return newtext;
}
store.listen("mode",function(opts){
	if (opts.tag) { 
		var {text,tags}=standoffutils.layout(content,opts.tag);
		text=insertComment(content,text,tags,opts.author);

		action("content",{text,tags,mode:opts.tag,author:opts.author});
	} else { //raw mode
		action("content",{text:content.text,tags:content.tags,mode:"",author:opts.author});
	}
});