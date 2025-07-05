import { Portal } from '@radix-ui/react-portal'
import React, { useEffect, useRef, useState, type ComponentRef } from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import { cn, waitForElementById } from '@/lib/utils'
import type { MarkdownHeading } from 'astro'
import './NewTableOfContent.css'
import { ChevronsUpDownIcon } from '../icons/AnimatedChevronsUpDown'
import { useHotkeys } from 'react-hotkeys-hook'

interface Props {
  title: string
  headings: MarkdownHeading[]
  tags: string[]
}

const MAX_HEIGHT = 256

export default function NewTableOfContent({ headings, title, tags }: Props) {
  const [leadingContainer, setLeadingContainer] = useState<HTMLElement>()
  const [upperContainer, setUpperContainer] = useState<HTMLElement>()
  const [showList, setShowList] = useState(false)

  const iconRef = useRef<ComponentRef<typeof ChevronsUpDownIcon>>(null)
  const tableOfContentsRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
  const ButtonWrapper = isFirefox ? MotionButton : 'button'

  useHotkeys('o', () => {
    const navContainer = document.getElementById('nav-container')

    if (!navContainer) return

    const bottom = Number(navContainer.style.bottom.replace('px', ''))

    if (bottom < 32) {
      document.startViewTransition(() => {
        navContainer.style.bottom = '32px'
      })
    }

    handleToggleList()
  })

  useEffect(() => {
    waitForElementById('bottom-nav-bar-leading').then((element) => {
      if (!element) return

      setLeadingContainer(element)
    })

    waitForElementById('bottom-nav-bar-upper').then((element) => {
      if (!element) return

      setUpperContainer(element)
    })
  }, [])

  // Click outside to close
  useEffect(() => {
    if (!showList) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Check if click is outside both the table of contents and the button
      if (
        tableOfContentsRef.current &&
        buttonRef.current &&
        !tableOfContentsRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        handleToggleList()
      }
    }

    // Add event listener with a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showList])

  function handleToggleList() {
    setShowList((prev) => !prev)
    const navDock = document.getElementById('nav-dock')

    if (showList) {
      navDock?.classList.remove('!p-3')
      navDock?.classList.add('delay-200')

      setTimeout(() => {
        document.body.classList.remove('disable-scroll')
      }, 300)

      return
    }

    navDock?.classList.add('!p-3')
    navDock?.classList.remove('delay-200')
    document.body.classList.add('disable-scroll')
  }

  return (
    <>
      <Portal container={upperContainer}>
        <div
          ref={tableOfContentsRef}
          style={{
            height: Math.min(MAX_HEIGHT, headings.length * 34),
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
          }}
          className={cn(
            { '!h-0': !showList },
            'w-full overflow-hidden',
            'table-of-content',
            'transition-all duration-300'
          )}
        >
          <div className='h-full p-2'>
            <div className='scrollbar-hide h-full rounded-3xl bg-[#141517]'>
              <HeadingsList headings={headings} />
            </div>
          </div>
        </div>
      </Portal>
      <Portal container={leadingContainer}>
        <ButtonWrapper
          ref={buttonRef}
          type='button'
          onClick={handleToggleList}
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
          className={cn(
            'group flex items-center gap-2',
            'rounded-full px-3 py-2.5',
            'font-heading text-sm text-emerald-400',
            'bg-emerald-950/60'
          )}
        >
          <span className='whitespace-nowrap'>On this page</span>
          <ChevronsUpDownIcon ref={iconRef} size={12} />
        </ButtonWrapper>
      </Portal>
    </>
  )
}

const MotionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<HTMLMotionProps<'button'>, 'ref'>
>(({ children, ...props }, forwardedRef) => {
  const [shouldUnmount, setShouldUnmount] = useState(false)
  const divRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.addEventListener('astro:before-preparation', () => {
      setShouldUnmount(true)
    })

    setTimeout(() => {
      if (divRef.current) {
        const rect = divRef.current.getBoundingClientRect()

        document.documentElement.style.setProperty(
          '--tip-x-offset',
          (rect.width / 2).toString()
        )
      }
    }, 500) // wait for the enter animation to finish

    return () => {
      document.removeEventListener('astro:before-preparation', () => {
        setShouldUnmount(true)
      })
    }
  }, [])

  return (
    <AnimatePresence>
      {!shouldUnmount && (
        <motion.button
          ref={(node) => {
            divRef.current = node
            if (typeof forwardedRef === 'function') {
              forwardedRef(node)
            } else if (forwardedRef) {
              forwardedRef.current = node
            }
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: 120,
            opacity: 1,
            transition: { type: 'spring', bounce: 0.25 }
          }}
          exit={{
            width: 0,
            opacity: 0,
            transition: { type: 'spring', bounce: 0.25, duration: 0.2 }
          }}
          {...props}
        >
          {children}
        </motion.button>
      )}
    </AnimatePresence>
  )
})

/**
 * Heading component for the table of contents
 */

const DEPTH_STYLE = {
  3: 'pl-3',
  4: 'pl-6'
}

function HeadingsList({ headings }: { headings: MarkdownHeading[] }) {
  return (
    <ul
      className={cn(
        'space-y-3 p-4 text-[0.9rem] text-zinc-400',
        'scrollbar-hide h-full overflow-y-scroll'
      )}
    >
      {groupHeadings(headings).map((heading) => {
        if (!Array.isArray(heading)) {
          return <Heading key={heading.slug} {...heading} />
        }

        return (
          <ul
            className={cn(
              'mt-2 space-y-2',
              DEPTH_STYLE[heading[0].depth as keyof typeof DEPTH_STYLE]
            )}
          >
            {heading.map((nestedHeading) => (
              <Heading key={nestedHeading.slug} {...nestedHeading} />
            ))}
          </ul>
        )
      })}
    </ul>
  )
}

type GroupedHeadings = (MarkdownHeading | MarkdownHeading[])[]

const groupHeadings = (headings: MarkdownHeading[]): GroupedHeadings => {
  return headings.reduce<GroupedHeadings>((result, current, index) => {
    if (current.depth <= 2) result.push(current)
    // depth > 2
    else if (headings[index - 1]?.depth !== current.depth) {
      result.push([current])
    } else {
      ;(result[result.length - 1] as MarkdownHeading[]).push(current)
    }

    return result
  }, [])
}

function Heading({ slug, text }: MarkdownHeading) {
  return (
    <li>
      <a className='hover:text-zinc-200' href={`#${slug}`}>
        {text}
      </a>
    </li>
  )
}
