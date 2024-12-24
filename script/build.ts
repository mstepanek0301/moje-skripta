import Mustache from 'mustache'
import Path from 'path'
import YAML from 'js-yaml'
import { Glob } from 'bun'

import { SOURCE_PATH, PUBLIC_PATH, LAYOUT_FILE } from './config.ts'
import functions from './functions.ts'

function readFrontmatter(text: string) {
  const separator = '---'
  const where = text.indexOf(separator, 1)
  return [
    text.slice(separator.length, where),
    text.slice(where + separator.length)
  ]
}

export async function build(path: string) {
  const
    inFile  = Bun.file(Path.join(SOURCE_PATH, path)),
    outFile = Bun.file(Path.join(PUBLIC_PATH, path))

  const [frontmatter, content] = readFrontmatter(await inFile.text())
  const data = {
    ...functions,
    ...YAML.load(frontmatter) as Object,
  }

  Bun.write(outFile, Mustache.render(layout, data, { body: content }))
}

const layout = await Bun.file(LAYOUT_FILE).text()

if (import.meta.main) {
  for await (const file of new Glob('**/*').scan(SOURCE_PATH)) {
    build(file)
  }
}
