var React=require("react");
var E=React.createElement;
var fs=require("./socketfs");
var kcm=require("ksana-codemirror");
var CodeMirror=kcm.Component;
var PT=React.PropTypes;

var EditMain=React.createClass({
  getInitialState:function() {
  	var content=this.context.getter("content");
    return {text:content.text,tags:content.tags,mode:"",author:""};
  }
  ,contextTypes:{
  	store:PT.object.isRequired,
  	getter:PT.func.isRequired,
  	action:PT.func.isRequired
  }
  ,createCommentMarker:function(author){
    var marker = document.createElement('span');
    marker.className= "comment";
    marker.innerHTML=author;
    return marker;
  }
  ,markText:function(tags){
    for (var i=0;i<tags.length;i++) {
      var tag=tags[i];
      if (tag[1]>0 ||(tag[1]==0 &&tag[2]=="comment")) {
        var start=this.doc.posFromIndex( tag[0]);
        var end=this.doc.posFromIndex(tag[0]+tag[1]);
        var readOnly=tag[2]==="source";
        if (tag[1]==0) {
        	var marker=this.createCommentMarker(tag[3].author);
        	//this.doc.setBookmark(start,{widget:marker,payload:tag[3]});
        	//https://github.com/codemirror/CodeMirror/issues/3600
        	this.doc.markText(start,end,{className:tag[2],
        		replacedWith:marker,type:"bookmark",payload:tag[3],clearWhenEmpty:false});
        } else {
        	this.doc.markText(start,end,{className:tag[2],readOnly,payload:tag[3]});	
        }
        
      }  else {
        var marker = document.createElement('span');
        marker.className= "tag";
        marker.innerHTML="<";
        if (tag[2][0]=="/") marker.innerHTML=">"
        if (tag[2][tag[2].length-1]=="/") marker.innerHTML="&#8823;"
        var start=this.doc.posFromIndex( tag[0]);
        this.doc.setBookmark(start,{widget:marker});
      }
    }
  }
  ,componentDidMount:function(){
    this.editor=this.refs.cm.getCodeMirror();
    this.doc=this.editor.doc;
    this.editor.focus();
    this.markText(this.state.tags);
    this.context.store.listen("content",this.onContent,this);
  }
  ,componentWillUnmount:function(){
  	this.context.store.unlistenAll(this);
  }
  ,updateContent:function(content){
  	this.doc.getAllMarks().map((m)=>m.clear());
  	this.setState({text:content.text,tags:content.tags,mode:content.mode,author:content.author});
  	this.doc.setValue(content.text);
    this.markText(content.tags);
    this.touched=false;
  }
  ,onContent:function(content){
  	if (this.touched) {
  		this.context.action("save",{author:this.state.author,doc:this.doc},function(newcontent){
  			content.tags=newcontent.tags; //this is bad
  			content.text=newcontent.text;
  			this.updateContent(content);
  		}.bind(this));
  	} else this.updateContent(content);
  	
  }
  ,onKeyDown:function(cm,evt) {
  	if (evt.keyCode==13) {
  		evt.preventDefault();
  		return;
  	};
  }
  ,onKeyUp:function(cm,evt){
  }
  ,onChange:function(){
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
    var markers=this.doc.findMarksAt(pos);
    if (markers.length==1) {
      var m=markers[0];
      if (m.readOnly) this.breakSource(m,pos);
    }

  }  
  ,onCursorActivity:function(cm){
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
