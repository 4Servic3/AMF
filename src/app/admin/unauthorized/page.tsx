export default function UnauthorizedPage() {
  return (
    <div className="text-center space-y-4">
      <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
      <p className="text-sm text-gray-600">You do not have permission to view this page.</p>
      <a href="/admin/login" className="inline-block rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white">
        Return to Login
      </a>
    </div>
  )
}
