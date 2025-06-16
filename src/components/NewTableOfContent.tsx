import { Portal } from '@radix-ui/react-portal'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import { cn, waitForElementById } from '@/lib/utils'

export default function NewTableOfContent() {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
  const DivWrapper = isFirefox ? MotionDiv : 'div'

  useEffect(() => {
    waitForElementById('bottom-nav-bar-leading').then((element) => {
      if (!element) return

      setContainer(element)
    })
  }, [])

  return (
    <Portal container={container}>
      <DivWrapper
        className={cn(
          'rounded-full px-3 py-2.5',
          'font-heading text-sm text-emerald-400',
          'bg-emerald-950/60'
        )}
      >
        <span className='whitespace-nowrap'>On this page</span>
      </DivWrapper>
    </Portal>
  )
}

function MotionDiv({
  children,
  ...props
}: Omit<HTMLMotionProps<'div'>, 'ref'>) {
  const [shouldUnmount, setShouldUnmount] = useState(false)

  useEffect(() => {
    document.addEventListener('astro:before-preparation', () => {
      setShouldUnmount(true)
    })

    return () => {
      document.removeEventListener('astro:before-preparation', () => {
        setShouldUnmount(true)
      })
    }
  }, [])

  return (
    <AnimatePresence>
      {!shouldUnmount && (
        <motion.div
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
