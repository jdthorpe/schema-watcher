"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var argparse_1 = require("argparse");
var path_1 = require("path");
var parser = new argparse_1.ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: "Watch and validate JSON / YAML files"
});
parser.addArgument(["-f", "--file"], {
    help: "The data file to watch and validate",
    required: true
});
parser.addArgument(["-s", "--schema"], {
    help: "Path to a schema file",
    required: true
});
parser.addArgument(["-q", "--query"], {
    help: "JMESpath query to the schema if nested within a larger document"
});
parser.addArgument(["-d"], {
    action: "storeTrue",
    help: "De-reference the Schema object (i.e. expand the '$ref' attributes).\n        This may be required when the schema is nested within a larger\n        document, but may increase memory usage and slow down validation.",
    metavar: "dereference"
});
exports.args = parser.parseArgs();
exports.args.file = path_1.resolve(path_1.join(process.cwd(), exports.args.file));
exports.args.schema = path_1.resolve(path_1.join(process.cwd(), exports.args.schema));
exports.default = exports.args;
