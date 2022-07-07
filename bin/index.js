#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const generate_1 = require("./generate");
commander_1.program
    .command("init")
    .description("Initialize config file")
    .action(() => {
    const configFilePath = path_1.default.join(process.cwd(), "gql-generator.json");
    if ((0, fs_1.existsSync)(configFilePath)) {
        console.error(chalk_1.default.yellow("[GQL-Generator]"), "gql-generator.json already exists");
        return;
    }
    (0, fs_1.writeFile)(configFilePath, JSON.stringify({
        clearOutputFolder: false,
        depthLimit: 3,
        graphql_api_url: "http://localhost:4000/graphql",
        outputFolder: "generated",
        generateMutations: true,
        generateQueries: true,
        generateSubscriptions: true,
    }, null, 2), () => {
        console.log(chalk_1.default.green("[GQL-Generator]"), `Config file created at ${configFilePath}`);
    });
});
commander_1.program.command("generate").description("Generate GQL files").action(generate_1.generate);
commander_1.program.parse(process.argv);
