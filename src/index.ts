#! /usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
import { existsSync, writeFile, writeFileSync } from "fs";
import path from "path";
import { ConfigType, generate } from "./generate";

program
	.command("init")
	.description("Initialize config file")
	.action(() => {
		const configFilePath = path.join(process.cwd(), "gql-generator.json");
		if (existsSync(configFilePath)) {
			console.error(chalk.yellow("[GQL-Generator]"), "gql-generator.json already exists");
			return;
		}
		writeFile(
			configFilePath,
			JSON.stringify(
				{
					clearOutputFolder: false,
					depthLimit: 3,
					graphql_api_url: "http://localhost:4000/graphql",
					outputFolder: "generated",
					generateMutations: true,
					generateQueries: true,
					generateSubscriptions: true,
				} as ConfigType,
				null,
				2
			),
			() => {
				console.log(chalk.green("[GQL-Generator]"), `Config file created at ${configFilePath}`);
			}
		);
	});
program.command("generate").description("Generate GQL files").action(generate);

program.parse(process.argv);
