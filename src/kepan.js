var KepanMarker="-";
var serialize=require("./serialize");

var  buildtoc=function(toc) {
  if (!toc || !toc.length) return;  
    var depths=[];
    var prev=0;
    for (var i=0;i<toc.length;i++) {
      var depth=toc[i].d;
      if (prev>depth) { //link to prev sibling
        if (depths[depth]) {
          toc[depths[depth]].n = i;
          toc[i].p=depths[depth];
        }
        for (var j=depth;j<prev;j++) depths[j]=0;
      }
      if (i<toc.length-1 && toc[i+1].d>depth) {
        toc[i].child=true;
      }
      depths[depth]=i;
      prev=depth;
    } 
};

var getLevelName=function(level) {
    //return level;
    return " 甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥"[level];
}
var createMarker=function(caption,type){
    var marker = document.createElement('span');
    marker.className = type;
    marker.innerHTML = caption;
    return marker;
}

var markKepanGroup=function(doc,s,l,str,levels,markerCleared){
  var nodes=str.substr(1).split(KepanMarker);
  var upper=0,prevlevel=levels.length;
  var len=KepanMarker.length; //first kepanMarker

  for (var i=0;i<nodes.length;i++) {
    var start=doc.posFromIndex(s+len-1);
    var end=doc.posFromIndex(s+len);
    if (i) {
      levels.push(0);
    }
    var caption=str.substr(len,nodes[i].length);
    var up=0;
    if (i==0) { //check leading number to upper level
      var up=caption.match(/^\d+/);
      var errorclassname="";
      if (up) {
        end=doc.posFromIndex(s+len+up.length);        
        up=parseInt(up[0],10);
        if (up+1>levels.length) {
          levels.length=1;
          errorclassname="kepan_error";
        } else {
          levels.length=levels.length-up;
        }
      }
    }

    levels[levels.length-1]++;
    //text is s+len till s+len+nodes[i].length
    var seq=(levels[levels.length-1]);
    var label=getLevelName(levels.length)+seq;
    var kepanmarker=createMarker(label,errorclassname||"kepan kepan"+levels.length);
    var marker=doc.markText(start,end,{className:"kepan",clearOnEnter:true,replacedWith:kepanmarker});
    if (markerCleared) {
      marker.on('clear', function(m){
        markerCleared();
      });
    }
    toc.push({d:levels.length,start:s+len,end:s+len+nodes[i].length,t:caption});
    len+=KepanMarker.length+nodes[i].length;
  }
}

var toc=[];
var markKepan=function(content,doc,author,markerCleared){
    toc=[{d:0,start:0,end:0}];
    
    var comments=serialize.extractComment(content,doc,author);
    var text=doc.getValue();
    var levels=[0];
    for (var i=0;i<comments.length;i++) {
      var s=comments[i][0],l=comments[i][1];
      while (s<text.length&&text[s]=="\n") {
        s++;l--
      }
      if (l<1)continue;
      var str=text.substr(s,l);
      if (str[0]!=KepanMarker) continue;
      markKepanGroup(doc,s,l,str,levels,markerCleared);
    }
    buildtoc(toc);
}
var findNearestTocNode=function(offset){
  for (var i=0;i<toc.length;i++) {
    if (toc[i].start>offset) return i-1;
  }
  return 0;
}
var nextKepan=function(doc,offset){
  var i=findNearestTocNode(offset);
  if (i<0) return;
  if (toc[i].n) return toc[toc[i].n].end;
  else if (toc[i+1].d==toc[i].d) return toc[i+1].end;
  else return 0;
}
var prevKepan=function(doc,offset){
  var i=findNearestTocNode(offset);
  if (i<0) return;

  if (toc[i].p) return toc[toc[i].p].end;
  else if (toc[i-1].d==toc[i].d) return toc[i-1].end;
  else return 0;
}
module.exports={buildtoc,nextKepan,prevKepan,KepanMarker,markKepan};