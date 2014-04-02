(function () {
    var renderer = angular.module("demo.renderer", []);
    renderer.factory("renderer", function () {
        var newChart = function() {
            var chart = nv.models.lineChart()
                .x(function (d) {
                    return d[0];
                })
                .y(function (d) {
                    return d[1];
                })
                .color(d3.scale.category10().range())
                .useInteractiveGuideline(true)
                .width(840)
                .height(560);

            chart.xAxis.axisLabel("# iterations");
            chart.yAxis
                .axisLabelDistance(40)
                .tickFormat(d3.format('.03f'));

            return chart;

        };

        return {
            render: function (simulationResult) {
                var cumulativeRewardChart = newChart();
                cumulativeRewardChart.yAxis.axisLabel("# rewards");

                d3.select("#cumulativeReward svg")
                    .datum(simulationResult["cumulativeReward"])
                    .call(cumulativeRewardChart);

                var averageRewardChart = newChart();
                averageRewardChart.yAxis.axisLabel("average reward");

                d3.select("#averageReward svg")
                    .datum(simulationResult["averageReward"])
                    .call(averageRewardChart);
            }
        };
    });
})();