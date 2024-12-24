import Temml from 'temml'

import { TEX_PREAMBLE_FILE } from './config'

const macros = Temml.definePreamble(
  await Bun.file(TEX_PREAMBLE_FILE).text()
)

const renderMath = (displayMode: boolean) => (content: string) => Temml
  .renderToString(content, { displayMode, macros })

export default {
  math: () => renderMath(false),
  displayMath: () => renderMath(true),
}
