import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mt-4 mb-2 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-3 mb-1 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mt-2 mb-1 first:mt-0">
            {children}
          </h4>
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="text-[var(--color-text-primary)] mb-3 last:mb-0 leading-relaxed">
            {children}
          </p>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-3 space-y-1 text-[var(--color-text-primary)]">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1 text-[var(--color-text-primary)]">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-[var(--color-text-primary)]">
            {children}
          </li>
        ),
        
        // Code
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text-secondary)]">
                {children}
              </code>
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-3 p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg overflow-x-auto">
            <code className="text-sm font-mono text-[var(--color-text-secondary)]">
              {children}
            </code>
          </pre>
        ),
        
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--color-border-hover)] pl-4 my-3 text-[var(--color-text-secondary)] italic">
            {children}
          </blockquote>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-node-user)] hover:underline"
          >
            {children}
          </a>
        ),
        
        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--color-text-primary)]">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="my-4 border-[var(--color-border)]" />
        ),
        
        // Table
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="min-w-full border border-[var(--color-border)] rounded-lg">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[var(--color-bg-tertiary)]">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-[var(--color-border)]">
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="divide-x divide-[var(--color-border)]">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            {children}
          </td>
        ),
        
        // Delete (strikethrough)
        del: ({ children }) => (
          <del className="line-through text-[var(--color-text-muted)]">
            {children}
          </del>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
