export interface InlineComponentProps {
  render: () => React.ReactNode
}

export function InlineComponent({ render }: InlineComponentProps) {
  return render()
}
