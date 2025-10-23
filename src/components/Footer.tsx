export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 border-t border-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-600">
              &copy; {currentYear} ProdavajBrzo. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a
              href="https://prodavajbrzo.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-600 transition-colors"
            >
              Visit Live Site
            </a>
            <span>•</span>
            <a
              href="https://github.com/jusuf00/prodavajbrzo-"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-600 transition-colors"
            >
              View Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}