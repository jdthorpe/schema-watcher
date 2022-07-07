"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.args = void 0;
var argparse_1 = require("argparse");
var path_1 = require("path");
var parser = new argparse_1.ArgumentParser({
    // version: "0.0.1",
    // addHelp: true,
    description: "Watch and validate JSON / YAML files",
});
parser.add_argument("-f", "--file", {
    help: "The data file to watch and validate",
    required: true,
});
parser.add_argument("-s", "--schema", {
    help: "Path to a schema file",
    required: true,
});
parser.add_argument("-q", "--query", {
    help: "JMESpath query to the schema if nested within a larger document",
});
parser.add_argument("-d", {
    action: "store_true",
    help: "De-reference the Schema object (i.e. expand the '$ref' attributes).\n        This may be required when the schema is nested within a larger\n        document, but may increase memory usage and slow down validation.",
});
exports.args = parser.parse_args();
exports.args.file = (0, path_1.resolve)(exports.args.file); // join(process.cwd(), args.file)
exports.args.schema = (0, path_1.resolve)(exports.args.schema); // join(process.cwd(), args.schema)
exports.default = exports.args;
