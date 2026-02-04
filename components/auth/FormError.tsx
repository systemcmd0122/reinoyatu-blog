'use client'

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"

interface FormErrorProps {
  message?: string
}

const FormError = ({ message }: FormErrorProps) => {
  useEffect(() => {
    if (message) {
      const element = document.querySelector('.error-container')
      element?.classList.add('shake')
      setTimeout(() => {
        element?.classList.remove('shake')
      }, 500)
    }
  }, [message])

  if (!message) return null

  return (
    <div className="error-container transition-all duration-300 ease-in-out transform">
      <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-md flex items-center gap-x-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive font-medium">{message}</p>
      </div>
      <style jsx>{`
        .shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

export default FormError
