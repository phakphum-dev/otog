import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'

const ClangdEditor = dynamic(
  () => import('../components/clangd-editor').then((mod) => mod.ClangdEditor),
  {
    ssr: false,
    loading: () => (
      <p className="flex items-center justify-center w-full h-[800px]">
        Loading...
      </p>
    ),
  }
)

const DEFAULT_SOURCE_CODE = `#include <iostream>

using namespace std;

int main() {
    return 0;
}`
export default function EditorPage() {
  const { resolvedTheme } = useTheme()

  return (
    <div className="container flex-1 pt-8">
      <div className="max-w-4xl rounded-md border overflow-hidden">
        <ClangdEditor
          className="h-[800px]"
          defaultValue={DEFAULT_SOURCE_CODE}
          theme={resolvedTheme === 'light' ? 'light' : 'dark'}
        />
      </div>
    </div>
  )
}
