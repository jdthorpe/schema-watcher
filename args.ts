import { ArgumentParser } from "argparse";
import { resolve, join } from "path";

const parser = new ArgumentParser({
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
    help: `De-reference the Schema object (i.e. expand the '$ref' attributes).
        This may be required when the schema is nested within a larger
        document, but may increase memory usage and slow down validation.`,
    metavar: "dereference"
});

interface Args {
    file: string;
    schema: string;
    query?: string;
    d?: boolean;
}

export const args: Args = parser.parseArgs();
args.file = resolve(join(process.cwd(), args.file));
args.schema = resolve(join(process.cwd(), args.schema));

export default args;
