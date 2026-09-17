/** One-line hook registration for smoke scripts: `node --import ./scripts/test-hooks-register.mjs …` */
import { register } from "node:module";
register("./test-hooks.mjs", import.meta.url);
