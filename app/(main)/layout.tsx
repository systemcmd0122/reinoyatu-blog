interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = async ({ children }: MainLayoutProps) => {
  return <div className="mx-auto max-w-screen-2xl px-4 md:px-8 my-10">{children}</div>
}

export default MainLayout
