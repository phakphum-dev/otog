import { useTheme } from 'next-themes'
import { Highlight, Language, themes } from 'prism-react-renderer'

import { cn } from '@otog/ui/utils'

import { ClientOnly } from './client-only'

export interface CodeHighlightProps {
  code: string
  language: Language
  className?: string
}

export const CodeHighlight = (props: CodeHighlightProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <ClientOnly>
      <Highlight
        code={props.code ?? ''}
        language={props.language}
        theme={resolvedTheme === 'dark' ? themes.vsDark : themes.vsLight}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={{ ...style, tabSize: 4, counterReset: '' }}
            className={cn(
              className,
              'p-4 rounded-md overflow-x-auto text-xs',
              props.className
            )}
          >
            {tokens.map((line, i) => (
              <div {...getLineProps({ line })} key={i} className="table-row">
                <div className="table-cell pr-3 select-none text-muted-foreground text-right">
                  {i + 1}
                </div>
                <div className="table-cell">
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token })} key={key} />
                  ))}
                </div>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </ClientOnly>
  )
}
