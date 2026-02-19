"use client"

import { useState } from "react"
import { ref, set, get, type Database } from "firebase/database"

interface FirebaseTestProps {
  database: Database | undefined
}

export default function FirebaseTest({ database }: FirebaseTestProps) {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    if (!database) {
      setTestResult("Error: Database not initialized")
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      // Write test data
      const testRef = ref(database, "/test")
      const testData = {
        timestamp: Date.now(),
        message: "Test data from FirebaseTest component",
      }

      await set(testRef, testData)

      // Read test data
      const snapshot = await get(testRef)
      const data = snapshot.val()

      setTestResult(`Test successful! Data: ${JSON.stringify(data)}`)
    } catch (error: any) {
      setTestResult(`Test failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Firebase Connection Test</h2>
        <button
          onClick={runTest}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Run Test"}
        </button>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-md ${testResult.includes("failed") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
        >
          {testResult}
        </div>
      )}
    </div>
  )
}
