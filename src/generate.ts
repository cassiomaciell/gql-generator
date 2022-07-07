import { buildOperationNodeForField } from "@graphql-tools/utils";
import chalk from "chalk";
import { paramCase, pascalCase } from "change-case";
import fetch from "cross-fetch";
import { existsSync, readFileSync } from "fs";
import { emptyDir, outputFileSync } from "fs-extra";
import {
	buildClientSchema,
	getIntrospectionQuery,
	GraphQLSchema,
	OperationDefinitionNode,
	OperationTypeNode,
	print,
} from "graphql";
import path from "path";

export type ConfigType = {
	graphql_api_url: string;
	depthLimit: number;
	outputFolder: string;
	clearOutputFolder: boolean;
	generateQueries: boolean;
	generateMutations: boolean;
	generateSubscriptions: boolean;
};

export function generate() {
	const configFilePath = path.join(process.cwd(), "gql-generator.json");

	if (!existsSync(configFilePath)) {
		console.error(chalk.yellow("[GQL-Generator]"), "gql-generator.json not found");
		console.error(chalk.yellow("[GQL-Generator]"), 'Run "gql-generator init" to create it');
		return;
	}

	const config: ConfigType = JSON.parse(readFileSync(configFilePath).toString());

	const output = path.join(process.cwd(), config.outputFolder);

	if (config.clearOutputFolder) {
		emptyDir(output);
	}

	fetch(config.graphql_api_url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query: getIntrospectionQuery(),
		}),
	})
		.then<{ data: any }>((res) => res.json())
		.then((res) => {
			const schema = buildClientSchema(res.data);

			let mutations = schema.getMutationType()?.getFields() || [];
			let queries = schema.getQueryType()?.getFields() || [];
			let subscriptions = schema.getSubscriptionType()?.getFields() || [];

			function saveOperations(name: string, operations: OperationDefinitionNode[]) {
				console.log(chalk.green("[GQL-Generator]"), `Generating ${operations.length} ${name}`);
				operations.forEach((operation) => {
					let operationRenamed: OperationDefinitionNode = {
						...operation,
						name: {
							value: pascalCase(operation.name.value.split(`_${operation.operation}`)[0]),
							kind: operation.name.kind,
							loc: operation.name.loc,
						},
					};
					outputFileSync(
						path.join(output, name, `/${paramCase(operationRenamed.name.value)}.gql`),
						print(operationRenamed)
					);
				});
			}

			if (config.generateMutations) {
				saveOperations("mutations", toFieldsToOperations(schema, Object.keys(mutations), OperationTypeNode.MUTATION));
			}

			if (config.generateQueries) {
				saveOperations("queries", toFieldsToOperations(schema, Object.keys(queries), OperationTypeNode.QUERY));
			}

			if (config.generateSubscriptions) {
				saveOperations(
					"subscriptions",
					toFieldsToOperations(schema, Object.keys(subscriptions), OperationTypeNode.SUBSCRIPTION)
				);
			}
			console.log(chalk.green("[GQL-Generator]"), "Done");
		})
		.catch((e) => {
			console.error(e);
		});

	function toFieldsToOperations(schema: GraphQLSchema, fields: string[], kind: OperationTypeNode) {
		return fields.map((field) => {
			return buildOperationNodeForField({
				field,
				schema,
				kind,
				circularReferenceDepth: 0,
				depthLimit: config.depthLimit,
			});
		});
	}
}
