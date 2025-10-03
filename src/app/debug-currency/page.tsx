import CurrencyDebugger from '@/components/debug/CurrencyDebugger'

export default function DebugCurrencyPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Currency Detection Debug</h1>
      <p className="text-gray-600 mb-6">
        This page helps debug currency detection issues. Check the console logs and the component output below.
      </p>
      <CurrencyDebugger />
    </div>
  )
}