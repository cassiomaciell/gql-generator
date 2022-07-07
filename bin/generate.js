"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const utils_1 = require("@graphql-tools/utils");
const chalk_1 = __importDefault(require("chalk"));
const change_case_1 = require("change-case");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const graphql_1 = require("graphql");
const path_1 = __importDefault(require("path"));
function generate() {
    const configFilePath = path_1.default.join(process.cwd(), "gql-generator.json");
    if (!(0, fs_1.existsSync)(configFilePath)) {
        console.error(chalk_1.default.yellow("[GQL-Generator]"), "gql-generator.json not found");
        console.error(chalk_1.default.yellow("[GQL-Generator]"), 'Run "gql-generator init" to create it');
        return;
    }
    const config = JSON.parse((0, fs_1.readFileSync)(configFilePath).toString());
    const output = path_1.default.join(process.cwd(), config.outputFolder);
    if (config.clearOutputFolder) {
        (0, fs_extra_1.emptyDir)(output);
    }
    (0, cross_fetch_1.default)(config.graphql_api_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: (0, graphql_1.getIntrospectionQuery)(),
        }),
    })
        .then((res) => res.json())
        .then((res) => {
        var _a, _b, _c;
        const schema = (0, graphql_1.buildClientSchema)(res.data);
        let mutations = ((_a = schema.getMutationType()) === null || _a === void 0 ? void 0 : _a.getFields()) || [];
        let queries = ((_b = schema.getQueryType()) === null || _b === void 0 ? void 0 : _b.getFields()) || [];
        let subscriptions = ((_c = schema.getSubscriptionType()) === null || _c === void 0 ? void 0 : _c.getFields()) || [];
        function saveOperations(name, operations) {
            console.log(chalk_1.default.green("[GQL-Generator]"), `Generating ${operations.length} ${name}`);
            operations.forEach((operation) => {
                let operationRenamed = Object.assign(Object.assign({}, operation), { name: {
                        value: (0, change_case_1.pascalCase)(operation.name.value.split(`_${operation.operation}`)[0]),
                        kind: operation.name.kind,
                        loc: operation.name.loc,
                    } });
                (0, fs_extra_1.outputFileSync)(path_1.default.join(output, name, `/${(0, change_case_1.paramCase)(operationRenamed.name.value)}.gql`), (0, graphql_1.print)(operationRenamed));
            });
        }
        if (config.generateMutations) {
            saveOperations("mutations", toFieldsToOperations(schema, Object.keys(mutations), graphql_1.OperationTypeNode.MUTATION));
        }
        if (config.generateQueries) {
            saveOperations("queries", toFieldsToOperations(schema, Object.keys(queries), graphql_1.OperationTypeNode.QUERY));
        }
        if (config.generateSubscriptions) {
            saveOperations("subscriptions", toFieldsToOperations(schema, Object.keys(subscriptions), graphql_1.OperationTypeNode.SUBSCRIPTION));
        }
        console.log(chalk_1.default.green("[GQL-Generator]"), "Done");
    })
        .catch((e) => {
        console.error(e);
    });
    function toFieldsToOperations(schema, fields, kind) {
        return fields.map((field) => {
            return (0, utils_1.buildOperationNodeForField)({
                field,
                schema,
                kind,
                circularReferenceDepth: 0,
                depthLimit: config.depthLimit,
            });
        });
    }
}
exports.generate = generate;
