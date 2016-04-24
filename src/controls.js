var React=require("react");
var E=React.createElement;
var PT=React.PropTypes;
var Controls=React.createClass({
	contextTypes:{
		action:PT.func.isRequired
	}
	,onRawMode_chi:function(){
		this.context.action("mode",{tag:"",author:"",filename:"1n8"});
	}
	,onRawMode_pali:function(){
		this.context.action("mode",{tag:"",author:"",filename:"dn33"});
	}
	,onPMode1:function(){
		this.context.action("mode",{tag:"p",author:"u1"});
	}
	,onPMode2:function(){
		this.context.action("mode",{tag:"p",author:"u2"});
	}
	,onWrite:function(){
		this.context.action("write");
	}
	,onReset:function(){
		this.context.action("reset");	
	}
	,render:function(){
		return E("span",{},
				E("button",{style:styles.rawmode,onClick:this.onRawMode_chi},"DA8")
			,	E("button",{style:styles.rawmode,onClick:this.onRawMode_pali},"DN33")
			, E("button",{style:styles.pmode,onClick:this.onPMode1},"User 1")
			, E("button",{style:styles.pmode,onClick:this.onPMode2},"User 2")
			, E("span",{}," ")
			, E("button",{style:styles.pmode,onClick:this.onWrite},"Write")
			, E("button",{style:styles.pmode,onClick:this.onReset},"Reset")
			);

	}
});
var styles={
	rawmode:{fontSize:24,width:200},
	pmode:{fontSize:24,width:200}
}
module.exports=Controls