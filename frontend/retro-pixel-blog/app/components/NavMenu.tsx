import Link from "next/link"
import { Monitor, Palette, DollarSign } from "lucide-react"

const NavMenu = () => {
  return (
    <nav className="flex justify-center space-x-4 my-4">
      <Link
        href="/category/tech"
        className="flex flex-col items-center p-2 bg-gray-800 rounded pixelated-border hover:bg-gray-700 transition-colors"
      >
        <Monitor className="w-6 h-6 mb-1" />
        <span className="font-pixel text-xs">Tech</span>
      </Link>
      <Link
        href="/category/art"
        className="flex flex-col items-center p-2 bg-gray-800 rounded pixelated-border hover:bg-gray-700 transition-colors"
      >
        <Palette className="w-6 h-6 mb-1" />
        <span className="font-pixel text-xs">Art</span>
      </Link>
      <Link
        href="/category/finance"
        className="flex flex-col items-center p-2 bg-gray-800 rounded pixelated-border hover:bg-gray-700 transition-colors"
      >
        <DollarSign className="w-6 h-6 mb-1" />
        <span className="font-pixel text-xs">Finance</span>
      </Link>
    </nav>
  )
}

export default NavMenu

