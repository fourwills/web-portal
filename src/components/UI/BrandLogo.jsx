const FAVICON = '/favicon.png';
const LOGO = '/logo.png';

export function BrandIcon({ className = 'h-9 w-9 object-contain' }) {
  return (
    <img
      src={FAVICON}
      alt=""
      className={className}
      width={36}
      height={36}
    />
  );
}

export function BrandLogo({ className = 'h-10 w-auto max-w-[180px] object-contain' }) {
  return (
    <img
      src={LOGO}
      alt="The VoIP Talk"
      className={className}
    />
  );
}
