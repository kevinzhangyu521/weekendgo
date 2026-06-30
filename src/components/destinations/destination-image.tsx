"use client";

import type { ImgHTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { DEFAULT_DESTINATION_IMAGE } from "@/features/destinations/images";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

export function DestinationImage({ src, alt, ...props }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || DEFAULT_DESTINATION_IMAGE);

  useEffect(() => {
    setCurrentSrc(src || DEFAULT_DESTINATION_IMAGE);
  }, [src]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== DEFAULT_DESTINATION_IMAGE) setCurrentSrc(DEFAULT_DESTINATION_IMAGE);
      }}
    />
  );
}
