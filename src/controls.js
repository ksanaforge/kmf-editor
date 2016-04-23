var React=require("react");
var E=React.createElement;
var PT=React.PropTypes;
var Controls=React.createClass({
	contextTypes:{
		action:PT.func.isRequired
	}
	,onRawMode:function(){
		this.context.action("mode",{tag:"",author:""});
	}
	,onPMode1:function(){
		this.context.action("mode",{tag:"p",author:"u1"});
	}
	,onPMode2:function(){
		this.context.action("mode",{tag:"p",author:"u2"});
	}
	,render:function(){
		return E("span",{},
				E("button",{style:styles.rawmode,onClick:this.onRawMode},"Raw mode")
			, E("button",{style:styles.pmode,onClick:this.onPMode1},"User 1")
			, E("button",{style:styles.pmode,onClick:this.onPMode2},"User 2")
			);
	}
});
var styles={
	rawmode:{fontSize:24,width:200},
	pmode:{fontSize:24,width:200}
}
module.exports=Controls