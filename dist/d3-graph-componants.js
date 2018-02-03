(function(global, factory) {
	if (typeof global.d3 !== 'object' || typeof global.d3.version !== 'string')
		throw new Error('repo requires d3v4');
	var v = global.d3.version.split('.');
	if (v[0] != '4')
		throw new Error('repo requires d3v4');
	if (typeof global.bs !== 'object' || typeof global.bs.version !== 'string')
		throw new Error('dgc require d3-Bootstrap');
	
	factory(global.dgc = global.gdc || {}, d3, global);
})(this, (function(dgc, d3, global) {
	// private data
	d3.dispatch.prototype.register = function() {
		for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
			if (!(t = arguments[i] + "") || (t in this._)) throw new Error("illegal type: " + t);
			this._[t] = [];
		}
	}

	// api definition
	dgc.core = dgc.core || { }
	dgc.core.format = dgc.core.format || { }
	dgc.core.format.fileSize = d3.format(".2s");
	dgc.core.format.number	= bs.api.format.number;
	dgc.core.format.locale = d3.timeFormatLocale({
				"dateTime": "%A, le %e %B %Y, %X",
				"date": "%Y-%m-%d",
				"time": "%H:%M",
				"periods": ["AM", "PM"],
				"days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
				"shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
				"months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
				"shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
	});
	dgc.core.format.dateAxe	= function(date) {
		var 	local			= dgc.core.format.locale,
			formatMillisecond	= locale.format(".%L"),
			formatSecond		= locale.format(":%S"),
			formatMinute		= locale.format("%X"),
			formatHour		= locale.format("%X"),
			formatDay		= locale.format("%x"),
			formatWeek		= locale.format("%x"),
			formatMonth		= locale.format("%x"),
			formatYear		= locale.format("%Y");
		return (d3.timeSecond(date) < date ? formatMillisecond
			: d3.timeMinute(date) < date ? formatSecond
			: d3.timeHour(date) < date ? formatMinute
			: d3.timeDay(date) < date ? formatHour
			: d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
			: d3.timeYear(date) < date ? formatMonth
			: formatYear)(date);
	}
	dgc.core.format.date	= function(date) {
		return dgc.core.format.locale.format("%x %X")(date);
	}
	dgc.core.base = function() {
		var data = {}, called = false, ready=false, root, src;
		function base(s) { called=true; s.each(base.init); return base; }
		base.dispatch	= d3.dispatch("init", "renderUpdate", "dataUpdate");
		base.inited	= function() {return called; }
		base.ready	= function() {return ready; }
		base.init	= function() { 
			root = d3.select(this);
			base.dispatch.call("init");
			if (ready)
				base.dispatch.call("renderUpdate");
		}
		base.root	= function(_) {
			if (arguments.length) {
				root = _;
				return base;
			} else if (base.inited())
				return root; 
			else
				return false;
		}
		base.data	= function(_) { 
			if (!arguments.length) return data;
			data = _;
			ready=true;
			base.dispatch.call("dataUpdate");
			if (called)
				base.dispatch.call("renderUpdate");
			return base;
		}
		base.source	= function(_) { 
			if (arguments.length) {
				src= _;
				d3.json(_, function(results) { base.data(results); })
				return base;
			}
			return src;
		}
		base.onTop = function(s) {
			return s.each(function(){ this.parentNode.appendChild(this); });
		}

		return base;
	}
	dgc.core.colored	= function(pClass, pColor) {
		var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.base(),
			color	= (typeof pColor!="undefined"&&pColor!=null)?pColor:d3.scaleOrdinal(d3.schemeCategory10);
		chart.dispatch.register("colorUpdate");
		chart.color	= function(_) { 
			if (!arguments.length) return color; color = _;
			chart.dispatch.call("colorUpdate");
			return chart;
		}
		return chart;
	}
	dgc.core.sized	= function(pClass, pW, pH) {
		var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.base(),
			width	= (typeof pW!="undefined"&&pW!=null)?pW:0, 
			height	= (typeof pH!="undefined"&&pH!=null)?pH:0;
		chart.dispatch.register("heightUpdate","widthUpdate");
		chart.width	= function(_) { 
			if (!arguments.length) return width; width = _;
			chart.dispatch.call("widthUpdate");
			return chart;
		}
		chart.height	= function(_) { 
			if (!arguments.length) return height; height = _;
			chart.dispatch.call("heightUpdate");
			return chart;
		}
		return chart;
	}
	dgc.core.minSized	= function(pClass, pW, pH) {
		var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.sized(null, pW, pH),
			minWidth	= (typeof pW!="undefined"&&pW!=null)?pW:0, 
			minHeight	= (typeof pH!="undefined"&&pH!=null)?pH:0,
			pWidth		= chart.width,
			pHeight		= chart.height;

		chart.updateSizeFromMin	=function () {pWidth(minWidth);pHeight(minHeight)}
		chart.width	= function(_) { 
			if (!arguments.length) return pWidth(); 
			if (_>minWidth) return pWidth(_);
			return chart;
		}
		chart.height	= function(_) { 
			if (!arguments.length) return pHeight(); 
			if (_>minHeight) return pHeight(_);
			return chart;
		}
		return chart;
	}
	dgc.core.axed	= function(pClass, pW, pH) {
		var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.sized(null, pW, pH);
		chart.xAxis		= d3.scaleTime().range([0, chart.width()]);
		chart.yAxis		= d3.scaleLinear().range([chart.height(), 0]);
		chart.dispatch.on("widthUpdate.dgc.core.axed", function() { 
			chart.xAxis.range([0, chart.width()]);
		});
		chart.dispatch.on("heightUpdate.dgc.core.axed", function() { 
			chart.yAxis.range([chart.height(), 0]);
		});
		chart.dispatch.on("dataUpdate.dgc.core.axed", function() { 
			chart.xAxis.domain(d3.extent(chart.data(), function(d) { return d.timestamp; }));
			chart.yAxis.domain([0, d3.max(chart.data(), function(d) {
				var keys;
				if (typeof chart.filter !="undefined")
					keys = Object.keys(d).filter(chart.filter());
				else
					keys = Object.keys(d);
				var vals = keys.map(function (i) {return d[i]});
				return d3.max(vals);
			})]);
		});
		return chart;
	}
	dgc.core.axes	= function(pClass, pW, pH) {
		var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.axed(null, pW, pH);
		chart.xAxisLine		= function(g) {
			g.call(d3.axisBottom(chart.xAxis).tickFormat(repo.api.format.dateAxe));
			g.select(".domain").remove();
			g.selectAll(".tick line").attr("stroke", "lightgrey").style("stroke-width", "1.5px");
		}
		chart.yAxisLine		= function(g) {
			g.call(d3.axisRight(chart.yAxis).tickSize(chart.width()));
			g.select(".domain").remove();
			g.selectAll(".tick line").attr("stroke", "lightgrey").style("stroke-width", "1px");
			g.selectAll(".tick:not(:first-of-type) line").attr("stroke-dasharray", "5,5");
			g.selectAll(".tick text").attr("x", -20);
		};
		chart.dispatch.on("init.dgc.core.axes", function() {
			chart.root().append("g").attr("class", "x axis").attr("transform", "translate(0," + chart.height() + ")").call(chart.xAxisLine);
			chart.root().append("g").attr("class", "y axis").call(chart.yAxisLine);
		});
		chart.dispatch.on("heightUpdate.dgc.core.axes", function() { 
			if (chart.inited())
				chart.root().select(".x.axis").attr("transform", "translate(0," + chart.height() + ")");
		});
		chart.dispatch.on("renderUpdate.dgc.core.axes", function() { 
			var	update	= chart.root().transition();
			update.select(".x.axis").duration(150).call(chart.xAxisLine);
			update.select(".y.axis").duration(150).call(chart.yAxisLine);
		});
		return chart;
	}
}));
(function(global, factory) {
	if (typeof global.dgc !== 'object')
		throw new Error('dgc-donut require dgc-core componant');
	
	factory(global.dgc, global);
})(this, (function(dgc, global) {
dgc.donut = dgc.donut || { }
dgc.donut.legend = function(pClass) {
	var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.colored();
	chart.callbacks = {};

	chart.dispatch.register("itemMouseOver","itemMouseOut");
	chart.callbacks.itemMouseOver	= function(d, i) {
		if (!chart.inited()) return;
		var c = chart.color()(i);
		if (typeof chart.data()[i].color !== 'undefined') {c=chart.data()[i].color;}
		chart.root().selectAll("#li-"+i)
			.style("background-color", c)
			.style("font-weight","bold")
	};
	chart.callbacks.itemMouseOut	= function(d, i) {
		if (!chart.inited()) return;
		chart.root().selectAll("#li-"+i)
			.style("background-color", "")
			.style("font-weight","normal")
	};
	chart.dispatch.on("init.dgc.donut.legend", function() { 
		chart.dispatch	.on("itemMouseOver.legend", chart.callbacks.itemMouseOver)
				.on("itemMouseOut.legend",  chart.callbacks.itemMouseOut);
	});
	chart.dispatch.on("renderUpdate.dgc.donut.legend", function() { 
		if (typeof chart.data() == 'undefined') return;
		chart.root().selectAll("li").selectAll("i").remove();
		chart.root().selectAll("li").selectAll("span").remove();
		var	update	= chart.root().selectAll("li").data(chart.data(), function(d) { return d ? d.label : this.id; }),
			liHtml	= update.enter().append("li")
					.merge(update).attr("id", function(d, i) { return "li-" + i });
		liHtml.append("i").attr("class", "fa fa-circle-o")
			.attr("style", function (d,i) { 
				if (typeof d.color !== 'undefined') 
					return "color:"+d.color+";";
				return "color:"+chart.color()(i)+";";
			});
		liHtml.append("span").text(function (d) {return " "+d.label;});
		liHtml.append("span").attr("class", "pull-right").text(function (d) {if(typeof d.value == 'number') return dgc.core.format.number(d.value);return d.value;});
		liHtml	.on("mouseover", function(d, i){chart.dispatch.call("itemMouseOver", null, d, i);})
			.on("mouseout", function(d, i) {chart.dispatch.call("itemMouseOut",  null, d, i);})
		update.exit().remove();
	});
	return chart;
}
dgc.donut.donut = function(pClass) {
	var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.colored( dgc.core.minSized( null, 150,150)),
		radius	= chart.width()/2-3, innerD=2, inner = radius/innerD,
		arc	= d3.arc().outerRadius(radius).innerRadius(inner).padAngle(0.01).cornerRadius(3),
		arc2	= d3.arc().outerRadius(radius+3).innerRadius(inner-3).padAngle(0).cornerRadius(3),
		allPies, allPaths;

	chart.dispatch.register("itemMouseOver","itemMouseOut");
	chart.callbacks = {};
	chart.innerDivide = function(d) {
		innerD=d;
		inner = radius/innerD;
		chart.updateArcs();
		return chart;
	}
	chart.callbacks["itemMouseOver"] = function(d, i) {
		if (!chart.inited()) return;
		var c = chart.color()(i);
		if (typeof chart.data()[i].color !== 'undefined') {c=chart.data()[i].color;}
		chart.root().selectAll("#arc-"+i).attr("d",arc2)
	}
	chart.callbacks["itemMouseOut"]	= function(d, i) {
		if (!chart.inited()) return;
		chart.root().selectAll("#arc-"+i).attr("d",arc)
	}
	chart.updateArcs	= function() {
		if (!chart.inited()) return;
		radius		= Math.min(chart.width(),chart.height())/2-3;
		inner = radius/innerD;
		arc.outerRadius(radius).innerRadius(inner);
		arc2.outerRadius(radius+3).innerRadius(inner-3);
		allPaths.attr("d", arc);
		allPies.attr("transform", "translate("+[chart.width()/2, chart.height()/2]+")");
	}
	chart.loadtween	= function(d,i) {
		var interpolate = d3.interpolate(d.startAngle, d.endAngle);
		return function(t) {d.endAngle = interpolate(t);return arc(d);};
	}
	chart.dispatch	.on("itemMouseOver.donut", chart.callbacks["itemMouseOver"])
			.on("itemMouseOut.donut",  chart.callbacks["itemMouseOut"]);
	chart.donutInit = function() {
		chart.root().attr("width", chart.width()).attr("height", chart.height());
		var chartLayer	= chart.root().append("g").classed("chartLayer", true);
		allPies		= chartLayer.selectAll(".pies");
		allPaths	= chartLayer.selectAll(".arcPath");
		chart.updateArcs();
	}
	chart.dispatch.on("init.dgc.donut.donut", chart.donutInit);
	chart.dispatch.on("renderUpdate.dgc.donut.donut", function() { 
		chart.root().selectAll("path").remove();
		if (typeof chart.data() == 'undefined') return;
		var 	update	= allPies.data(chart.data()),
			arcs	= d3.pie().sort(null).value(function(d) { return d.value; })(chart.data()),
			pies	= update.enter().append("g").classed("pies", true)
					.attr("transform", "translate("+[chart.width()/2, chart.height()/2]+")"),
			blocks	= pies.selectAll(".arc").data(arcs),
			newBlock= blocks.enter().append("g").classed("arc", true);
		newBlock.append("path").classed("arcPath", true).attr("d", arc).attr("stroke", "white").style("stroke-width", "0.5")
			.attr("id", function(d, i) { return "arc-" + i }).attr("fill", "white")
			.on("mouseover", function(d, i) {chart.dispatch.call("itemMouseOver", null, d, i);})
			.on("mouseout", function(d, i) { chart.dispatch.call("itemMouseOut",  null, d, i);})
			.transition().duration(350)
			.delay(function(d, i) { return i * 50; })
			.attr("fill", function(d,i){ 
				if (typeof chart.data()[i].color !== 'undefined') 
					return chart.data()[i].color;
				return chart.color()(i);
			}).attrTween("d", chart.loadtween);
		update.exit().remove();
	});
	chart.dispatch.on("heightUpdate.dgc.donut.donut", function() { 
		chart.updateArcs();
		if (chart.inited())
			chart.root().attr("height", chart.height());
	});
	chart.dispatch.on("widthUpdate.dgc.donut.donut", function() { 
		chart.updateArcs();
		if (chart.inited())
			chart.root().attr("width", chart.width());
	});
	return chart;
}
dgc.donut.donutWithLegend = function(pClass) {
	var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.colored(),
		legend	= dgc.donut.legend(),
		donut	= dgc.donut.donut(),
		width, height, rightHtml;

	chart.dispatch.on("init.dgc.donut.donutWithLegend", function() { 
		var	rowHtml	= chart.root().append("div").attr("class", "row"),
			leftHtml= rowHtml.append("div").attr("class", "col-xs-12 col-sm-8 col-md-12 col-lg-7")
					.append("div").attr("class", "chart-responsive");
		rightHtml	= rowHtml.append("div").attr("class", "col-xs-12 col-sm-4 col-md-12 col-lg-5");
		rightHtml.append("ul").attr("class", "list-unstyled clearfix").call(legend);
		leftHtml.append("svg").call(donut);
		legend.color(chart.color()).data(chart.data());
		width		= leftHtml.node().getBoundingClientRect().width;
		height		= rightHtml.node().getBoundingClientRect().height;
		donut.width(width).height(height).color(chart.color()).data(chart.data());
		legend.dispatch.on("itemMouseOver.donut",  donut.callbacks["itemMouseOver"]);
		legend.dispatch.on("itemMouseOut.donut",   donut.callbacks["itemMouseOut"]);
		donut.dispatch.on("itemMouseOver.legend", legend.callbacks["itemMouseOver"]);
		donut.dispatch.on("itemMouseOut.legend",  legend.callbacks["itemMouseOut"]);
	});
	chart.dispatch.on("renderUpdate.dgc.donut.donutWithLegend", function() { 
		height	= rightHtml.node().getBoundingClientRect().height;
		donut.height(height).data(chart.data());
	});
	chart.dispatch.on("colorUpdate.dgc.donut.donutWithLegend", function() { 
		legend.color(chart.color());
		donut.color(chart.color());
	});

	return chart;
}
dgc.donut.donutWithLines = function(pClass) {
	var	chart	= dgc.donut.donut().innerDivide(1.3), line1="", line2="", l2;
	chart.line1	= function(_) { if (!arguments.length) return line1; line1 = _;return chart;}
	chart.line2	= function(_) { if (!arguments.length) return line2; line2 = _;return chart;}
	chart.dispatch.on("itemMouseOver.text",  function(d, i) {
		if (!chart.inited()) return;
		l2.text(d.data.label+' : '+d.data.value);
	});
	chart.dispatch.on("itemMouseOut.text",   function() {if (!chart.inited()) return;l2.text(line2);});
	
	chart.dispatch.on("init.dgc.donut.donut", function() { 
		chart.root(chart.root().append('svg'));
		chart.donutInit();
		var middle = Math.min(chart.width(),chart.height())/2;
		chart.root().append("text").attr('text-anchor','middle').attr('font-weight','bold').attr('font-size','20px').attr("transform","translate("+middle+","+(middle-12)+")").text(line1);
		l2 = chart.root().append("text").attr('text-anchor','middle').attr('font-size','16px').attr("transform","translate("+middle+","+(middle+12)+")").text(line2);
	});

	return chart;
}
dgc.donut.donutWithLabel = function(pClass) {
	var	chart	= dgc.donut.donut(dgc.core.colored( dgc.core.minSized( null, 250,250))).innerDivide(1.3), text="", label;
	chart.label	= function(_) { if (!arguments.length) return text; text = _;return chart;}
	chart.dispatch.on("itemMouseOver.text",  function(d, i) {
		if (!chart.inited()) return;
		label.attr('font-weight','normal').text(d.data.label);
	});
	chart.dispatch.on("itemMouseOut.text",   function() {if (!chart.inited()) return;label.attr('font-weight','bold').text(text);});
	
	chart.dispatch.on("init.dgc.donut.donut", function() { 
		chart.root(chart.root().append('svg'));
		chart.donutInit();
		var middle = Math.min(chart.width(),chart.height())/2;
		label = chart.root().append("text").attr('text-anchor','middle').attr('font-weight','bold').attr('font-size','16px').attr("transform","translate("+middle+","+middle+")").text(text);
	});

	return chart;
}
}));
(function(global, factory) {
	if (typeof global.dgc !== 'object')
		throw new Error('dgc-linearea require dgc componant');
	factory(global.dgc, global);
})(this, (function(dgc, global) {
dgc.area = dgc.area || { }

dgc.area.gfxLegend = function() {
	var	chart	= dgc.core.colored();
	var	bar, prop = '';
	chart.prop = function(_) {if (!arguments.length) return prop;prop=_;return chart;}
	chart.dispatch.register("area", "enable", "select");
	chart.setValue	= function(d,v) {
		chart.root().select('#value_'+d).html(dgc.core.format.number(v))
		return chart;
	}
	chart.setValues	= function(v) {
		if (typeof v == "undefined") return chart;
		chart.data().forEach(function(d) {
			if(! chart.root().select('#enable_'+d).classed('activated')) return;
			chart.setValue(d, v[d]);
		})
		return chart;
	}
	chart.cols	= function() {
		var ret = [];
		if (chart.inited() && chart.ready())
			chart.data().forEach(function(d) {
			if (chart.root().select('#enable_'+d).classed('activated'))
				ret.push(d);
		})
		else if (prop!='' && chart.ready())
			ret.push(prop);
		else if (chart.ready())
			chart.data().forEach(function(d) {
				ret.push(d);
			})
		return ret;
	};
	chart.colColor	= function(c) {
		return chart.color()(c)
	};
	chart.dispatch.on("dataUpdate.GfxLegend", function() { 
		chart.color().domain(chart.data());
	});
	chart.dispatch.on("init.GfxLegend", function() { 
		bar   = chart.root().append('div').attr('class', 'btn-toolbar').attr('role','toolbar');
		var l = bar.append('div').attr('class', 'btn-group').attr('role','group').attr('data-toggle','buttons').append('label').attr('class', 'btn btn-default item activated').on('click', function (d){
				var x=d3.select(this);
				if (d3.event) d3.event.preventDefault();
				x.classed('activated',!x.classed('activated'))
				chart.dispatch.call("area",this,d,x.classed('activated'));
		});
		l.append('input').attr('type', 'checkbox');
		l.append('i').attr('class', 'fa fa-area-chart')
	});
	chart.dispatch.on("renderUpdate.GfxLegend", function() {
		var d = bar.selectAll('div.btn-group.legend').data(chart.data()),
		    g = d.enter().append('div').attr('class', 'btn-group legend').attr('role','group').attr('data-toggle','buttons');
		var l = g.append('label').attr('class', function(d){
				var ret = 'btn btn-default item', a = 'active activated';
				if (prop==''|| d == prop) return ret+' '+a;
				return ret;
			}).attr('id', function (d) { return 'enable_'+d})
			.on('click', function (d) {
				var x=d3.select(this);
				if (d3.event) d3.event.preventDefault();
				x.classed('activated',!x.classed('activated'))
				x.classed('active',x.classed('activated'))
				chart.dispatch.call("enable",this,d,x.classed('activated'));
			});
		l.append('input').attr('type', 'checkbox').attr('checked',function(d){if (prop==''||d == prop) return 'true';return 'false'})
		l.append('i').attr('class', 'fa fa-circle').attr('style',function (d) { return 'color:'+chart.color()(d)})
		g.append('div').attr('class', 'item').append('b')
			.attr('style',function (d) { return 'color:'+chart.color()(d)})
			.html(function(d){return d})
		g.append('div').attr('class', 'item value').html("0.00")
			.attr('style',function (d) { return 'color:'+chart.color()(d)})
			.attr('id', function (d) { return 'value_'+d})
	});
	return chart;
}
dgc.area.gfx = function() {
	var	chart	= dgc.core.axes(dgc.core.axed(dgc.core.minSized(null, 500,350))),
		legend, svg, timeline, domain, full_domain, oldX = 0, useArea=true,
		margin	= {top: 10, right: 10, bottom: 20, left: 30},
		xRev	= d3.scaleTime().domain([0, chart.width()-margin.left-margin.right]),
		w	= chart.width()-(margin.left+margin.right+30),
		h	= chart.height()-margin.bottom-margin.top,
		zoom	= d3.zoom().scaleExtent([1, 100]),
		stack	= d3.stack(),
		line	= d3.line().curve(d3.curveBasis)
				.x(function(d) { return chart.xAxis(d.timestamp); })
				.y(function(d) { return chart.yAxis(d.value); }),
		area	= d3.area()
			.x(function(d, i) { return chart.xAxis(d.data.timestamp); })
			.y0(function(d) { return chart.yAxis(d[0]); })
			.y1(function(d) { return chart.yAxis(d[1]); }),
		lines	= [],
		have_zoom = false;

	chart.dispatch.register("updateValues");
	chart.mouseMove	= function(x,y) {
		if (Math.abs(x-oldX)<1) return;
		oldX=x;
		var v = chart.data().find(function (d) { return d.timestamp>=xRev(x) });
		chart.dispatch.call("updateValues", null, v);
	};
	chart.zoomed	= function () {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
		var t = d3.event.transform;
		if (typeof timeline !== 'undefined') {
			timeline.brushMove(chart.xAxis.range().map(t.invertX, t))
			domain = t.rescaleX(timeline.xAxis).domain()
		} else {
			chart.xAxis.domain(full_domain)
			domain = t.rescaleX(chart.xAxis).domain()
		}
		xRev.range(domain)
		chart.xAxis.domain(domain)
		chart.lineChanged();
		chart.noDots();
		chart.dispatch.call("renderUpdate")
	}
	chart.noDots	= function() {
		svg.selectAll(".dots").selectAll('circle').transition().duration(200).attr('r', 0);
		svg.selectAll(".dots").transition().duration(200).on("end", function(){d3.select(this).remove()});
	}
	chart.lineChanged=function() {
		var subData= [];
		stack.keys(legend.cols())
		chart.data().forEach(function(d) {
			if(d.timestamp >= domain[0] && d.timestamp <= domain[1])
				subData.push(d)
		})
		if (useArea)
			chart.yAxis.domain([0, d3.max(subData, function(d) {
				var vals = legend.cols().map(function (i) {return +d[i]});
				return d3.sum(vals);
			})]);
		else
			chart.yAxis.domain([0, d3.max(subData, function(d) {
				var vals = legend.cols().map(function (i) {return +d[i]});
				return d3.max(vals);
			})]);
		lines = legend.cols().map(function(i) {
			return {
				id: i,
				values: subData.map(function(d) {
					return {timestamp: d.timestamp, value:+d[i]};
				})
			};
		});
		return chart;
	}
	chart.areaSet= function(d,v) {
		useArea = v
		if (chart.inited() && chart.ready()) {
			chart.lineChanged();
			chart.noDots();
			chart.dispatch.call("renderUpdate")
		}
	}
	chart.colChanged= function (d,v) {
		chart.lineChanged();
		chart.noDots();
		chart.dispatch.call("renderUpdate")
		return chart;
	}
	chart.brushChanged= function (s, r) {
		domain = r;
		xRev.range(domain);
		chart.xAxis.domain(domain);
		if(have_zoom)
			svg.select(".zoom").call(zoom.transform, 
				d3.zoomIdentity.scale(w / (s[1] - s[0])).translate(-s[0], 0));
		chart.noDots();
		chart.lineChanged();
		chart.dispatch.call("renderUpdate")
		return chart;
	}
	chart.legend	= function(_) {
		if (!arguments.length) return legend; legend = _;
		legend.dispatch.on("area.GfxChart", chart.areaSet);
		legend.dispatch.on("enable", chart.colChanged);
		legend.dispatch.on("select", chart.colChanged);
		chart.dispatch.on("updateValues.legend", legend.setValues);
		return chart;
	};
	chart.timeline	= function(_) {
		if (!arguments.length) return timeline; timeline = _;
		have_zoom = true;
		timeline.dispatch.on("brushed", chart.brushChanged);
		return chart;
	};
	chart.yAxisLine	= function(g) {
		g.call(d3.axisRight(chart.yAxis).tickSize(w));
		g.select(".domain").remove();
		g.selectAll(".tick line").attr("stroke", "lightgrey").style("stroke-width", "1px");
		g.selectAll(".tick:not(:first-of-type) line").attr("stroke-dasharray", "5,5");
		g.selectAll(".tick text").attr("x", -20);
	};
	chart.dispatch.on("widthUpdate.dgc.core.axed", function() {
		w = chart.width()-(margin.left+margin.right+30)
		xRev.domain([0, w]);
		chart.xAxis.range([0, w ]);
	});
	chart.dispatch.on("heightUpdate.dgc.core.axed", function() {
		h = chart.height()-margin.bottom-margin.top;
		chart.yAxis.range([h, 0]);
		if(have_zoom)
			zoom.translateExtent([[0, 0], [w, h]]).extent([[0, 0], [w, h]])
	});
	chart.dispatch.on("dataUpdate.dgc.core.axed", function() {
		domain = d3.extent(chart.data(), function(d) { return d.timestamp; });
		full_domain = domain;
		xRev.range(domain);
		chart.xAxis.domain(domain);
		chart.lineChanged();
	});
	chart.dispatch.on("heightUpdate.dgc.core.axes", function() { 
		if (chart.inited())
			chart.root().select(".x.axis").attr("transform", "translate("+margin.left+"," +h+ ")");
	});
	chart.dispatch.on("init.dgc.core.axes", function() {
		var bound	= chart.root().node().getBoundingClientRect();
		chart.width(bound.width);
		chart.height(bound.height);chart.dispatch.call("heightUpdate")
		svg	= chart.root().append("svg").attr("width", chart.width()).attr("height", chart.height());
		svg.on("mousemove", function() {
			var 	bBox	= svg.node().getBoundingClientRect(),
				x	= d3.event.pageX-bBox.left-margin.left-window.scrollX,
				y	= d3.event.pageY-bBox.top-margin.top-window.scrollY;
			if (	x>=0 && x<=bBox.right-bBox.left-margin.left-margin.right &&
				y>=0 && y<=bBox.bottom-bBox.top-margin.top-margin.bottom) {
				chart.mouseMove(x,y);
			}
		});

		svg.append("g").attr("class", "x axis").attr("transform", "translate("+margin.left+"," + (chart.height()-margin.bottom) + ")").call(chart.xAxisLine);
		svg.append("g").attr("class", "y axis").attr("transform", "translate("+margin.left+"," + margin.top + ")").call(chart.yAxisLine);

		svg.append("defs").attr("transform", "translate("+margin.left+"," + margin.top + ")").append("clipPath").attr("id", "clip").append("rect").attr("width", w).attr("height", h);

		if(have_zoom) {
			zoom.on('zoom', chart.zoomed);
			svg.append("rect").attr("class", "zoom")
				.attr("width", chart.width()).attr("height", chart.height())
				.call(zoom);
		}
	})
	chart.dispatch.on("updateValues.GfxChart", function(v) {
		chart.noDots();
		if (typeof v == "undefined") return;
		var dots = legend.cols().map(function(d,i){
			return {
				id:	d.substr(4),
				timestamp:v.timestamp,
				value:	v[d],
				color:	legend.colColor(d),
				x:	chart.xAxis(v.timestamp),
				y:	chart.yAxis(useArea?stack([v])[i][0][1]:v[d])
			};
		}), update = svg.selectAll(".dots").data(dots);
		update.enter().append('g').attr('class','dots')
			.attr("transform", "translate("+margin.left+", " + (margin.top) + ")")
			.append('circle').attr('cx', function(d){return d.x})
				.attr('cy', function(d){return d.y})
				.attr('stroke', function(d){return d.color})
				.transition().duration(200).attr('r', 5)

	});
	chart.drawArea	= function() {
		var	update	= svg.selectAll(".lines").data(stack(chart.data()), function(d) { return d.timestamp }),
			eLines	= update.enter().append("g").attr("class", "lines").attr("transform", "translate("+margin.left+", " + (margin.top) + ")");
		update.exit().remove();
		eLines.append("path").attr("class", "area")
			.style("clip-path","url(#clip)")
			.style("fill", function(d) { return legend.colColor(d.key); })
			.attr("d", area);
	}
	chart.drawLine	= function() {
		var	update	= svg.selectAll(".lines").data(lines, function(d) { return d.id });
		var	eLines	= update.enter().append("g").attr("class", "lines").attr("transform", "translate("+margin.left+", " + (margin.top) + ")");
		eLines.append("path").attr("class", "line")
			.attr("d", function(d) { return line(d.values); })
			.style("clip-path","url(#clip)")
			.style("stroke", function(d) { return legend.colColor(d.id); });
	}
	chart.dispatch.on("renderUpdate.dgc.core.axes", function() {
		svg.selectAll(".lines").remove();
		if (useArea)
			chart.drawArea();
		else
			chart.drawLine();
		if(have_zoom)
			svg.select("rect.zoom").call(chart.onTop);
		var update	= svg.transition();
		update.select(".x.axis").duration(350).call(chart.xAxisLine);
		update.select(".y.axis").duration(350).call(chart.yAxisLine);
	})
	return chart;
}
}));
(function(global, factory) {
	if (typeof global.dgc !== 'object')
		throw new Error('dgc-bar require dgc componant');
	factory(global.dgc, global);
})(this, (function(dgc, global) {
dgc.bar = dgc.bar || { }

function dgc_bar_chart(pClass) {
	var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.colored( dgc.core.axed(null, 200, 200)),
		stack		= d3.stack();
	chart.xAxis		= d3.scaleBand().padding(0.2);
	chart.colorFunction	= function() { return chart.color(); }
	chart.dispatch.register("click");
	chart.dispatch.on("renderUpdate.dgc_bar_chart", function() {
		chart.root().selectAll(".bars").remove();
		var	update	= chart.root().selectAll(".bars").data(stack(chart.data()), function(d) { return d.type }),
			eBars	= update.enter().append("g").attr("class", "bars");
		update.exit().remove();
		eBars.append("g")
			.selectAll("rect")
			.data(function(d) {d.map(function(i){i.key=d.key});return d; })
				.enter().append("rect")
				.attr("fill", function(d,i) { return chart.colorFunction(d,i)(d.key); })
				.attr("x", function(d) { return chart.xAxis(d.data.type); })
				.attr("y", function(d) { return chart.yAxis(d[1]); })
				.attr("height", function(d) { return chart.yAxis(d[0]) - chart.yAxis(d[1]); })
				.attr("width", chart.xAxis.bandwidth())
				.on("click",function (d,i){chart.dispatch.call("click", this,d,i);});
	});
	chart.dispatch.on("widthUpdate.dgc.core.axed", function() { });
	chart.dispatch.on("widthUpdate.dgc_bar_chart", function() {
		chart.xAxis.rangeRound([0, chart.width()]);
	});
	chart.dispatch.on("dataUpdate.dgc.core.axed", function() { });
	chart.dispatch.on("dataUpdate.dgc_bar_chart", function() {
		var keys = [];
		if (chart.data().length<1) return;
		Object.keys(chart.data()[0]).map(function(k, i) {
			if(typeof chart.data()[0][k] == "number")
				keys.push(k);
		});
		stack.keys(keys);
		chart.color().domain(keys);
		chart.xAxis.domain(chart.data().map(function(d) { return d.type; }));
		chart.yAxis.domain([0, d3.max(chart.data(), function(d) { 
			var sum=0;
			Object.keys(d).map(function(k, i) {
				if(typeof d[k] == "number")
					sum+=d[k];
			});
			return sum;
		})]);
	});
	return chart;
}

function dgc_bar_axes(pClass) {
	var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.axes(null,500,200);
	chart.xAxis		= d3.scaleBand().rangeRound([0, chart.width()]).paddingInner(0.05).align(0.1);
	chart.xAxisLine		= function(g) {
		g.call(d3.axisBottom(chart.xAxis));
		g.selectAll(".tick line").attr("stroke", "lightgrey").style("stroke-width", "1.5px");
	}
	chart.dispatch.on("widthUpdate.dgc.core.axed", function() { });
	chart.dispatch.on("widthUpdate.dgc_bar_axes", function() {
		chart.xAxis.rangeRound([0, chart.width()]);
	});
	chart.dispatch.on("dataUpdate.dgc.core.axed", function() { });
	chart.dispatch.on("dataUpdate.dgc_bar_axes", function() { 
		chart.xAxis.domain(chart.data().map(function(d) { return d.type; }));
		chart.yAxis.domain([0, d3.max(chart.data(), function(d) { 
			var sum=0;
			Object.keys(d).map(function(k, i) {
				if(typeof d[k] == "number")
					sum+=d[k];
			});
			return sum;
		})]);
	});
	return chart;
}

dgc.bar.bar = function(pClass) {
	var	chart	= (typeof pClass!="undefined"&&pClass!=null)?pClass:dgc.core.colored( dgc.core.minSized(null,200,200)),
		margin		= {top: 10, right: 10, bottom: 20, left: 30},
		axes 		= dgc_bar_axes(),
		bars		= dgc_bar_chart();

	chart.dispatch.on("init.wdBarChart", function() { 
		var	bound	= chart.root().node().getBoundingClientRect();
		chart.width(bound.width);
		chart.height(bound.height);
		var 	svg	= chart.root().append("svg").attr("width", chart.width()).attr("height", chart.height());
		svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").call(bars);
		svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").call(axes);
	});
	chart.dispatch.on("heightUpdate.wdBarChart", function() { 
		axes.height(chart.height() - margin.top - margin.bottom);
		bars.height(chart.height() - margin.top - margin.bottom);
	});
	chart.dispatch.on("widthUpdate.wdBarChart", function() { 
		axes.width(chart.width() - margin.left - margin.right);
		bars.width(chart.width() - margin.left - margin.right);
	});
	chart.dispatch.on("dataUpdate.wdBarChart", function() { 
		axes.data(chart.data());
		bars.data(chart.data());
	});
	chart.dispatch.on("colorUpdate.wdBarChart", function() { 
		bars.color(chart.color());
	});
	chart.bars	= function() {return bars }
	chart.axes	= function() {return axes }
	chart.updateSizeFromMin();
	return chart;
}


}));
