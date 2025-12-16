import 'server-only';

function getDefault<T>(mod: any): T {
  return (mod?.default ?? mod) as T;
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const [{ unified }, remarkParseMod, remarkGfmMod, remarkRehypeMod, rehypeRawMod, rehypeSanitizeMod, rehypeStringifyMod] =
    await Promise.all([
      import('unified'),
      import('remark-parse'),
      import('remark-gfm'),
      import('remark-rehype'),
      import('rehype-raw'),
      import('rehype-sanitize'),
      import('rehype-stringify'),
    ]);

  const remarkParse = getDefault<any>(remarkParseMod);
  const remarkGfm = getDefault<any>(remarkGfmMod);
  const remarkRehype = getDefault<any>(remarkRehypeMod);
  const rehypeRaw = getDefault<any>(rehypeRawMod);
  const rehypeSanitize = getDefault<any>(rehypeSanitizeMod);
  const rehypeStringify = getDefault<any>(rehypeStringifyMod);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}
