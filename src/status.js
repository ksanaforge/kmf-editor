var React=require("react");
var E=React.createElement;
var PT=React.PropTypes;

var Status=React.createClass({
	contextTypes:{
		store:PT.object.isRequired
	}
	,getInitialState:function(){
		return {tags:[]}
	}
	,componentDidMount:function(){
		this.context.store.listen("showtag",this.onShowTag,this);
	}
	,onShowTag:function(tags) {
		this.setState({tags});
	}
	,componentWillUmount:function(){
		this.context.store.unlistenAll(this);
	}
	,renderItem:function(item,key) {
		return E("span",{key},JSON.stringify(item));
	}
	,render:function(){
		return E("span",{}, this.state.tags.map(this.renderItem));
	}
});
module.exports=Status;