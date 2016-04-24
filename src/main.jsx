var React=require("react");
var E=React.createElement;
var fs=require("./socketfs");
var kcm=require("ksana-codemirror");
var CodeMirror=kcm.Component;
var EditMain=require("./editmain");
var Controls=require("./controls");
var Status=require("./status");
var PT=React.PropTypes;
var store=require("./store");


var {action,store,getter,registerGetter,unregisterGetter}=require("./model");

var maincomponent = React.createClass({
  childContextTypes: {
    store: PT.object
    ,action: PT.func
    ,getter: PT.func
    ,registerGetter:PT.func
    ,unregisterGetter:PT.func
  }
  ,getChildContext:function(){
    return {action,store,getter,registerGetter,unregisterGetter};
  }
  ,render: function() {
    return E("div",{},
        E(Controls),E(Status),
        E(EditMain)
      );
  }
});
module.exports=maincomponent;