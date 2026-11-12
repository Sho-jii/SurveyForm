import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    data-slot="accordion-item"
    className={cn("cn-accordion-item border-b border-border/70 rounded-none", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={cn(
        "cn-accordion-trigger group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent outline-none transition-all py-4 text-left font-medium text-sm md:text-base hover:text-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-none",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className="cn-accordion-trigger-icon pointer-events-none shrink-0 size-4 text-muted-foreground group-aria-expanded/accordion-trigger:hidden transition-transform duration-200"
        data-slot="accordion-trigger-icon"
      />
      <ChevronUp
        className="cn-accordion-trigger-icon pointer-events-none hidden shrink-0 size-4 text-muted-foreground group-aria-expanded/accordion-trigger:inline transition-transform duration-200"
        data-slot="accordion-trigger-icon"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    data-slot="accordion-content"
    className="cn-accordion-content overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("cn-accordion-content-inner pb-4 pt-1 text-muted-foreground text-xs md:text-sm leading-relaxed", className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

