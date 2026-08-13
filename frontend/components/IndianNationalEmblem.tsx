import React from "react";

export default function IndianNationalEmblem({
  className = "",
  opacity = 0.05,
  width = 380,
  height,
}: {
  className?: string;
  opacity?: number;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <img
      src="/emblem.png"
      alt="State Emblem of India"
      width={width}
      height={height}
      className={className}
      style={{
        opacity,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}
