(function () {
    var app = angular.module("demo.app", ["demo.model", "demo.simulator", "progress.model"]);
    app.controller("demo.controller", function ($scope, demoModel) {
        $scope.model = demoModel;

        $scope.simulate = function () {
            demoModel.simulate();
        };

        demoModel.simulate();
    });

    app.controller("progress.controller", function ($scope, progressModel) {
        $scope.model = progressModel;
    });

    app.directive("between", function () {
        return {
            require: "ngModel",
            link: function (scope, elem, attr, ngModel) {
                var betweenAnd = attr["between"].split(',');
                var i;
                for (i = 0; i < betweenAnd.length; i++) {
                    betweenAnd[i] = +betweenAnd[i];
                }

                //For DOM -> model validation
                ngModel.$parsers.unshift(function (value) {
                    var valid = betweenAnd[0] <= value && value <= betweenAnd[1];
                    ngModel.$setValidity("between", valid);
                    return valid ? value : undefined;
                });

                //For model -> DOM validation
                ngModel.$formatters.unshift(function (value) {
                    var valid = betweenAnd[0] <= value && value <= betweenAnd[1];
                    ngModel.$setValidity("between", valid);
                    return value;
                });
            }
        };
    });

    app.directive("greaterthanorequal", function () {
        return {
            require: "ngModel",
            link: function (scope, elem, attr, ngModel) {
                var lowerThreshold = +attr["greaterthanorequal"];

                //For DOM -> model validation
                ngModel.$parsers.unshift(function (value) {
                    var valid = value >= lowerThreshold;
                    ngModel.$setValidity("between", valid);
                    return valid ? value : undefined;
                });

                //For model -> DOM validation
                ngModel.$formatters.unshift(function (value) {
                    var valid = value >= lowerThreshold;
                    ngModel.$setValidity("between", valid);
                    return value;
                });
            }
        };
    });

    angular.module("demo.model", ["ui.bootstrap", "demo.renderer", "progress.model"])
        .factory("demoModel", function ($modal, renderer, newSimulator, progressModel) {
            var returnObj = {
                result: {
                    selectedChart: "cumulativeReward",

                    canShowCumulativeReward: function () {
                        return "cumulativeReward" == returnObj.result.selectedChart;
                    },

                    canShowAverageReward: function () {
                        return "averageReward" == returnObj.result.selectedChart;
                    }
                },

                simulator: {
                    arms: [
                        { probability: 0.23 },
                        { probability: 0.18 }
                    ],
                    numIteration: 1000
                },

                algorithms: {
                    epsilonGreedy: { epsilon: 0.5 },
                    softmax: { temperature: 0.1 }
                },

                simulate: function () {
                    var modal = $modal.open({
                        templateUrl: 'calculating.html',
                        controller: 'progress.controller',
                        backdrop: 'static',
                        keyboard: false
                    });

                    newSimulator(
                        2,
                        [
                            returnObj.simulator.arms[0].probability,
                            returnObj.simulator.arms[1].probability
                        ],
                        returnObj.simulator.numIteration)
                        .epsilonGreedy(returnObj.algorithms.epsilonGreedy.epsilon)
                        .epsilonGreedyWithAnneal()
                        .softmax(returnObj.algorithms.softmax.temperature)
                        .softmaxWithAnneal()
                        .ucb1()
                        .thompsonSampling()
                        .simulate(function (value, totalValue) {
                            progressModel.progress.value = value;
                            progressModel.progress.totalValue = totalValue;
                            progressModel.progress.percentage = 100 * value / totalValue;

                        }, function (result) {
                            modal.close();
                            renderer.render(result, returnObj);
                        });
                }
            };

            return returnObj;
        });

    angular.module("progress.model", [])
        .factory("progressModel", function () {
            return {
                progress: {
                    value: "-",
                    totalValue: "-",
                    percentage: 0
                }
            };
        });
})();