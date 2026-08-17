export default function SessionExpiredPage() {
  return (
    <div className="text-center space-y-4">
      <h3 className="text-lg font-medium text-yellow-600">Session Expired</h3>
      <p className="text-sm text-gray-600">Your session has expired. Please log in again.</p>
      <a href="/admin/login" className="inline-block rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white">
        Log In
      </a>
    </div>
  )
}
