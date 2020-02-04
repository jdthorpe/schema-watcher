#!/usr/bin/env node
import args from "./args";
import { dereference, bundle } from "json-schema-ref-parser";
import chokidar from "chokidar";
import chalk from "chalk";
import Ajv from "ajv";
import { readFileSync } from "fs";
import jq from "jmespath";
import emoji from "node-emoji";
import yaml from "js-yaml";

console.clear();
console.dir(args);

const AJV = new Ajv();

chokidar.watch(args.file).on("change", validate_file);
chokidar.watch(args.schema).on("change", validate_file);

function validate_file() {
    let raw: string;
    try {
        raw = readFileSync(args.file, "utf-8");
    } catch (err) {
        console.log("Failed to read " + args.file);
        return;
    }

    let data: any;
    try {
        data = yaml.safeLoad(raw);
    } catch (err) {
        console.log("Failed to parse " + args.file);
        return;
    }

    (args.dereference ? dereference : bundle)(
        args.file,
        {},
        (err, schema: any) => {
            console.clear();

            if (err) {
                console.log(`====================`);
                console.log(`Failed to parse ${args.file} with error:`);
                console.log(chalk.red(err.message));
                console.log(err.stack);
                console.log(`====================`);
            }
            do_work(schema, data, args.query);
        }
    );
}

function do_work(schema: any, data: any, query?: string) {
    if (query) {
        try {
            schema = jq.search(schema, query);
        } catch {
            console.log(
                `JMESpath '${query}'  does not exist in the provided schema`
            );
        }
    }

    // VALIDATE THE REQUEST BODY SCHEMA
    if (!AJV.validateSchema(schema)) {
        console.log(chalk.red("Invalid schema"));
        AJV.errors &&
            AJV.errors.map(e =>
                console.log(
                    `${chalk.bgBlue(e.dataPath)}: ${chalk.inverse(e.message)}`
                )
            );
        return;
    }

    if (!AJV.validate(schema, data)) {
        console.log(chalk.red("Data does not follow the schema"));
        AJV.errors &&
            AJV.errors.map(e =>
                console.log(
                    `'${chalk.bgBlue(e.dataPath)}': ${chalk.inverse(e.message)}`
                )
            );
    } else {
        console.log("It's all good!", emoji.get("thumbsup"));
    }
}

process.once("SIGINT", function(code) {
    process.exit();
});
process.once("SIGTERM", function(code) {
    process.exit();
});
