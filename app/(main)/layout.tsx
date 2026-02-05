interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = async ({ children }: MainLayoutProps) => {
  return <main className="mx-auto max-w-screen-2xl px-4 md:px-8">{children}</main>
}

export default MainLayout
