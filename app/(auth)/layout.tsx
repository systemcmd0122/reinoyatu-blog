interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout = async ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex items-center justify-center py-32">{children}</div>
  )
}

export default AuthLayout
