var {getter}=require("./model");

var saveRaw=function(content,doc,cb){
	var tags=[];
	var marks=doc.getAllMarks();

	for (var i=0;i<marks.length;i++) {
		var mark=marks[i];
		var pos=marks[i].find();

		if (pos.from) {
			var start=doc.indexFromPos(pos.from);
			var end=doc.indexFromPos(pos.to);
			tags.push([start,end-start,mark.elementName||mark.className,mark.payload]);
		} else { //
			var start=doc.indexFromPos(pos);
			tags.push([start,0,mark.elementName||mark.className,mark.payload]);
		}
	}

	var text=doc.getValue();
	content.text=text;
	content.tags=tags;

	cb(content);
}

var createCommentTag=function(content,comments,author) {
	var tags=content.tags.filter(function(t){return !t[3] || t[3].author!==author });

	for (var i=0;i<comments.length;i++) {
		var comment=comments[i]
		tags.push([comment[0],0,"comment",{text:comment[1],author} ]);
	}

	tags.sort((t1,t2)=> t1[0]-t2[0] );
	content.tags=tags;
	//content.tags=tagutils.matchOpenCloseTag(tags);
}

var getUserBr=function(text,at,rawpos,author){
	if (text[at-1] && text[at-1]!=="\n" && text[at+1] && text[at+1]!=="\n") {
		return [rawpos,0,"br",{author}];
	}
}
var saveComment=function(content,doc,author,cb){
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

	var out=[], userbr=[],last=0,text=doc.getValue();
	for (var i=0;i<markpos.length;i++) {
		var hasComment=false;
		var start=markpos[i][0],end=markpos[i][1];
		if (start>last) {
			for (var j=last;j<start;j++) { //ignore crlf
				if (text[j]!=="\n") {
					hasComment=true;
					break;
				} else {
					var rawpos=markpos[i][2]+ j -last; //position in rawtext
					var br=getUserBr(text,j,rawpos,author);
					if (br) userbr.push(br);
				}
			}
			if (hasComment) {
				var t=text.substring(last,start).replace(/\n/g,"");
				out.push([markpos[i][2], t]);
			}
		}
		last=end;
	}

	createCommentTag(content,out,author);


	content.tags=content.tags.concat(userbr);

	content.tags.sort((c1,c2)=>c1[0]-c2[0]);

	cb(content);
}


var save=function(opts,cb){
	var content=getter("content");
	var filename=getter("filename");
	if (opts.author==="") saveRaw(content,opts.doc,cb);
	else saveComment(content,opts.doc,opts.author,cb);
};


module.exports={save};