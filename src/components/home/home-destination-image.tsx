"use client";

import Image from "next/image";
import { useState } from "react";
import { DEFAULT_DESTINATION_IMAGE } from "@/features/destinations/images";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function HomeDestinationImage({ src, alt, sizes, priority = false, className }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || DEFAULT_DESTINATION_IMAGE);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={72}
      className={className}
      onError={() => {
        if (currentSrc !== DEFAULT_DESTINATION_IMAGE) setCurrentSrc(DEFAULT_DESTINATION_IMAGE);
      }}
    />
  );
}
