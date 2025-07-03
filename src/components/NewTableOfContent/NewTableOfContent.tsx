import { Portal } from '@radix-ui/react-portal'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import { cn, waitForElementById } from '@/lib/utils'
import type { MarkdownHeading } from 'astro'
import './NewTableOfContent.css'
import { ChevronsUpDownIcon } from '../icons/AnimatedChevronsUpDown'

interface Props {
  headings: MarkdownHeading[]
}

const MAX_HEIGHT = 256

export default function NewTableOfContent({ headings }: Props) {
  const [leadingContainer, setLeadingContainer] = useState<HTMLElement>()
  const [upperContainer, setUpperContainer] = useState<HTMLElement>()
  const [showList, setShowList] = useState(false)

  const iconRef = useRef<ComponentRef<typeof ChevronsUpDownIcon>>(null)

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
  const ButtonWrapper = isFirefox ? MotionButton : 'button'

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

  const groupedHeadings = groupHeadings(headings)

  function handleToggleList() {
    setShowList((prev) => !prev)
    const navDock = document.getElementById('nav-dock')

    if (showList) {
      navDock?.classList.remove('!p-3')
      navDock?.classList.add('delay-200')
      return document.body.classList.remove('disable-scroll')
    }

    navDock?.classList.add('!p-3')
    navDock?.classList.remove('delay-200')
    document.body.classList.add('disable-scroll')
  }

  return (
    <>
      <Portal container={upperContainer}>
        <div
          style={{
            height: Math.min(MAX_HEIGHT, headings.length * 34),
            transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)'
          }}
          className={cn(
            { '!h-0': !showList },
            'w-full overflow-hidden',
            'table-of-content',
            'transition-all duration-300'
          )}
        >
          <div className='h-full px-2 pt-2'>
            <div className='h-full overflow-scroll rounded-3xl bg-zinc-900/80'>
              <ul
                className={cn(
                  'space-y-1.5 px-6 py-4 text-[0.9rem] text-zinc-400',
                  'scrollbar-color max-h-[480px] overflow-y-scroll'
                )}
              >
                {groupedHeadings.map((heading) => {
                  if (!Array.isArray(heading)) {
                    return <Heading key={heading.slug} {...heading} />
                  }

                  return (
                    <NestedHeading
                      key={`${heading[0].slug}-${heading[0].depth}`}
                      headings={heading}
                    />
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </Portal>
      <Portal container={leadingContainer}>
        <ButtonWrapper
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

function MotionButton({
  children,
  ...props
}: Omit<HTMLMotionProps<'button'>, 'ref'>) {
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
          ref={divRef}
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

const Heading = ({ slug, text }: MarkdownHeading) => {
  return (
    <li>
      <a className='hover:text-zinc-200' href={`#${slug}`}>
        {text}
      </a>
    </li>
  )
}

const DEPTH_STYLE = {
  3: 'pl-4',
  4: 'pl-8'
}

const NestedHeading = ({ headings }: { headings: MarkdownHeading[] }) => {
  return (
    <ul
      className={cn(
        'mt-2 space-y-2',
        DEPTH_STYLE[headings[0].depth as keyof typeof DEPTH_STYLE]
      )}
    >
      {headings.map((heading) => (
        <Heading key={heading.slug} {...heading} />
      ))}
    </ul>
  )
}
