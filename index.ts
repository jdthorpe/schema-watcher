import args from "./args";
import parser from "json-schema-ref-parser";
import chokidar from "chokidar";
import chalk from "chalk";
import Ajv from "ajv";
import { readFileSync } from "fs";
import jq from "jmespath";
import yaml from "js-yaml";

console.clear();
console.dir(args);

const AJV = new Ajv({ allErrors: true });

chokidar.watch(args.file).on("change", validate_file);
chokidar.watch(args.schema).on("change", validate_file);

let _ic = 0;
const colors: string[] = [
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white"
];

function next_color(): string {
    _ic = (_ic + 1) % colors.length;
    return colors[_ic];
}

validate_file();

function validate_file() {
    console.clear();
    let raw: string;
    console.log("Data file: " + args.file);
    console.log("Schema file " + args.schema);
    console.log(
        chalk.bgBlueBright.bold(`Last run at ${new Date().toLocaleString()}`)
    );
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

    if (args.d) {
        parser.dereference(args.schema, {}, (err, schema: any) => {
            if (err) {
                console.log(`====================`);
                console.log(`Failed to parse ${args.file} with error:`);
                console.log(chalk.bgRed(err.message));
                console.log(err.stack);
                console.log(`====================`);
                return;
            }
            do_work(schema, data, args.query);
        });
    } else {
        parser.bundle(args.schema, {}, (err, schema: any) => {
            if (err) {
                console.log(`====================`);
                console.log(`Failed to parse ${args.file} with error:`);
                console.log(chalk.bgRed(err.message));
                console.log(err.stack);
                console.log(`====================`);
                return;
            }
            do_work(schema, data, args.query);
        });
    }
}

function do_work(schema: any, data: any, query?: string) {
    if (query) {
        try {
            schema = jq.search(schema, query);
        } catch (err) {
            console.log(
                `JMESpath '${query}'  does not exist in the provided schema:`
            );
            console.error(err);
            return;
        }
    }

    // VALIDATE THE REQUEST BODY SCHEMA
    let schema_is_valid = true;
    try {
        schema_is_valid = AJV.validateSchema(schema);
    } catch (err) {
        schema_is_valid = false;
    }
    if (!schema_is_valid) {
        console.log(chalk.bgRed("Invalid schema"));
        if (args.query && !args.d) {
            console.log(
                chalk.bgGreen(
                    "This may occure when using json references in combinatoin with the query parameter.  Try setting the '-d' flag and re-starting"
                )
            );
        }
        AJV.errors &&
            AJV.errors.map(e =>
                console.log(
                    `${chalk.bgBlue(e.dataPath)}: ${chalk.inverse(e.message)}`
                )
            );
        return;
    }

    let data_is_valid = true;
    try {
        data_is_valid = AJV.validate(schema, data) as boolean;
    } catch (err) {
        console.log(chalk.bgRed("Invalid schema"));
        console.log("Error:", err.message);
        if (args.query && !args.d) {
            console.log(
                chalk.bgGreen.black(
                    "This may occure when using json references in combinatoin with the query parameter.  Try setting the '-d' flag and re-starting"
                )
            );
        }
        AJV.errors &&
            AJV.errors.map(e =>
                console.log(
                    `${chalk.bgBlue(e.dataPath)}: ${chalk.inverse(e.message)}`
                )
            );
        return;
    }

    if (!data_is_valid) {
        console.log(chalk.bgRed("Data does not follow the schema"));
        AJV.errors &&
            AJV.errors.map(e =>
                console.log(
                    `'${chalk.bgBlue(e.dataPath)}': ${chalk.inverse(e.message)}`
                )
            );
    } else {
        console.log("Data matches the schema!");
    }
}

process.once("SIGINT", function(code) {
    process.exit();
});
process.once("SIGTERM", function(code) {
    process.exit();
});
