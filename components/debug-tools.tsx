"use client"

import { useState } from "react"
import { addSampleHistoryData, populateHistoryData } from "@/lib/firebase-helpers"

export default function DebugTools() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleAddSampleData = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const success = await addSampleHistoryData()
      if (success) {
        setMessage("Sample data point added successfully!")
      } else {
        setMessage("Failed to add sample data")
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePopulateData = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const success = await populateHistoryData(24)
      if (success) {
        setMessage("24 sample data points added successfully!")
      } else {
        setMessage("Failed to add sample data")
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-4">Debug Tools</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleAddSampleData}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md disabled:opacity-50"
        >
          Add Sample Data Point
        </button>

        <button
          onClick={handlePopulateData}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md disabled:opacity-50"
        >
          Populate 24 Hours of Data
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
          Processing...
        </div>
      )}

      {message && (
        <div
          className={`p-2 rounded-md ${message.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
        >
          {message}
        </div>
      )}
    </div>
  )
}
