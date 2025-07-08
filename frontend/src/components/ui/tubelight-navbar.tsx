"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  onClick?: () => void
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Set active tab based on current URL path
  useEffect(() => {
    const path = window.location.pathname + window.location.hash;
    const currentItem = items.find(item => item.url === path || path.startsWith(item.url));
    if (currentItem) {
      setActiveTab(currentItem.name);
    } else {
      // Default to home if no match
      setActiveTab(items[0].name);
    }
  }, [items]);

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
      setActiveTab(item.name);
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        className,
      )}
    >
      <div className="flex items-center gap-1 bg-black/40 py-2 px-2 rounded-full shadow-lg border border-white/10 backdrop-blur-md">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                "relative px-6 py-1 text-sm font-medium rounded-full transition-colors",
                "text-gray-400 hover:text-white",
                isActive && "text-white bg-white/10"
              )}
            >
              <span className="relative z-10">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full rounded-full -z-0"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-white/50 rounded-full blur-sm" />
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
} 