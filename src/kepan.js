var KepanMarker="-";
var serialize=require("./serialize");


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
    var upwidth=0; //level up width, prevent clearOnEnter when moving around
    if (i==0) { //check leading number to upper level
      var up=caption.match(/^\d+/);
      var errorclassname="";
      if (up) {
        upwidth=up[0].length;
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
    toc.push([levels.length,s+len+upwidth,caption]);
    len+=KepanMarker.length+nodes[i].length;
  }
}

var toc=[];
var markKepan=function(content,doc,author,markerCleared){
    toc=[];
    var remaining=0;//if have remaining, render is not complete, need another call
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
      //only KepanMarker
      if (str[0]!=KepanMarker ) continue;
      if (str.length==KepanMarker.length) {
        //do not render now, wait for user input a digit for upper level.
        remaining++;
        continue;
      }

      markKepanGroup(doc,s,l,str,levels,markerCleared);
    }
    if (remaining) console.log("remaining",remaining)
    return remaining;
}
var findNearestTocNode=function(offset){
  for (var i=0;i<toc.length;i++) {
    if (toc[i][1]>offset)return i-1;
  }
  return toc.length-1;
}
var getSiblings=function(n){
  var depth=toc[n][0],i;
  var out=[];
  for (i=n-1;i>=0;i--) {
    var d=toc[i][0];
    if (d<depth) break;
    else if (d===depth) out.unshift(i);
  }
  for (i=n;i<toc.length;i++) {
    var d=toc[i][0];
    if (d<depth) break;
    else if (d===depth) out.push(i);
  }
  return out;
}
var nextKepan=function(doc,offset){
  var n=findNearestTocNode(offset);
  if (n<0) return;
  var siblings=getSiblings(n);
  var at=siblings.indexOf(n);
  if (at<siblings.length-1) return toc[siblings[at+1]][1];
  else return toc[siblings[0]][1];
}
var prevKepan=function(doc,offset){
  var n=findNearestTocNode(offset);
  if (n<0) return;
  var siblings=getSiblings(n);
  var at=siblings.indexOf(n);
  if (at>0) return toc[siblings[at-1]][1];
  else return toc[siblings[siblings.length-1]][1];
}
var parentKepan=function(doc,offset){
  var n=findNearestTocNode(offset);
  if (n<0) return;
  var d=toc[n][0];
  for (var i=n-1;i>0;i--) {
    if (toc[i][0]<d) return toc[i][1];
  }
}
module.exports={nextKepan,prevKepan,KepanMarker,markKepan,parentKepan};