"use client"

interface DebugPanelProps {
  logs: string[]
  onClear: () => void
  onTest: () => void
}

export default function DebugPanel({ logs, onClear, onTest }: DebugPanelProps) {
  return (
    <div className="bg-gray-800 text-green-400 p-4 rounded-lg mb-8 font-mono text-sm overflow-auto max-h-60">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold">Debug Console</h3>
        <div>
          <button
            onClick={onTest}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs mr-2"
          >
            Test Firebase
          </button>
          <button onClick={onClear} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs">
            Clear
          </button>
        </div>
      </div>
      <div>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              &gt; {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
