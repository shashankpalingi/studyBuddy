"use client";

import * as React from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, FileText, MessageCircle, Folder, Timer, CheckSquare, BarChart3, Palette, Monitor } from "lucide-react";
import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { Carousel as CarouselPrimitive } from "@/components/ui/carousel";

// Utility to combine class names
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(" ");
}

// Button component (from shadcn/button)
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<HTMLButtonElement, any>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

const CarouselContext = React.createContext<any | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    orientation?: "horizontal" | "vertical", 
    opts?: any, 
    setApi?: any, 
    plugins?: any 
  }
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: any) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation: orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative w-full", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden w-full">
      <div
        ref={ref}
        className={cn(
          "flex w-full",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full pl-4 flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 group",
        className
      )}
      {...props}
    >
      <div className="mx-2 flex shrink-0 flex-col items-center justify-center text-center relative">
        {/* Glow effect */}
        <div className="absolute -inset-2 bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"></div>
        {children}
      </div>
    </div>
  );
});
CarouselItem.displayName = "CarouselItem";

interface Feature {
  id: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Feature[];
  className?: string;
}

const Logos3 = ({
    heading = "",
    logos = [
    {
      id: "feature-1",
      description: "Collaborative Notes",
      icon: FileText,
      className: "w-10 h-10 text-blue-600",
    },
    {
      id: "feature-2",
      description: "Chat",
      icon: MessageCircle,
      className: "w-10 h-10 text-green-600",
    },
    {
      id: "feature-3",
      description: "Files",
      icon: Folder,
      className: "w-10 h-10 text-yellow-600",
    },
    {
      id: "feature-4",
      description: "Study Timer",
      icon: Timer,
      className: "w-10 h-10 text-red-600",
    },
    {
      id: "feature-5",
      description: "Tasks",
      icon: CheckSquare,
      className: "w-10 h-10 text-purple-600",
    },
    {
      id: "feature-6",
      description: "Polls",
      icon: BarChart3,
      className: "w-10 h-10 text-indigo-600",
    },
    {
      id: "feature-7",
      description: "Whiteboard",
      icon: Palette,
      className: "w-10 h-10 text-pink-600",
    },
    {
      id: "feature-8",
      description: "Watch Together",
      icon: Monitor,
      className: "w-10 h-10 text-orange-600",
    },
  ],
}: Logos3Props) => {
  return (
    <section className="py-1 w-full bg-black/40 shadow-lg border-none backdrop-blur-md">
      <div className="pt-0 md:pt-0 lg:pt-0 w-full">
        <div className="relative mx-auto w-full max-w-full flex items-center justify-center">
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true })]}
            className="w-full"
          >
            <CarouselContent className="ml-0 w-full">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="mx-2 flex shrink-0 flex-col items-center justify-center text-center">
                    <logo.icon className={logo.className} />
                    <span className="mt-1 text-xs font-medium text-muted-foreground">
                      {logo.description}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

const demoData = {
  heading: "",
  logos: [
    {
      id: "feature-1",
      description: "Collaborative Notes",
      icon: FileText,
      className: "w-10 h-10 text-blue-600",
    },
    {
      id: "feature-2",
      description: "Chat",
      icon: MessageCircle,
      className: "w-10 h-10 text-green-600",
    },
    {
      id: "feature-3",
      description: "Files",
      icon: Folder,
      className: "w-10 h-10 text-yellow-600",
    },
    {
      id: "feature-4",
      description: "Study Timer",
      icon: Timer,
      className: "w-10 h-10 text-red-600",
    },
    {
      id: "feature-5",
      description: "Tasks",
      icon: CheckSquare,
      className: "w-10 h-10 text-purple-600",
    },
    {
      id: "feature-6",
      description: "Polls",
      icon: BarChart3,
      className: "w-10 h-10 text-indigo-600",
    },
    {
      id: "feature-7",
      description: "Whiteboard",
      icon: Palette,
      className: "w-10 h-10 text-pink-600",
    },
    {
      id: "feature-8",
      description: "Watch Together",
      icon: Monitor,
      className: "w-10 h-10 text-orange-600",
    },
  ],
};

export default function Logos3Demo() {
  return <Logos3 {...demoData} />;
} 