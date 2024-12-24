import { watch } from 'fs'

import { build } from './build';
import { SOURCE_PATH } from './config'

const watcher = watch(
  SOURCE_PATH,
  { recursive: true },
  async (_event, filename) => {
    if (!filename) return
    await build(filename)
    // TODO: handle if file is deleted
  },
);

process.on("SIGINT", () => {
  watcher.close();
  process.exit(0);
});
