import clsx from "clsx";

type Props = {
  size?: number;
  className?: string;
  color?: string; // any CSS color; defaults to accent green
};

const URL = "/clearbot-mark.png";

export function Logo({ size = 18, className, color = "#7ab833" }: Props) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${URL})`,
        maskImage: `url(${URL})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
