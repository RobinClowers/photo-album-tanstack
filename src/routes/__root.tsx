import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import '@/styles/app.css'

import { Header } from '@/components/Header'

// Dev only: keeps /virtual:stylex.css in sync as modules (re)compile,
// including client-only routes compiled after the first stylesheet fetch.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  void import('virtual:stylex:runtime')
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Robinʼs Photos',
      },
    ],
    links: [
      // StyleX serves its collected rules from a virtual module in dev only;
      // in builds they are appended to app.css.
      ...(import.meta.env.DEV
        ? [{ rel: 'stylesheet', href: '/virtual:stylex.css' }]
        : []),
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
