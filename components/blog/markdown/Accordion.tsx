import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  return (
    <ShadcnAccordion type="single" collapsible className="my-6 border border-border rounded-xl overflow-hidden">
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors font-bold text-lg">
          {title}
        </AccordionTrigger>
        <AccordionContent className="px-6 py-6 border-t border-border bg-muted/5 prose dark:prose-invert max-w-none">
          {children}
        </AccordionContent>
      </AccordionItem>
    </ShadcnAccordion>
  );
};

export default Accordion;
