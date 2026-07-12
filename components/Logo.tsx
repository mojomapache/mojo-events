export default function Logo({ mode = "day", size = 28 }: { mode?: "day" | "night"; size?: number }) {
  const src = mode === "night" ? "/icons/raccoon-night.png" : "/icons/raccoon-day.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0 }}
    />
  );
}
