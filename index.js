"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var args_1 = __importDefault(require("./args"));
var json_schema_ref_parser_1 = __importDefault(require("json-schema-ref-parser"));
var chokidar_1 = __importDefault(require("chokidar"));
var chalk_1 = __importDefault(require("chalk"));
var ajv_1 = __importDefault(require("ajv"));
var fs_1 = require("fs");
var jmespath_1 = __importDefault(require("jmespath"));
var js_yaml_1 = __importDefault(require("js-yaml"));
var AJV = new ajv_1.default({ allErrors: true });
chokidar_1.default.watch(args_1.default.file).on("change", validate_file);
chokidar_1.default.watch(args_1.default.schema).on("change", validate_file);
validate_file();
function validate_file() {
    console.clear();
    var raw;
    console.log(chalk_1.default.inverse("Data file") + ": " + args_1.default.file);
    console.log(chalk_1.default.inverse("Schema file") + ": " + args_1.default.schema);
    if (args_1.default.query) {
        console.log(chalk_1.default.inverse("Schema path") + ": " + args_1.default.query);
    }
    console.log(chalk_1.default.bgBlue.black("Last run at " + new Date().toLocaleString()));
    try {
        raw = fs_1.readFileSync(args_1.default.file, "utf-8");
    }
    catch (err) {
        console.log("Failed to read " + args_1.default.file);
        return;
    }
    var data;
    try {
        data = js_yaml_1.default.safeLoad(raw);
    }
    catch (err) {
        console.log("Failed to parse " + args_1.default.file);
        return;
    }
    if (args_1.default.d) {
        json_schema_ref_parser_1.default.dereference(args_1.default.schema, {}, function (err, schema) {
            if (err) {
                console.log(chalk_1.default.bgRed.black(err.message));
                console.log(err.stack);
                return;
            }
            do_work(schema, data, args_1.default.query);
        });
    }
    else {
        json_schema_ref_parser_1.default.bundle(args_1.default.schema, {}, function (err, schema) {
            if (err) {
                console.log(chalk_1.default.bgRed.black(err.message));
                console.log(err.stack);
                return;
            }
            do_work(schema, data, args_1.default.query);
        });
    }
}
function do_work(schema, data, query) {
    if (query) {
        try {
            schema = jmespath_1.default.search(schema, query);
        }
        catch (err) {
            console.log("JMESpath '" + query + "'  does not exist in the provided schema:");
            console.error(err);
            return;
        }
    }
    // VALIDATE THE REQUEST BODY SCHEMA
    var schema_is_valid = true;
    try {
        schema_is_valid = AJV.validateSchema(schema);
    }
    catch (err) {
        schema_is_valid = false;
    }
    if (!schema_is_valid) {
        console.log(chalk_1.default.bgRed.black("Invalid schema"));
        if (args_1.default.query && !args_1.default.d) {
            console.log(chalk_1.default.bgGreen("This may occure when using json references in combinatoin with the query parameter.  Try setting the '-d' flag and re-starting"));
        }
        AJV.errors &&
            AJV.errors.map(function (e) {
                return console.log(chalk_1.default.bgBlue(e.dataPath) + ": " + chalk_1.default.inverse(e.message));
            });
        return;
    }
    var data_is_valid = true;
    try {
        data_is_valid = AJV.validate(schema, data);
    }
    catch (err) {
        console.log(chalk_1.default.bgRed.black("Invalid schema"));
        console.log("Error:", err.message);
        if (args_1.default.query && !args_1.default.d) {
            console.log(chalk_1.default.bgGreen.black("This may occure when using json references in combinatoin with the query parameter.  Try setting the '-d' flag and re-starting"));
        }
        AJV.errors &&
            AJV.errors.map(function (e) {
                return console.log(chalk_1.default.bgBlue(e.dataPath) + ": " + chalk_1.default.inverse(e.message));
            });
        return;
    }
    if (!data_is_valid) {
        console.log(chalk_1.default.black.bgRed("Data does not follow the schema"));
        AJV.errors &&
            AJV.errors.map(function (e) {
                return console.log("'" + chalk_1.default.bgBlue(e.dataPath) + "': " + chalk_1.default.inverse(e.message));
            });
    }
    else {
        console.log("Data matches the schema!");
    }
}
process.once("SIGINT", function () { return process.exit(); });
process.once("SIGTERM", function () { return process.exit(); });
