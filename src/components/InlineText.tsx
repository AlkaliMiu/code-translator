/** Renders text, turning `backtick` spans (common in explanations) into inline code. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`)/g)
  return (
    <>
      {parts.map((part, index) =>
        part.length > 2 && part.startsWith('`') && part.endsWith('`')
          ? <code key={index}>{part.slice(1, -1)}</code>
          : part,
      )}
    </>
  )
}
