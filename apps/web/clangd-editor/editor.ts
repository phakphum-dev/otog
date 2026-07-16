import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
// this is required syntax highlighting
import '@codingame/monaco-vscode-cpp-default-extension'
// these three imports are actually not required here,
// but the dynamic imports in monaco-editor-wrapper are otherwise blocking in a production build
// maybe this can ne overcome by using other config options
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import '@codingame/monaco-vscode-theme-defaults-default-extension'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import {
  LanguageClientConfig,
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper'
import { Uri } from 'vscode'
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from 'vscode-languageclient/browser'

import { FILE_PATH, LANGUAGE_ID, WORKSPACE_PATH } from './config'
import { setClangdStatus } from './ui'

// eslint-disable-next-line no-undef
const self = globalThis as any
self.MonacoEnvironment = {
  getWorker: () =>
    new Worker(
      new URL('vscode/vscode/vs/editor/editor.worker', import.meta.url),
      { type: 'module' }
    ),
}

let clientRunning = false
let retry = 0
let succeeded = false
const wrapper = new MonacoEditorLanguageClientWrapper()

export const createUserConfig = async (
  code: string,
  serverWorker: Worker,
  theme: string
): Promise<UserConfig> => {
  let languageClientConfig: LanguageClientConfig | undefined
  const recreateLsp = async () => {
    console.log('reloading lsp...')
    wrapper
      .getLanguageClientWrapper()
      ?.restartLanguageClient(serverWorker, false)
  }

  const restart = async () => {
    if (clientRunning) {
      try {
        clientRunning = false
        setClangdStatus('indeterminate')
        readerOnError.dispose()
        readerOnClose.dispose()
        wrapper
          .getLanguageClientWrapper()
          ?.restartLanguageClient(serverWorker, false)
      } finally {
        retry++
        if (retry > 5 && !succeeded) {
          setClangdStatus('disabled')
          console.error('Failed to start clangd after 5 retries')
          return
        }
        setTimeout(recreateLsp, 1000)
      }
    }
  }

  const reader = new BrowserMessageReader(serverWorker)
  const writer = new BrowserMessageWriter(serverWorker)
  const readerOnError = reader.onError(() => restart)
  const readerOnClose = reader.onClose(() => restart)
  const successCallback = reader.listen(() => {
    succeeded = true
    setClangdStatus('ready')
    successCallback.dispose()
  })

  languageClientConfig = {
    languageId: LANGUAGE_ID,
    name: 'Clangd WASM Language Server',
    options: {
      $type: 'WorkerDirect',
      worker: serverWorker,
    },
    clientOptions: {
      documentSelector: [LANGUAGE_ID],
      workspaceFolder: {
        index: 0,
        name: 'workspace',
        uri: Uri.file(WORKSPACE_PATH),
      },
    },
    connectionProvider: {
      get: async () => ({ reader, writer }),
    },
  }

  return {
    languageClientConfig,
    wrapperConfig: {
      serviceConfig: {
        workspaceConfig: {
          workspaceProvider: {
            trusted: true,
            workspace: {
              workspaceUri: Uri.file(WORKSPACE_PATH),
            },
            async open() {
              return false
            },
          },
        },
        userServices: {
          ...getConfigurationServiceOverride(),
          ...getTextmateServiceOverride(),
          ...getThemeServiceOverride(),
        },
        debugLogging: true,
      },
      editorAppConfig: {
        $type: 'extended',
        codeResources: {
          main: {
            text: code,
            uri: FILE_PATH,
          },
        },
        userConfiguration: {
          json: getUserConfigurationJson({ theme }),
        },
        useDiffEditor: false,
      },
    },
    loggerConfig: {
      enabled: true,
      debugEnabled: true,
    },
  }
}

export const createEditor = async (
  element: HTMLElement | null,
  userConfig: UserConfig
) => {
  if (!element) {
    console.error('element is not found')
    return
  }
  element.innerHTML = ''
  await wrapper.initAndStart(userConfig, element!)
  return wrapper
}

function getUserConfigurationJson({ theme }: { theme: string }): string {
  return JSON.stringify({
    'workbench.colorTheme': theme,
    'editor.wordBasedSuggestions': 'off',
    'editor.inlayHints.enabled': 'offUnlessPressed',
    'editor.quickSuggestionsDelay': 200,
  })
}
