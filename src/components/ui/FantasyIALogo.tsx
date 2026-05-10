import Link from "next/link";

type FantasyIALogoProps = {
  href?: string;
  className?: string;
};

export function FantasyIALogo({ href, className = "" }: FantasyIALogoProps) {
  const content = (
    <>
      Fantasy<span className="text-brand-500">IA</span>
    </>
  );
  const classes = `text-lg font-semibold tracking-tight text-white ${className}`;

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
