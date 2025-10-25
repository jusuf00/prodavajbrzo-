export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            &copy; {currentYear} ProdavajBrzo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}