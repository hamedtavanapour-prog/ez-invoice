type InvoiceLogoProps = {
  className?: string;
  onDark?: boolean;
};

export function InvoiceLogo({ className = "size-9", onDark = false }: InvoiceLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7h14c2.2 0 3.5.8 5 2.5l6.2 7M4 18h12c2.2 0 3.4.8 5 2.5l5 5.5M4 29h10c2.2 0 3.4.8 5 2.5l3.2 3.5L44 9"
        stroke={onDark ? "#9fd3ff" : "#236fb4"}
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
