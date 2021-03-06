var React=require("react");
var E=React.createElement;
var fs=require("./socketfs");
var kcm=require("ksana-codemirror");
var CodeMirror=kcm.Component;
var PT=React.PropTypes;
var serialize=require("./serialize");
var kepan=require("./kepan");

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
  ,markerCleared:function(){
    this.kepanTouch=true;
  }
  ,markKepan:function(author){
    this.doc.getAllMarks().map(function(m){if (m.className=="kepan") m.clear()});
    author=author||this.state.author;
    if (!author) return;
    var content={text:this.state.text,tags:this.state.tags};
    var remain=kepan.markKepan(content,this.doc,author,this.markerCleared);
    if (!remain) this.kepanTouch=false;
  }
  ,markText:function(tags){
    for (var i=0;i<tags.length;i++) {
      var tag=tags[i],tagstart=tag[0],taglen=tag[1],tagtype=tag[2],payload=tag[3];
      if (taglen>0 ||(taglen==0 && (tag[2]=="comment"||tag[2]=="br") )) {
        var start=this.doc.posFromIndex( tagstart);
        var end=this.doc.posFromIndex(tagstart+taglen);
        var readOnly=tagtype==="source";
        if (taglen==0) {//null tag
          if (this.state.showComment) {
            if (tagtype=="comment") {
              var marker=this.createMarker(payload.text,"comment_"+payload.author);  
            } else {
              if (tagtype=="br") {
                var marker=this.createMarker("⏎",tagtype+"_"+payload.author);  
              } else {
                var marker=this.createMarker(payload.author,tag[2]);  
              }
            }
          } else {
            var marker=this.createMarker("",tagtype);            
          }
        	
        	//this.doc.setBookmark(start,{widget:marker,payload:tag[3]});
        	//https://github.com/codemirror/CodeMirror/issues/3600
        	this.doc.markText(start,end,{className:tagtype,
        		replacedWith:marker,type:"bookmark",payload,clearWhenEmpty:false});
        } else { //tag with len
        	this.doc.markText(start,end,{className:tagtype,readOnly,payload});	
        }        
      }  else {
        var marker = document.createElement('span');
        marker.className= "tag";
        marker.innerHTML="<";

        if (tagtype[0]=="/") marker.innerHTML=">"
        if (tagtype[tagtype.length-1]=="/") marker.innerHTML="&#8823;"
        var start=this.doc.posFromIndex( tag[0]);
        this.doc.markText(start,start,
        	{elementName:tagtype,replaceWith:marker,type:"bookmark",clearWhenEmpty:false,payload});
      }
    }
  }
  ,jump:function(cm,func){
    var pos=cm.doc.getCursor();
    if (pos.from) pos=pos.from;
    var idx=cm.doc.indexFromPos(pos);
    var n=func(cm.doc,idx);
    if (n) cm.doc.setCursor(  cm.doc.posFromIndex(n) );
  }
  ,setHotkeys:function(cm){
    var jump=this.jump;
    cm.setOption("extraKeys", {
      "Ctrl-,": function(cm) {
        jump(cm,kepan.prevKepan);
      },
      "Ctrl-.": function(cm) {
        jump(cm,kepan.nextKepan);
      }
      ,"Ctrl-/": function(cm) {
        jump(cm,kepan.parentKepan);
      }      
    });
  }
  ,componentDidMount:function(){
    this.editor=this.refs.cm.getCodeMirror();
    this.setHotkeys(this.editor);
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

  	if (evt.keyCode==8 && this.state.author) {
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
    if (obj.text.length && obj.text[0].indexOf(kepan.KepanMarker)>-1) {
      this.kepanTouch=true;
    }
    if (obj.removed.length && obj.removed[0].indexOf(kepan.KepanMarker)>-1) {
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
        setTimeout(this.markKepan,300);
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
