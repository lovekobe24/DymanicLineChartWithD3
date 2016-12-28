function LoadLineChart(elementId, updateData, min, max, samprate, dataCount,useId) {
	var self = this;
	var top = 10,
	right = 20,
	bottom = 50,
	left = 30;
	var svg = d3.select("#" + elementId);
	var strs = svg.attr("viewBox").split(" ");
	var width = strs[2];
	var height = strs[3];
	height = height - top - bottom;
	width = width - left - right;

	var maxvalue = max;
	var minvalue = min;
	var timemax = 0;
	var timemin = 0;
	var allData = [];
	var xScale;
	var yScale;

	//var chData = updateData[1].gdp.concat(updateData[0].gdp);
	for (var i = 0; i < updateData.length; i++) {
		var currMaxTime = d3.max(updateData[i].alldatas, function (d) {
				return d[0];
			});

		var currMinTime = d3.min(updateData[i].alldatas, function (d) {
				return d[0];
			});
		if (currMaxTime > timemax) {
			timemax = currMaxTime;
		}

		timemin = currMinTime;
	}

	var during = timemax - timemin;

	xScale = d3.scaleTime()
		.domain([new Date(timemax - samprate * 1000 * dataCount), new Date(timemax)])
		.range([0, width]);

	var xAxis = d3.axisBottom()
		.scale(xScale)
		.ticks(5)
		.tickFormat(d3.timeFormat("%H:%M:%S"));
	//console.log(svg.selectAll("g.axis"));
	var axisElement = svg.selectAll("g.x.axis");
	axisElement
	.call(xAxis);

	//d3的默认填充为黑色的必须去掉才能看到坐标轴的文字
	svg.selectAll(".domain")
	.attr("fill", "none");

	var color = svg.selectAll("g.y.axis").select(".domain").attr("stroke");
	svg.selectAll("g.x.axis").selectAll("line")
	.attr("stroke", color);
	svg.selectAll("g.x.axis").selectAll("text")
	.attr("fill", color);

	yScale = d3.scaleLinear()
		.domain([min, max])
		.range([height, 0]);

	var linePath = d3.line()
		.x(function (d) {

			return xScale(d[0]);
		})
		.y(function (d) {

			return yScale(d[1]);
		}).curve(d3.curveCatmullRom.alpha(0.5));

	svg.selectAll(".path") //选择<svg>中所有的<path>
	.data(updateData) //绑定数据
	.transition()
	.duration(500)
	.ease(d3.easeLinear)
	.attr("d", function (d) {

		return linePath(d.alldatas); //返回直线生成器得到的路径
	});

	var dataGroups = svg.selectAll('.datagroups')
		.data(updateData);
	dataGroups.selectAll("circle").attr("cx", "-100")
	.attr("cy", "-100");

	var timeStep = samprate * 1000;

	var transition = d3.select({}).transition()
		.duration(parseInt(timeStep))
		.ease(d3.easeLinear);

	var tooltip = d3.select("body")
		.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0.0);

	var dataCountIndex = 1;

	var constantNormalValue = 0;
	var isModify = false;

	this.updateLineChart = function () {

		transition = transition.each(function () {
                 // console.log("updateLine");
				updateData = addData(timemin, dataCountIndex, timeStep, updateData,useId);
				var length = updateData[0].alldatas.length;

				var modAxis = false;
				var timenow;
				timenow = (updateData[0].alldatas)[length - 1][0];
				var currMaxValue,
				currMinValue;
				for (var i = 0; i < updateData.length; i++) {
					var trueValue = (updateData[i].alldatas)[length - 1][1];

					currMaxValue = d3.max([currMaxValue, parseInt(trueValue)]);
					currMinValue = d3.min([currMinValue, parseInt(trueValue)]);
				}

				// console.log("currMaxValue"+currMaxValue);
				if (currMinValue < minvalue) {
					if(currMinValue<0){
						minvalue = currMinValue * 1.5;
					}else{
						minvalue = currMinValue / 1.5;
					}
					
					modAxis = true;
				}

				if (currMaxValue > maxvalue) {
					if(currMaxValue>0){
						maxvalue = currMaxValue * 1.5;
					}else{
						maxvalue = currMaxValue /1.5;
					}
					
					modAxis = true;
				}

				//计算正常值的个数，如果连续出现30个正常值，则坐标系变回来
				if (currMinValue > min && currMaxValue < max) {
					constantNormalValue++;
				} else {
					constantNormalValue = 0;
				}

				if (modAxis) {
					//需要修改Y坐标轴
					yScale = d3.scaleLinear()
						.domain([minvalue, maxvalue])
						.range([height, 0]);

					var yAxis = d3.axisLeft()
						.scale(yScale)
						.ticks(5);

					var color = svg.selectAll("g.y.axis").select(".domain").attr("stroke");

					svg.selectAll("g.y.axis").call(yAxis);
					//设置成自己的颜色，不然d3默认是黑色的
					svg.selectAll("g.y.axis").selectAll("line")
					.attr("stroke", color);
					svg.selectAll("g.y.axis").selectAll("text")
					.attr("fill", color);

					//需要去除和x坐标重合的那一条线
					//console.log(svg.selectAll("g.y.axis").selectAll(".tick").selectAll("text").text);
					svg.selectAll("g.y.axis").selectAll(".tick").filter(function (d, i) {
						return d != 0;
					})
					.append("line")
					.attr("y2", "0")
					.attr("x2", width)
					.attr("stroke", "#cccccc");

					if (minvalue > 0) {
						//x轴坐标位置也要对应变化
						axisElement.attr("transform", "translate(" + left + "," + (yScale(minvalue) + top) + ")");
					} else {
						axisElement.attr("transform", "translate(" + left + "," + (yScale(0) + top) + ")");
					}

					isModify = true;
				} else {
					if (constantNormalValue > dataCount+10 && isModify) {
						//需要修改Y坐标轴
						yScale = d3.scaleLinear()
							.domain([min, max])
							.range([height, 0]);

						var yAxis = d3.axisLeft()
							.scale(yScale)
							.ticks(5);

						var color = svg.selectAll("g.y.axis").select(".domain").attr("stroke");

						svg.selectAll("g.y.axis").call(yAxis);
						//设置成自己的颜色，不然d3默认是黑色的
						svg.selectAll("g.y.axis").selectAll("line")
						.attr("stroke", color);
						svg.selectAll("g.y.axis").selectAll("text")
						.attr("fill", color);

						svg.selectAll("g.y.axis").selectAll(".tick")
						.filter(function (d, i) {
							return d != 0;
						})
						.append("line")
						.attr("y2", "0")
						.attr("x2", width)
						.attr("stroke", "#cccccc");

						//x轴坐标位置也要对应变化
						if (min > 0) {
							//x轴坐标位置也要对应变化
							axisElement.attr("transform", "translate(" + left + "," + (yScale(min) + top) + ")");
						} else {
							axisElement.attr("transform", "translate(" + left + "," + (yScale(0) + top) + ")");
						}
					}
				}
				
				xScale = d3.scaleTime()
					.domain([new Date(timenow - dataCount * timeStep), new Date(timenow+timeStep)])
					.range([0, width]);

				svg.selectAll(".path") //选择<svg>中所有的<path>
				.data(updateData)
				.attr("d", function (d) {

					var dValue = linePath(d.alldatas);
                   // console.log(dValue);
					return dValue; //返回直线生成器得到的路径
				});
				var fdataGroups = svg.selectAll('.datagroups')
					.data(updateData);
				fdataGroups.selectAll("circle")
				.data(function (d) {

					return d.alldatas
				})
				.attr('cx', function (d) {

					return xScale(d[0])
				})
				.attr('cy', function (d) {

					return yScale(d[1])
				})
				.attr('r', 4)
				.attr("fill", function (d) {

					if (d[1] > parseInt(max) || d[1] < parseInt(min)) {
						return "#ff0000";
					} else {
						return "#ffffff";
					}
				})
				.on("mouseover", function (d) {
					/*
					鼠标移入时，
					（1）通过 selection.html() 来更改提示框的文字
					（2）通过更改样式 left 和 top 来设定提示框的位置
					（3）设定提示框的透明度为1.0（完全不透明）
					 */
					var timeFormat = d3.timeFormat("%H:%M:%S");
					tooltip.html("时间:" + timeFormat(new Date(d[0])) + "<br />" +
						"值:" + d[1])
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY + 20) + "px")
					.style("opacity", 1.0);
				})
				.on("mousemove", function (d) {
					/* 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 */

					tooltip.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY + 20) + "px");
				})
				.on("mouseout", function (d) {
					/* 鼠标移出时，将透明度设定为0.0（完全透明）*/

					tooltip.style("opacity", 0.0);
				});

				

				xAxis = d3.axisBottom()
					.scale(xScale)
					.ticks(5)
					.tickFormat(d3.timeFormat("%H:%M:%S"));
				axisElement
				.call(xAxis);
				//d3的默认填充为黑色的必须去掉才能看到坐标轴的文字
				svg.selectAll(".domain")
				.attr("fill", "none");

				var color = svg.selectAll("g.y.axis").select(".domain").attr("stroke");
				svg.selectAll("g.x.axis").selectAll("line")
				.attr("stroke", color);
				svg.selectAll("g.x.axis").selectAll("text")
				.attr("fill", color);
				if (dataCountIndex > dataCount-1) {
					updateData = deleteData(updateData,useId);
				}
				dataCountIndex++;
			}).transition().on("start", self.updateLineChart);
	}

}
