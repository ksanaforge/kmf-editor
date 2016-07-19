var React=require("react");
var E=React.createElement;
var fs=require("./socketfs");
var kcm=require("ksana-codemirror");
var CodeMirror=kcm.Component;
var PT=React.PropTypes;
var serialize=require("./serialize");
var KepanMarker="-";

var EditMain=React.createClass({
  getInitialState:function() {
  	var {text,tags}=this.context.getter("content");
    return {text,tags,mode:"",author:"",showComment:false};
  }
  ,contextTypes:{
  	store:PT.object.isRequired,
  	getter:PT.func.isRequired,
  	action:PT.func.isRequired
  }
  ,createMarker:function(author,type){
    var marker = document.createElement('span');
    marker.className= type;
    marker.innerHTML=author;
    return marker;
  }
  ,getLevelName:function(level) {
    return "甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥"[level-1];
  }
  ,markKepanGroup:function(s,l,str,level,seq){
    var nodes=str.substr(1).split(KepanMarker);
    var upper=0,prevlevel=level;
    var len=KepanMarker.length; //first kepanMarker

    for (var i=0;i<nodes.length;i++) {
      var start=this.doc.posFromIndex(s+len-1);
      var end=this.doc.posFromIndex(s+len);
      if (i) level++;
      var caption=str.substr(len,nodes[i].length);
      var up=caption.match(/^\d+/);
      var errorclassname="";
      if (up) {
        end=this.doc.posFromIndex(s+len+up.length);        
        up=parseInt(up[0],10);
        level-=up;
        if (level<1) {
          level=1;
          errorclassname="kepan_error";
        }
      }
      //text is s+len till s+len+nodes[i].length
      if (prevlevel==level) seq++;else seq=1;
      var kepanmarker=this.createMarker(this.getLevelName(level)+seq,errorclassname||"kepan");
      var marker=this.doc.markText(start,end,{className:"kepan",clearOnEnter:true,replacedWith:kepanmarker});
      marker.on('clear', function(m){
        this.kepanTouch=true;
      }.bind(this));

      len+=KepanMarker.length+nodes[i].length;
      
      prevlevel=level;
    }
    return {level,seq};
  }
  ,markKepan:function(author){
    this.doc.getAllMarks().map(function(m){if (m.className=="kepan") m.clear()});
    author=author||this.state.author;
    if (!author) return;
    var content={text:this.state.text,tags:this.state.tags};
    var comments=serialize.extractComment(content,this.doc,author);
    var text=this.doc.getValue();
    var level=1,seq=1;
    for (var i=0;i<comments.length;i++) {
      var s=comments[i][0],l=comments[i][1];
      while (s<text.length&&text[s]=="\n") {
        s++;l--
      }
      if (l<1)continue;
      var str=text.substr(s,l);
      if (str[0]!=KepanMarker) continue;
      var r=this.markKepanGroup(s,l,str,level,seq);
      level=r.level;seq=r.seq;
    }
    this.kepanTouch=false;
  }
  ,markText:function(tags){
    for (var i=0;i<tags.length;i++) {
      var tag=tags[i];
      if (tag[1]>0 ||(tag[1]==0 && (tag[2]=="comment"||tag[2]=="br") )) {
        var start=this.doc.posFromIndex( tag[0]);
        var end=this.doc.posFromIndex(tag[0]+tag[1]);
        var readOnly=tag[2]==="source";
        if (tag[1]==0) {//null tag
          if (this.state.showComment) {
            if (tag[2]=="comment") {
              var marker=this.createMarker(tag[3].text,"comment_"+tag[3].author);  
            } else {
              if (tag[2]=="br") {
                var marker=this.createMarker("⏎",tag[2]+"_"+tag[3].author);  
              } else {
                var marker=this.createMarker(tag[3].author,tag[2]);  
              }
            }
          } else {
            var marker=this.createMarker("",tag[2]);            
          }
        	
        	//this.doc.setBookmark(start,{widget:marker,payload:tag[3]});
        	//https://github.com/codemirror/CodeMirror/issues/3600
        	this.doc.markText(start,end,{className:tag[2],
        		replacedWith:marker,type:"bookmark",payload:tag[3],clearWhenEmpty:false});
        } else { //tag with len
        	this.doc.markText(start,end,{className:tag[2],readOnly,payload:tag[3]});	
        }        
      }  else {
        var marker = document.createElement('span');
        marker.className= "tag";
        marker.innerHTML="<";

        if (tag[2][0]=="/") marker.innerHTML=">"
        if (tag[2][tag[2].length-1]=="/") marker.innerHTML="&#8823;"
        var start=this.doc.posFromIndex( tag[0]);
        this.doc.markText(start,start,
        	{elementName:tag[2],replaceWith:marker,type:"bookmark",clearWhenEmpty:false,payload:tag[3]});
      }
    }
  }
  ,componentDidMount:function(){
    this.editor=this.refs.cm.getCodeMirror();
    this.doc=this.editor.doc;
    this.editor.focus();
    this.doc.getAllMarks().map((m)=>m.clear());
    this.markText(this.state.tags);
    this.markKepan();
    this.context.store.listen("content",this.onContent,this);
    this.context.store.listen("commitTouched",this.onCommitTouched,this);
    this.context.store.listen("toggleComment",this.onToggleComment,this);
  }
  ,componentWillUnmount:function(){
  	this.context.store.unlistenAll(this);
  }
  ,onToggleComment:function(){
    this.setState({showComment:!this.state.showComment},function(){
      this.doc.getAllMarks().map((m)=>m.clear());
      this.markText(this.state.tags);
      this.markKepan();
    }.bind(this));
  }
  ,onContent:function(content){
  	this.doc.getAllMarks().map((m)=>m.clear());
  	this.setState({text:content.text,tags:content.tags,author:content.author});
  	this.doc.setValue(content.text);
    this.markText(content.tags);
    this.markKepan(content.author);
    this.touched=false;
  }
  ,onCommitTouched:function(opts,cb){
  	if (this.touched) {
  		serialize.save({author:this.state.author,doc:this.doc},function(){
  			this.touched=false;
  			cb();
  		}.bind(this))
  	} else {
  		cb();
  	}
  }
  ,onKeyDown:function(cm,evt) {
    var pos=this.doc.getCursor();
	  var markers=this.doc.findMarksAt(pos);

  	if (evt.keyCode==13 && this.state.author ) {
  		if (markers.map((m)=>m.className).indexOf("p")>-1) {
  			//alert("cannot break at beginning of paragraph");
  			evt.preventDefault();
  			return;
  		}
  		if (markers.length==1 && markers[0].className=="source"){
  			var text=this.doc.getValue();
  			var index=this.doc.indexFromPos(pos);
  			if (pos.ch>0 && text[index+1]!=="\n") {
  				this.breakSource(markers[0],pos);	
  				return;
  			}
	  	  evt.preventDefault();  			
  		}
  	};

  	if (evt.keyCode==8) {
  		if (markers.map((m)=>m.className).indexOf("p")>-1) {
  			//alert("cannot delete a p");
  			evt.preventDefault();
  			return;
  		}  		
  	}
  }
  ,onKeyUp:function(cm,evt){
  }
  ,onChange:function(cm,obj){
    if (obj.text.length && obj.text[0].indexOf(KepanMarker)>-1) {
      this.kepanTouch=true;
    }
    if (obj.removed.length && obj.removed[0].indexOf(KepanMarker)>-1) {
      this.kepanTouch=true;
    }
  	this.touched=true;
  }
  ,breakSource:function(marker,at) { //break marker into two, to allow input
    var pos=marker.find();
    var py=marker.payload||{};
    var part1len=at.ch-pos.from.ch;
    this.doc.markText(pos.from , at ,{className:marker.className,readOnly:true,payload:{s:py.s}});
    this.doc.markText(at , pos.to , {className:marker.className,readOnly:true,payload:{s:py.s+part1len}});
    marker.clear();
  }
  ,onKeyPress:function(cm,evt) {
    var pos=this.doc.getCursor();
    var curline=this.doc.getLine(pos.line);
    if (pos.ch==curline.length) { //do not allow input at end of line
    	alert("cannot add comment at end of paragraph");
    	evt.preventDefault();
    	return;
    }
    var markers=this.doc.findMarksAt(pos);
    if (markers.length==1) {
      var m=markers[0];
      if (m.readOnly) this.breakSource(m,pos);
    }

  }  
  ,onLeaveKepan:function(cm){
    var cur=cm.doc.getCursor();
    var markers=cm.doc.findMarksAt(cur);
    markers=markers.filter(function(m){return m.className=="source"});
    //make sure not in source area
    if (markers.length && this.kepanTouch) {
        setTimeout(this.markKepan,100);
    }
  }
  ,onCursorActivity:function(cm){
    return this.onLeaveKepan(cm);
    //show tags is causing reflow
    return;
  	clearTimeout(this.timercursor);
  	this.timercursor=setTimeout(function(){
  		var cur=cm.doc.getCursor();
  		var markers=this.doc.findMarksAt(cur);
  		var tags=[];

  		for (var i=0;i<markers.length;i++) {
  			var marker=markers[i];
				var pos=marker.find();
				if (pos.from) {
  				var idx1=this.doc.indexFromPos(pos.from);
  				var idx2=this.doc.indexFromPos(pos.to);
  				tags.push([ idx1, idx2-idx1, marker.className, marker.payload  ]);
				} else {
					var idx1=this.doc.indexFromPos(pos);
					tags.push([ idx1, 0, marker.className, marker.payload  ]);
				}
  		}
  		this.context.action("showtag",tags); 
  	}.bind(this),200);
  }
	,render:function(){
	  return E(CodeMirror,{ref:"cm",value:this.state.text,theme:"ambiance"
	  				,onCursorActivity:this.onCursorActivity
	  				,onChange:this.onChange
	          ,onKeyUp:this.onKeyUp,onKeyDown:this.onKeyDown,onKeyPress:this.onKeyPress});

	}
});

module.exports=EditMain;
