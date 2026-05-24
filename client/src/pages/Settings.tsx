import {
  AccountSettingsCards,
  ChangePasswordCard,
  DeleteAccountCard,
} from "@daveyplate/better-auth-ui"

const cardClassNames = {
  base: "bg-black/10 ring ring-indigo-950 max-w-xl mx-auto w-full text-white",
  header: "text-white",
  title: "text-white",
  description: "text-gray-300",
  content: "text-white",
  footer: "bg-black/10 ring ring-indigo-950 text-white",
  label: "text-white",
  input: "text-white placeholder:text-gray-400 bg-white/10 border-white/20",
  instructions: "text-gray-300",
  error: "text-red-300",
  button: "text-black bg-white hover:bg-gray-100",
  primaryButton: "text-white bg-indigo-600 hover:bg-indigo-500",
}

const Settings = () => {
  return (
    <div className="w-full p-4 flex justify-center items-center min-h-[90vh] account-settings-page flex-col gap-6 py-12">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <AccountSettingsCards classNames={{ card: cardClassNames }} />
        <ChangePasswordCard classNames={cardClassNames} />
        <DeleteAccountCard classNames={cardClassNames} />
      </div>
    </div>
  )
}

export default Settings