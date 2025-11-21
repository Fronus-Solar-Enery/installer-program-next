import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface ArrayCarouselProps {
  slides: React.ReactNode[];
  className?: string;
}

export function ArrayCarousel({ slides, className }: ArrayCarouselProps) {
  return (
    <Carousel className={cn("w-full", className)}>
      <CarouselContent className="-ml-1 w-full flex items-center justify-center">
        {slides?.map((slide, index) => (
          <CarouselItem
            key={index}
            className="pl-1 md:basis-1/3 lg:basis-1/5 flex items-center justify-center"
          >
            <div className="p-1">{slide}</div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
