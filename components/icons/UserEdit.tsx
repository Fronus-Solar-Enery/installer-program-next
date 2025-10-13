import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconUserEdit: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6699 12C15.4313 12 17.6699 9.76142 17.6699 7C17.6699 4.23858 15.4313 2 12.6699 2C9.9085 2 7.66992 4.23858 7.66992 7C7.66992 9.76142 9.9085 12 12.6699 12Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /><path d="M19.88 15.74L16.3399 19.2801C16.1999 19.4201 16.07 19.68 16.04 19.87L15.85 21.22C15.78 21.71 16.12 22.05 16.61 21.98L17.9599 21.79C18.1499 21.76 18.42 21.63 18.55 21.49L22.0899 17.95C22.6999 17.34 22.9899 16.63 22.0899 15.73C21.1999 14.84 20.49 15.13 19.88 15.74Z" stroke="currentColor" strokeWidth={width} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /><path d="M19.3701 16.25C19.6701 17.33 20.5101 18.17 21.5901 18.47" stroke="currentColor" strokeWidth={width} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M4.08008 22C4.08008 18.13 7.93011 15 12.6701 15C13.7101 15 14.7101 15.15 15.6401 15.43" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6699 12C15.4313 12 17.6699 9.76142 17.6699 7C17.6699 4.23858 15.4313 2 12.6699 2C9.9085 2 7.66992 4.23858 7.66992 7C7.66992 9.76142 9.9085 12 12.6699 12Z" fill="currentColor" /><path opacity={duotone ? "0.4" : "1"} d="M12.6701 14.5C7.6601 14.5 3.58008 17.86 3.58008 22C3.58008 22.28 3.80008 22.5 4.08008 22.5H21.2601C21.5401 22.5 21.7601 22.28 21.7601 22C21.7601 17.86 17.6801 14.5 12.6701 14.5Z" fill="currentColor" /><path d="M22.1 14.7401C21.2 13.8401 20.49 14.1301 19.88 14.7401L16.3399 18.2801C16.1999 18.4201 16.07 18.6801 16.04 18.8701L15.85 20.2201C15.78 20.7101 16.12 21.0501 16.61 20.9801L17.9599 20.7901C18.1499 20.7601 18.42 20.6301 18.55 20.4901L22.0899 16.9501C22.7099 16.3501 23 15.6401 22.1 14.7401Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6699 2C9.90992 2 7.66992 4.24 7.66992 7C7.66992 9.76 9.90992 12 12.6699 12C15.4299 12 17.6699 9.76 17.6699 7C17.6699 4.24 15.4299 2 12.6699 2ZM14.8399 6.51L12.1399 9.21C12.0399 9.31 11.8299 9.41 11.6899 9.44L10.6599 9.58C10.2799 9.63 10.0199 9.37 10.0799 9L10.2299 7.97C10.2499 7.83 10.3499 7.62 10.4599 7.52L13.1599 4.82C13.6199 4.36 14.1699 4.14 14.8499 4.82C15.5199 5.51 15.2999 6.05 14.8399 6.51Z" fill="currentColor" /><path d="M12.6701 14C7.66008 14 3.58008 17.36 3.58008 21.5C3.58008 21.78 3.80008 22 4.08008 22H21.2601C21.5401 22 21.7601 21.78 21.7601 21.5C21.7601 17.36 17.6801 14 12.6701 14Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconUserEdit;