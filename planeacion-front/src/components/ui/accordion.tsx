"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          `
          group
          focus-visible:border-ring focus-visible:ring-ring/50
          flex flex-1 items-start justify-between gap-4
          rounded-md py-4 text-left text-sm font-medium
          transition-all outline-none
          hover:underline
          focus-visible:ring-[3px]
          disabled:pointer-events-none disabled:opacity-50
          `,
          className
        )}
        {...props}
      >
        {/* Texto del trigger */}
        {children}

        {/* Flecha en círculo guinda */}
        <span
          className="
            ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center
            rounded-full
            bg-[#5A1236]
            shadow-sm shadow-[#5A1236]/30
            transition-all duration-200
            group-hover:bg-[#741845]
            data-[state=open]:rotate-180
          "
        >
          <ChevronDownIcon className="h-4 w-4 text-white transition-transform duration-200" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="
        overflow-hidden text-sm
        data-[state=closed]:animate-accordion-up
        data-[state=open]:animate-accordion-down
      "
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
}
