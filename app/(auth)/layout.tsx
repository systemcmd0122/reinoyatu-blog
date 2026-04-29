interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout = async ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center py-10 px-4 md:py-32">
      <div className="w-full flex justify-center">{children}</div>
    </div>
  )
}

export default AuthLayout
