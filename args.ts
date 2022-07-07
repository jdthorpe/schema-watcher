import { ArgumentParser } from "argparse";
import { resolve, join } from "path";

const parser = new ArgumentParser({
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
  help: `De-reference the Schema object (i.e. expand the '$ref' attributes).
        This may be required when the schema is nested within a larger
        document, but may increase memory usage and slow down validation.`,
});

interface Args {
  file: string;
  schema: string;
  query?: string;
  d?: boolean;
}

export const args: Args = parser.parse_args();
args.file = resolve(args.file); // join(process.cwd(), args.file)
args.schema = resolve(args.schema); // join(process.cwd(), args.schema)

export default args;
