/* action dispatcher */
var listeners=[];
var getters={};

var eventqueue=[];
var running=false;

var fireEvent=function(){
	if (eventqueue.length===0) {
		running=false;
		return;
	}
	running=true;

	var task=eventqueue.pop();
	var func=task[0], opts=task[1], cb=task[2], context=task[3];

	if (func.length>1){
		func.call(context,opts,function(err,res,res2){
			cb&&cb(err,res,res2);
			setTimeout(fireEvent,0);
		});
	} else { //sync func
		func.call(context,opts);
		setTimeout(fireEvent,0);
	}
}

var queueTask=function(func,opts,cb,context) {
	eventqueue.unshift([func,opts,cb,context]);
	if (!running) setTimeout(fireEvent,0);
}

var action=function(evt,opts,cb){
	for (var i=0;i<listeners.length;i+=1) {
		var listener=listeners[i];
		if (evt===listener[1] ) {
			if (listener[2]==undefined) {
				console.error("action has no callback",evt,listener);
			}
			queueTask( listener[2], opts,cb  , listener[0]);
		}
	}
}

var getter=function(name,opts,cb){ // sync getter
	if (getters[name]) {
		return getters[name](opts,cb);
	} else {
		console.error("getter '"+name +"' not found");
	}
}
var hasGetter=function(name) {
	return (!!getters[name]);
}
var registerGetter=function(name,cb,opts){
	opts=opts||{};
	if (!cb && name) delete getters[name];
	else {
		if (getters[name] && !opts.overwrite) {
			console.error("getter name "+name+" overwrite.");
		}
		getters[name]=cb;
	} 
}
var unregisterGetter=function(name) {
	registerGetter(name);
}

var store={
	listen:function(event,cb,element){
		listeners.push([element,event,cb]);
	}
	,unlistenAll:function(element){
		if (!element) {
			console.error("unlistenAll should specify this")
		}
		listeners=listeners.filter(function(listener){
			return (listener[0]!==element) ;
		});
	}
}

module.exports={ action, store, getter, registerGetter, unregisterGetter, hasGetter};