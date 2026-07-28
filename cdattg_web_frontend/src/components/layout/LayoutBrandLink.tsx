import { Link } from 'react-router-dom';
import LogoSena from '../../../logo-sena-verde-complementario-svg-2022.svg';

export const APP_BRAND_NAME = 'CDATTG Web';

type LayoutBrandLinkProps = Readonly<{
  to: string;
  onClick?: () => void;
  /** AdminLTE: marca en sidebar oscuro o en navbar claro */
  variant?: 'sidebar' | 'navbar';
  className?: string;
}>;

export function LayoutBrandLink({
  to,
  onClick,
  variant = 'navbar',
  className = '',
}: LayoutBrandLinkProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`brand-link flex items-center transition-opacity hover:opacity-90 ${
        isSidebar ? 'min-w-0' : 'shrink-0'
      } ${className}`}
    >
      <img
        src={LogoSena}
        alt="Logo SENA"
        className="brand-image max-h-[33px] w-auto shrink-0 opacity-75 shadow"
      />
      <span
        className={`brand-text ml-2 text-xl font-light leading-tight ${
          isSidebar
            ? 'truncate text-white'
            : 'whitespace-nowrap text-gray-800 dark:text-gray-100'
        }`}
      >
        {APP_BRAND_NAME}
      </span>
    </Link>
  );
}
