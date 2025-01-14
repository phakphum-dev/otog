import { tsupDevServer } from '@softnetics/dev-server'
import { build } from 'tsup'

build({
  watch: ['./src'],
  onSuccess: tsupDevServer({
    command:
      'exec node --env-file=.env.dev --env-file=.env --enable-source-maps dist/index.js',
  }),
})
