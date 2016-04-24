/* this is slow , all tags will be touched, use it carefully*/
var insertText=function(newtags,newtext,at,t) {
	var fixSourceTag=function(){
		for (var i=0;i<newtags.length;i++) {
			if (newtags[i][0]>=at) {
				newtags[i][0]+=t.length;
			}
		}
	}

	newtext=newtext.substr(0,at)+t+newtext.substr(at);
	fixSourceTag();
	return newtext;
}


var findSource=function(sourcetags,sourcepos){
	for (i=0;i<sourcetags.length;i++) {
		if (sourcetags[i][2]!=="source") continue;
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
		newtext=insertText(newtags,newtext,start+offset,comment[3].text);
	}

	newtags.sort(function(t1,t2){return t1[0]-t2[0]});

	return newtext;
}

var insertBr=function(rawcontent,newtext,newtags,author){
	//find br of this user
	var brs=[];
	for (var i=0;i<rawcontent.tags.length;i++) {
		var tag=rawcontent.tags[i];
		if (tag[2]==="br" && tag[3] && tag[3].author===author) {
			brs.push(tag);
		}
	}
	brs.sort((b1,c2)=>b2[0]-b1[0]);
	for (var i=0;i<brs.length;i++) {

		var br=brs[i];
		var r=findSource(newtags,br[0]);
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

		//newtags.push([start+offset,0,"br",{s:part2s,author}]);
		newtext=insertText(newtags,newtext,start+offset,"\n");
	}

	newtags.sort(function(t1,t2){return t1[0]-t2[0]});

	return newtext;
}
module.exports={insertComment,insertBr};