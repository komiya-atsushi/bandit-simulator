(function () {
    var simulator = angular.module("demo.simulator", []);
    simulator.factory("newSimulator", function ($timeout) {
        return function (numArms, probabilities, numIterations) {
            var algorithms = [];
            var arms = [];

            var _i;
            for (_i = 0; _i < numArms; _i++) {
                arms.push(bandit.bernoulliArm(numIterations, probabilities[_i]));
            }

            return {
                epsilonGreedy: function (epsilon) {
                    algorithms.push(bandit.algorithm({
                        algorithm: "epsilon-greedy",
                        numArms: numArms,
                        epsilon: epsilon
                    }));
                    return this;
                },

                epsilonGreedyWithAnneal: function () {
                    algorithms.push(bandit.algorithm({
                        algorithm: "epsilon-greedy-with-anneal",
                        numArms: numArms
                    }));
                    return this;
                },

                softmax: function (temperature) {
                    algorithms.push(bandit.algorithm({
                        algorithm: "softmax",
                        numArms: numArms,
                        temperature: temperature
                    }));
                    return this;
                },

                softmaxWithAnneal: function () {
                    algorithms.push(bandit.algorithm({
                        algorithm: "softmax-with-anneal",
                        numArms: numArms
                    }));
                    return this;
                },

                ucb1: function () {
                    algorithms.push(bandit.algorithm({
                        algorithm: "ucb1",
                        numArms: numArms
                    }));
                    return this;
                },

                thompsonSampling: function () {
                    algorithms.push(bandit.algorithm({
                        algorithm: "thompson",
                        numArms: numArms
                    }));
                    return this;
                },

                simulate: function (progressCallback, resultCallback) {
                    var NUM_ITERATIONS_AT_A_TIMEOUT = 100;

                    var iterationCount = 0;
                    var nextLimit = NUM_ITERATIONS_AT_A_TIMEOUT;

                    var simulationResult = newSimulationResult(numIterations);
                    var _i;
                    for (_i = 0; _i < algorithms.length; _i++) {
                        simulationResult.setLabel(algorithms[_i].name);
                    }

                    var TIMEOUT_MILLIS = 50;
                    var iterateWithTimeout = function () {
                        var j, algorithm, arm, reward;

                        for (nextLimit = Math.min(nextLimit, numIterations);
                             iterationCount < nextLimit;
                             iterationCount++) {

                            for (j = 0; j < algorithms.length; j++) {
                                algorithm = algorithms[j];
                                arm = algorithm.selectArm();

                                reward = arms[arm].draw(iterationCount) ? 1 : 0;
                                algorithm.update(arm, reward);

                                simulationResult.add(
                                    algorithm.name,
                                        iterationCount + 1,
                                    algorithm.totalReward());
                            }
                        }

                        if (iterationCount < numIterations) {
                            nextLimit += NUM_ITERATIONS_AT_A_TIMEOUT;
                            $timeout(iterateWithTimeout, TIMEOUT_MILLIS, true);
                            progressCallback(iterationCount, numIterations);

                        } else {
                            progressCallback(iterationCount, numIterations);
                            $timeout(function () {
                                resultCallback(simulationResult.getResult());
                            }, TIMEOUT_MILLIS, true);
                        }
                    };

                    $timeout(iterateWithTimeout, TIMEOUT_MILLIS, true);
                }
            };
        };
    });

    var newSimulationResult = function (numIterations) {
        var MAX_SAMPLING_COUNT = 760;

        var result = {
            cumulativeReward: [],
            averageReward: []
        };

        var indexOfLabel = {};

        return {
            setLabel: function (label) {
                indexOfLabel[label] = result.cumulativeReward.length;
                result.cumulativeReward.push({
                    key: label,
                    values: []
                });
                result.averageReward.push({
                    key: label,
                    values: []
                });
            },

            add: function (label, iterationCount, totalReward) {
                var algorithmIndex = indexOfLabel[label];
                var sampleCount = result.cumulativeReward[algorithmIndex].values.length;
                var nextSamplingPoint = sampleCount / MAX_SAMPLING_COUNT;
                var currentPoint = iterationCount / numIterations;

                if (iterationCount == 0 || currentPoint >= nextSamplingPoint) {
                    result.cumulativeReward[algorithmIndex].values.push([
                        iterationCount,
                        totalReward
                    ]);
                    result.averageReward[algorithmIndex].values.push([
                        iterationCount,
                        totalReward / (iterationCount)
                    ]);
                }
            },

            getResult: function () {
                return result;
            }
        };
    };
})();

