import "./globals.css";
export const metadata = { title: "BrandSentinel" };
export default function L({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><div className="wrap">
    <nav><a href="/">Review</a><a href="/kb">Knowledge Base &amp; Insights</a><a href="/history">History &amp; Diff</a></nav>
    {children}</div></body></html>;
}