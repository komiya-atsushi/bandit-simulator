var bandit = (function () {
    /**
     * 腕に関する統計情報を保持するオブジェクトを生成して返却します。
     *
     * @param numArms 腕の本数を指定します
     * @returns {{update: update, usedCount: usedCount, reward: reward, expectedValue: expectedValue}}
     */
    var newArmStats = function (numArms) {
        var usedCounts = [];
        var rewards = [];

        var _i;
        for (_i = 0; _i < numArms; _i++) {
            usedCounts.push(0);
            rewards.push(0);
        }

        return {
            update: function (arm, reward) {
                usedCounts[arm]++;
                rewards[arm] += reward;
            },

            usedCount: function (arm) {
                return usedCounts[arm];
            },

            reward: function (arm) {
                return rewards[arm];
            },

            totalReward: function () {
                var i, result = 0;
                for (i = 0; i < numArms; i++) {
                    result += rewards[i];
                }

                return result;
            },

            expectedValue: function (arm) {
                if (usedCounts[arm] == 0) {
                    return 0;
                }

                return rewards[arm] / usedCounts[arm];
            }
        }
    };

    /**
     * ε-Greedy により腕を選択するオブジェクトを生成して返却します。
     *
     * @param numArms 腕の本数を指定します
     * @param epsilon 探索をする確率 ε を指定します
     * @returns {{id: string, name: string, update: update, selectArm: selectArm}}
     */
    var newEpsilonGreedy = function (numArms, epsilon) {
        var armStats = newArmStats(numArms);

        return {
            id: "epsilonGreedy",
            name: "ε-Greedy",

            update: function (arm, reward) {
                armStats.update(arm, reward);
            },

            totalReward: function () {
                return armStats.totalReward();
            },

            selectArm: function () {
                var r = Math.random();
                if (r < epsilon) {
                    return Math.floor(Math.random() * numArms);
                }

                var i, maxExpectedValue = -1, maxArm, expectedValue;
                for (i = 0; i < numArms; i++) {
                    expectedValue = armStats.expectedValue(i);

                    if (maxExpectedValue < expectedValue) {
                        maxExpectedValue = expectedValue;
                        maxArm = i;
                    }
                }

                return maxArm;
            }
        };
    };

    /**
     * Softmax により腕を選択するオブジェクトを生成して返却します。
     *
     * @param numArms 腕の本数を指定します
     * @param temperature 活用と探索の度合いを調整する温度パラメータを指定します。小さい値であるほど、活用をします。
     * @returns {{id: string, name: string, update: update, selectArm: selectArm}}
     */
    var newSoftmax = function (numArms, temperature) {
        var armStats = newArmStats(numArms);

        return {
            id: "softmax",
            name: "Softmax",

            update: function (arm, reward) {
                armStats.update(arm, reward);
            },

            totalReward: function () {
                return armStats.totalReward();
            },

            selectArm: function () {
                var i, v, ranges = [], total = 0;
                for (i = 0; i < numArms; i++) {
                    v = Math.exp(armStats.expectedValue(i) / temperature);
                    ranges.push(v);
                    total += v;
                }

                var x = Math.random() * total;
                for (i = 0; i < numArms; i++) {
                    if (x < ranges[i]) {
                        return i;
                    }

                    x -= ranges[i];
                }

                throw "There may be a bug.";
            }
        }
    };

    /**
     * UCB1 により腕を選択するオブジェクトを生成して返却します。
     *
     * @param numArms 腕の本数を指定します
     * @returns {{id: string, name: string, update: update, selectArm: selectArm}}
     */
    var newUCB1 = function (numArms) {
        var armStats = newArmStats(numArms);
        var totalUsedCount = 0;

        return {
            id: "ucb1",
            name: "UCB1",

            update: function (arm, reward) {
                totalUsedCount++;
                armStats.update(arm, reward);
            },

            totalReward: function () {
                return armStats.totalReward();
            },

            selectArm: function () {
                var i, usedCount, bonus, value, maxValue = -1, maxArm;
                for (i = 0; i < numArms; i++) {
                    usedCount = armStats.usedCount(i);
                    if (usedCount == 0) {
                        return i;
                    }

                    bonus = Math.sqrt(2 * Math.log(totalUsedCount) / usedCount);
                    value = armStats.expectedValue(i) + bonus;

                    if (maxValue < value) {
                        maxValue = value;
                        maxArm = i;
                    }
                }

                return maxArm;
            }
        }
    };

    var newThompsonSampling = function (numArms) {
        // 以下のベータ分布に従う乱数の生成は、下記サイトを参考に実装しています。
        // http://stackoverflow.com/questions/9590225/is-there-a-library-to-generate-random-numbers-according-to-a-beta-distribution-f

        var SG_MAGICCONST = 1 + Math.log(4.5);
        var LOG4 = Math.log(4.0);

        var randomGamma = function (alpha, beta) {
            var x, v;
            // does not check that alpha > 0 && beta > 0
            if (alpha > 1) {
                // Uses R.C.H. Cheng, "The generation of Gamma variables with non-integral
                // shape parameters", Applied Statistics, (1977), 26, No. 1, p71-74
                var ainv = Math.sqrt(2.0 * alpha - 1.0);
                var bbb = alpha - LOG4;
                var ccc = alpha + ainv;

                while (true) {
                    var u1 = Math.random();
                    if (!((1e-7 < u1) && (u1 < 0.9999999))) {
                        continue;
                    }
                    var u2 = 1.0 - Math.random();
                    v = Math.log(u1/(1.0-u1))/ainv;
                    x = alpha*Math.exp(v);
                    var z = u1*u1*u2;
                    var r = bbb+ccc*v-x;
                    if (r + SG_MAGICCONST - 4.5*z >= 0.0 || r >= Math.log(z)) {
                        return x * beta;
                    }
                }
            }
            else if (alpha == 1.0) {
                var u = Math.random();
                while (u <= 1e-7) {
                    u = Math.random();
                }
                return -Math.log(u) * beta;
            }
            else { // 0 < alpha < 1
                // Uses ALGORITHM GS of Statistical Computing - Kennedy & Gentle
                while (true) {
                    var u3 = Math.random();
                    var b = (Math.E + alpha)/Math.E;
                    var p = b*u3;
                    if (p <= 1.0) {
                        x = Math.pow(p, (1.0/alpha));
                    }
                    else {
                        x = -Math.log((b-p)/alpha);
                    }
                    var u4 = Math.random();
                    if (p > 1.0) {
                        if (u4 <= Math.pow(x, (alpha - 1.0))) {
                            break;
                        }
                    }
                    else if (u4 <= Math.exp(-x)) {
                        break;
                    }
                }
                return x * beta;
            }
        };

        var randomBeta = function (alpha, beta) {
            var alpha_gamma = randomGamma(alpha, 1);
            return alpha_gamma / (alpha_gamma + randomGamma(beta, 1));
        };

        var armStats = newArmStats(numArms);

        return {
            id: "ts",
            name: "Thompson sampling",

            update: function (arm, reward) {
                armStats.update(arm, reward);
            },

            totalReward: function () {
                return armStats.totalReward();
            },

            selectArm: function () {
                var i, usedCount, reward, randomValue, maxRandomValue = -1, maxArm;

                for (i = 0; i < numArms; i++) {
                    usedCount = armStats.usedCount(i);
                    reward = armStats.reward(i);

                    if (usedCount - reward == 0 || reward == 0) {
                        return i;
                    }

                    randomValue = randomBeta(reward, usedCount - reward);
                    if (maxRandomValue < randomValue) {
                        maxRandomValue = randomValue;
                        maxArm = i;
                    }
                }

                return maxArm;
            }
        };
    };

    return {
        algorithm: function (params) {
            var algorithm = params["algorithm"];
            var numArms = params["numArms"];
            switch (algorithm) {
                case "epsilon-greedy":
                    return newEpsilonGreedy(numArms, params["epsilon"]);

                case "softmax":
                    return newSoftmax(numArms, params["temperature"]);

                case "ucb1":
                    return newUCB1(numArms);

                case "thompson":
                    return newThompsonSampling(numArms);

                default:
                    throw "Unsupported algorithm : " + algorithm;
            }
        },

        bernoulliArm: function (probability) {
            return {
                draw: function () {
                    return Math.random() < probability;
                }
            };
        }
    };
})();
