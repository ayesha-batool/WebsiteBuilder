import { useParams } from "react-router-dom"
import { AuthView } from "@daveyplate/better-auth-ui"

export default function AuthPage() {
  const { pathname } = useParams()

  return (
    <main className="p-6 flex flex-col items-center justify-center h-[80vh]">
      <AuthView
        pathname={pathname}
        classNames={{
          base: "bg-black/10 ring ring-indigo-900 text-white",
          header: "text-white",
          title: "text-white",
          description: "text-gray-300",
          content: "text-white",
          footer: "text-gray-300",
          footerLink: "text-white hover:text-indigo-300",
          form: {
            base: "text-white",
            label: "text-white",
            input: "text-white placeholder:text-gray-400 bg-white/10 border-white/20",
            forgotPasswordLink: "text-indigo-300 hover:text-indigo-200",
            primaryButton: "text-white bg-indigo-600 hover:bg-indigo-500",
          },
        }}
      />
    </main>
  )
}