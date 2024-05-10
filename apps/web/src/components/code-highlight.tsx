import { useTheme } from 'next-themes'
import { Highlight, Language, themes } from 'prism-react-renderer'

import { cn } from '@otog/ui'

export interface CodeHighlightProps {
  code: string
  language: Language
  className?: string
}

export const CodeHighlight = (props: CodeHighlightProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <Highlight
      code={props.code ?? ''}
      language={props.language}
      theme={resolvedTheme === 'light' ? themes.vsLight : themes.vsDark}
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
            <tr {...getLineProps({ line, key: i })} key={i}>
              <td className="pr-3 select-none text-muted-foreground text-right">
                {i + 1}
              </td>
              <td>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} key={key} />
                ))}
              </td>
            </tr>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
