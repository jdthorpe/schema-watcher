import args from "./args";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import chokidar from "chokidar";
import chalk from "chalk";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import addKeywords from "ajv-keywords";
import { readFileSync } from "fs";
import jq from "jmespath";
import yaml from "js-yaml";

$RefParser.dereference = $RefParser.dereference.bind($RefParser);
$RefParser.resolve = $RefParser.resolve.bind($RefParser);

const AJV = new Ajv({ allErrors: true, $data: true });
addFormats(AJV);
addKeywords(AJV);

chokidar.watch(args.file).on("change", validate_file);
chokidar.watch(args.schema).on("change", validate_file);

validate_file();

function validate_file() {
  console.clear();
  let raw: string;
  console.log(`${chalk.inverse("Data file")}: ${args.file}`);
  console.log(`${chalk.inverse("Schema file")}: ${args.schema}`);
  if (args.query) {
    console.log(`${chalk.inverse("Schema path")}: ${args.query}`);
  }
  console.log(chalk.bgBlue.black(`Last run at ${new Date().toLocaleString()}`));
  try {
    raw = readFileSync(args.file, "utf-8");
  } catch (err) {
    console.log("Failed to read " + args.file);
    return;
  }

  let data: any;
  try {
    data = yaml.load(raw);
  } catch (err) {
    console.log("Failed to parse " + args.file);
    return;
  }

  if (args.d) {
    $RefParser.dereference(
      args.schema,
      {},
      (err: Error | null, schema: any) => {
        if (err) {
          console.log(chalk.bgRed.black(err.message));
          console.log(err.stack);
          return;
        }
        do_work(schema, data, args.query);
      }
    );
  } else {
    $RefParser.bundle(args.schema, {}, (err: Error | null, schema: any) => {
      if (err) {
        console.log(chalk.bgRed.black(err.message));
        console.log(err.stack);
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
      if (/^[-a-zA-Z]*$/.test(query)) {
        try {
          schema = jq.search(schema, `"${query}"`);
        } catch {
          console.log(
            `Failed with error: JMESpath '${query}'  does not exist in the provided schema`
          );
          console.log(
            `this usually occures when there are special characters (e.g. "-") in the query string. Quote the string where appropriate.`
          );
          console.error(err);
          return;
        }
      } else {
        console.log(
          `Failed with error: JMESpath '${query}'  does not exist in the provided schema`
        );
        console.log(
          `this usually occures when there are special characters (e.g. "-") in the query string. Quote the string where appropriate.`
        );
        console.error(err);
        return;
      }
    }
  }

  if (schema === null) {
    console.log("null schema: check your query string");
    return;
  }
  // VALIDATE THE REQUEST BODY SCHEMA
  let schema_is_valid = true;
  try {
    schema_is_valid = AJV.validateSchema(schema) as boolean;
  } catch (err) {
    schema_is_valid = false;
  }
  if (!schema_is_valid) {
    console.log(chalk.bgRed.black("Invalid schema"));

    if (args.query && !args.d) {
      console.log(
        chalk.bgGreen(
          "This may occure when using json references in combination with the query parameter.  Try setting the '-d' flag and re-starting"
        )
      );
    }
    AJV.errors &&
      AJV.errors.map((e) =>
        console.log(
          `- ${chalk.bgBlue(e.instancePath)}: ${chalk.inverse(e.message)}`
        )
      );
    return;
  }

  let data_is_valid = true;
  try {
    data_is_valid = AJV.validate(schema, data) as boolean;
  } catch (err) {
    console.log(chalk.bgRed.black("Invalid data+schema"));
    console.log("Error:", (err as Error).message);

    if (args.query && !args.d) {
      console.log(
        chalk.bgGreen.black(
          "This may occure when using json references in combination with the query parameter.  Try setting the '-d' flag and re-starting"
        )
      );
    }
    AJV.errors &&
      AJV.errors.map((e) =>
        console.log(
          `${chalk.bgBlue(e.instancePath)}: ${chalk.inverse(e.message)}`
        )
      );
    return;
  }

  if (!data_is_valid) {
    console.log(chalk.black.bgRed("Data does not follow the schema"));
    AJV.errors &&
      AJV.errors.map((e) =>
        console.log(
          `'${chalk.bgBlue(e.instancePath)}': ${chalk.inverse(e.message)}`
        )
      );
  } else {
    console.log("Data matches the schema!");
  }
}

process.once("SIGINT", () => process.exit());
process.once("SIGTERM", () => process.exit());
