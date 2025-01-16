nohup: ignoring input

> eliza@ start /home/ubuntu/eliza
> pnpm --filter "@elizaos/agent" start --isRoot "--character=/home/ubuntu/eliza/characters/eternalai.character.json"


> @elizaos/agent@0.1.8+build.1 start /home/ubuntu/eliza/agent
> node --loader ts-node/esm src/index.ts "--isRoot" "--character=/home/ubuntu/eliza/characters/eternalai.character.json"

(node:2278915) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:2278915) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
