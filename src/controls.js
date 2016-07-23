var React=require("react");
var E=React.createElement;
var PT=React.PropTypes;
var Controls=React.createClass({
	contextTypes:{
		action:PT.func.isRequired,
		getter:PT.func.isRequired
	}
	,getInitialState:function(){
		return {filename:"1n8",author:""};
	}
	,onRawMode_chi:function(){
		this.context.action("mode",{tag:"",author:"",filename:"1n8"});
		this.setState({filename:"1n8",author:""});
	}
	,onRawMode_ds:function(){
		this.context.action("mode",{tag:"",author:"",filename:"ds"});
		this.setState({filename:"ds",author:""});
	}
	,onRawMode_pali:function(){
		this.context.action("mode",{tag:"",author:"",filename:"dn33"});
		this.setState({filename:"dn33",author:""});
	}
	,onPMode1:function(){
		this.context.action("mode",{tag:"p",author:"u1"});
		this.setState({author:"u1"});
	}
	,onPMode2:function(){
		this.context.action("mode",{tag:"p",author:"u2"});
		this.setState({author:"u2"});
	}
	,onToggleComment:function(){
		this.context.action("toggleComment");
	}
	,onWrite:function(){
		this.context.action("write");
	}
	,onReset:function(){
		this.context.action("reset");	
	}
	,render:function(){
		var u1style=JSON.parse(JSON.stringify(styles.pmode));
		Object.assign(u1style,this.state.author=="u1"?styles.selected:null);
		var u2style=JSON.parse(JSON.stringify(styles.pmode));
		Object.assign(u2style,this.state.author=="u2"?styles.selected:null);

		var f1style=JSON.parse(JSON.stringify(styles.rawmode));
		Object.assign(f1style,this.state.filename=="1n8"?styles.selected:null);
		var f3style=JSON.parse(JSON.stringify(styles.rawmode));
		Object.assign(f3style,this.state.filename=="ds"?styles.selected:null);
		var f2style=JSON.parse(JSON.stringify(styles.rawmode));
		Object.assign(f2style,this.state.filename=="dn33"?styles.selected:null);
		var cantogglecomment=!!this.state.author;
		return E("span",{},
				E("button",{style:f1style,onClick:this.onRawMode_chi},"DA8")
			,	E("button",{style:f3style,onClick:this.onRawMode_ds},"DS")
			,	E("button",{style:f2style,onClick:this.onRawMode_pali},"DN33")
			, E("button",{disabled:cantogglecomment,style:styles.comment,onClick:this.onToggleComment},"comment")
			, E("button",{style:u1style,onClick:this.onPMode1},"User 1")
			, E("button",{style:u2style,onClick:this.onPMode2},"User 2")
			, E("span",{}," ")
			, E("button",{style:styles.pmode,onClick:this.onWrite},"Save")
			, E("button",{style:styles.pmode,onClick:this.onReset},"Reset")
			);

	}
});
var styles={
	rawmode:{fontSize:24,width:150},
	pmode:{fontSize:24,width:150},
	comment:{fontSize:24},
	selected:{color:"green"}
};
module.exports=Controls