import Image from "next/image";

/**
 * The Jrive mark. The PNG is the finished logo (blue tile, white "J") — render
 * it as-is. Don't wrap it in a colored square or run it through a
 * brightness/invert filter; that flattens the whole image to a solid block.
 */
export default function Logo({ size = 28, className = "" }) {
  return (
    <Image
      src="/images/jrive-logo.png"
      alt="JriveContent"
      width={size}
      height={size}
      className={`rounded-md ${className}`.trim()}
    />
  );
}
