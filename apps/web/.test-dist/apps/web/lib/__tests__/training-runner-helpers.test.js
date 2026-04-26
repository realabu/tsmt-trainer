"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const training_runner_helpers_1 = require("../training-runner-helpers");
(0, node_test_1.default)("formatDuration handles zero seconds", () => {
    strict_1.default.equal((0, training_runner_helpers_1.formatDuration)(0), "0:00");
});
(0, node_test_1.default)("formatDuration preserves current null-like behavior", () => {
    strict_1.default.equal((0, training_runner_helpers_1.formatDuration)(null), "0:00");
});
(0, node_test_1.default)("formatDuration handles large numbers", () => {
    strict_1.default.equal((0, training_runner_helpers_1.formatDuration)(3671), "61:11");
});
(0, node_test_1.default)("initialsFromTitle handles one word", () => {
    strict_1.default.equal((0, training_runner_helpers_1.initialsFromTitle)("Labda"), "L");
});
(0, node_test_1.default)("initialsFromTitle handles two words", () => {
    strict_1.default.equal((0, training_runner_helpers_1.initialsFromTitle)("labda dobas"), "LD");
});
(0, node_test_1.default)("initialsFromTitle handles empty input", () => {
    strict_1.default.equal((0, training_runner_helpers_1.initialsFromTitle)(""), "");
});
(0, node_test_1.default)("buildRingStyle handles 0 percent", () => {
    strict_1.default.deepEqual((0, training_runner_helpers_1.buildRingStyle)(0, 100, "#fff"), {
        background: "conic-gradient(#fff 0%, rgba(255,255,255,0.18) 0% 100%)",
    });
});
(0, node_test_1.default)("buildRingStyle handles 50 percent", () => {
    strict_1.default.deepEqual((0, training_runner_helpers_1.buildRingStyle)(50, 100, "#fff"), {
        background: "conic-gradient(#fff 50%, rgba(255,255,255,0.18) 50% 100%)",
    });
});
(0, node_test_1.default)("buildRingStyle handles 100 percent", () => {
    strict_1.default.deepEqual((0, training_runner_helpers_1.buildRingStyle)(100, 100, "#fff"), {
        background: "conic-gradient(#fff 100%, rgba(255,255,255,0.18) 100% 100%)",
    });
});
