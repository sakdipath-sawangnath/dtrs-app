// PageShell — wraps any page with the shared Header + Footer
// Usage:
//   <PageShell headerRight={<YourActions />}>
//     {children}
//   </PageShell>
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

interface PageShellProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  headerSubtitle?: string;
  /** Optional inner max-width container. Defaults to max-w-5xl. Pass false to disable. */
  constrained?: boolean | string;
}

export default function PageShell({
  children,
  headerRight,
  headerSubtitle,
  constrained = 'max-w-5xl',
}: PageShellProps) {
  const maxW = constrained === true ? 'max-w-5xl' : constrained || '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f6f2f0' }}>
      <SiteHeader right={headerRight} subtitle={headerSubtitle} />

      <main className="flex-1 px-4 py-6">
        <div className={`${maxW} mx-auto`}>
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
