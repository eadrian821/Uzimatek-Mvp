'use client'

import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  AnimatePresence,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

// ─────────────────────────────────────────────
// Shared variants
// ─────────────────────────────────────────────
const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
  }),
}

const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay },
  }),
}

const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24, delay },
  }),
}

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
}

// ─────────────────────────────────────────────
// FadeIn
// ─────────────────────────────────────────────
interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      custom={delay}
      className={className}
      style={{ willChange: 'opacity, transform' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// FadeInView — triggers when element enters viewport
// ─────────────────────────────────────────────
interface FadeInViewProps {
  children: ReactNode
  delay?: number
  className?: string
  once?: boolean
}

export function FadeInView({ children, delay = 0, className, once = true }: FadeInViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeInVariants}
      custom={delay}
      className={className}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// SlideUp
// ─────────────────────────────────────────────
interface SlideUpProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  delay?: number
  className?: string
}

export function SlideUp({ children, delay = 0, className, ...rest }: SlideUpProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpVariants}
      custom={delay}
      className={className}
      style={{ willChange: 'opacity, transform' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// ScaleIn
// ─────────────────────────────────────────────
interface ScaleInProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  delay?: number
  className?: string
}

export function ScaleIn({ children, delay = 0, className, ...rest }: ScaleInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleInVariants}
      custom={delay}
      className={className}
      style={{ willChange: 'opacity, transform' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// StaggerChildren — wraps children with stagger
// ─────────────────────────────────────────────
interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function StaggerChildren({ children, className, delay = 0 }: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        ...staggerContainerVariants,
        visible: {
          ...staggerContainerVariants.visible,
          transition: {
            ...(staggerContainerVariants.visible as { transition?: object }).transition,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Child component to be used inside StaggerChildren
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// AnimatedNumber — smooth count-up for KPI values
// ─────────────────────────────────────────────
interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  formatter?: (val: number) => string
}

export function AnimatedNumber({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  formatter,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
    duration,
  })
  const inView = useInView(ref, { once: true, margin: '-20px' })

  useEffect(() => {
    if (inView) {
      motionValue.set(value)
    }
  }, [inView, motionValue, value])

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        const rounded = parseFloat(latest.toFixed(decimals))
        ref.current.textContent = formatter
          ? `${prefix}${formatter(rounded)}${suffix}`
          : `${prefix}${rounded.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}${suffix}`
      }
    })
  }, [springValue, decimals, prefix, suffix, formatter])

  return (
    <span ref={ref} className={className} style={{ willChange: 'contents' }}>
      {prefix}
      {formatter
        ? formatter(0)
        : (0).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
      {suffix}
    </span>
  )
}

// ─────────────────────────────────────────────
// PresenceTransition — for AnimatePresence-based exits
// ─────────────────────────────────────────────
export { AnimatePresence }

export function PresenceTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={className}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

// Re-export motion for convenience
export { motion }
