type BrandMarkProps = { className?: string; title?: string };

export function BrandMark({
  className,
  title = "Marca Karolzinha",
}: BrandMarkProps) {
  return (
    <svg
      aria-label={title}
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        d="M8 6v20M24 7 13 16l11 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.25"
      />
      <path
        d="M20.5 6.5h4.25v7.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
