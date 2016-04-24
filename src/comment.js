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

module.exports={insertComment};