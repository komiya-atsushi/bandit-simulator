var newSimulator = function (numArms, probabilities, numIteration) {
    var algorithms = [];
    var arms = [];

    var _i;
    for (_i = 0; _i < numArms; _i++) {
        arms.push(bandit.bernoulliArm(probabilities[_i]));
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

        softmax: function (temperature) {
            algorithms.push(bandit.algorithm({
                algorithm: "softmax",
                numArms: numArms,
                temperature: temperature
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

        simulate: function (callback) {
            // TODO iteration 回数に従って、setTimeout しながらの処理としたい

            var rewardsResult = {
                cumulativeReward: [],
                averageReward: []
            };
            var i;
            for (i = 0; i < algorithms.length; i++) {
                rewardsResult.cumulativeReward.push({
                    key: algorithms[i].name,
                    values: new Array(numIteration)
                });

                rewardsResult.averageReward.push({
                    key: algorithms[i].name,
                    values: new Array(numIteration)
                });
            }

            var j, algorithm, arm, reward;
            for (i = 0; i < numIteration; i++) {
                for (j = 0; j < algorithms.length; j++) {
                    algorithm = algorithms[j];
                    arm = algorithm.selectArm();

                    reward = arms[arm].draw() ? 1 : 0;
                    algorithm.update(arm, reward);

                    rewardsResult.cumulativeReward[j].values[i] = [
                        i + 1,
                        algorithm.totalReward()
                    ];
                    rewardsResult.averageReward[j].values[i] = [
                        i + 1,
                        algorithm.totalReward() / (i + 1)
                    ];
                }
            }

            callback(rewardsResult);
        }
    };
};