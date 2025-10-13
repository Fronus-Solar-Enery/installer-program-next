import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconClock: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.6699 12C22.6699 17.52 18.1899 22 12.6699 22C7.14992 22 2.66992 17.52 2.66992 12C2.66992 6.48 7.14992 2 12.6699 2C18.1899 2 22.6699 6.48 22.6699 12Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M16.3798 15.18L13.2798 13.33C12.7398 13.01 12.2998 12.24 12.2998 11.61V7.51001" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.4" : "1"} d="M12.6699 22C18.1928 22 22.6699 17.5228 22.6699 12C22.6699 6.47715 18.1928 2 12.6699 2C7.14707 2 2.66992 6.47715 2.66992 12C2.66992 17.5228 7.14707 22 12.6699 22Z" fill="currentColor" /><path d="M16.3796 15.93C16.2496 15.93 16.1196 15.9 15.9996 15.82L12.8996 13.97C12.1296 13.51 11.5596 12.5 11.5596 11.61V7.51001C11.5596 7.10001 11.8996 6.76001 12.3096 6.76001C12.7196 6.76001 13.0596 7.10001 13.0596 7.51001V11.61C13.0596 11.97 13.3596 12.5 13.6696 12.68L16.7696 14.53C17.1296 14.74 17.2396 15.2 17.0296 15.56C16.8796 15.8 16.6296 15.93 16.3796 15.93Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6699 2C7.15992 2 2.66992 6.49 2.66992 12C2.66992 17.51 7.15992 22 12.6699 22C18.1799 22 22.6699 17.51 22.6699 12C22.6699 6.49 18.1799 2 12.6699 2ZM17.0199 15.57C16.8799 15.81 16.6299 15.94 16.3699 15.94C16.2399 15.94 16.1099 15.91 15.9899 15.83L12.8899 13.98C12.1199 13.52 11.5499 12.51 11.5499 11.62V7.52C11.5499 7.11 11.8899 6.77 12.2999 6.77C12.7099 6.77 13.0499 7.11 13.0499 7.52V11.62C13.0499 11.98 13.3499 12.51 13.6599 12.69L16.7599 14.54C17.1199 14.75 17.2399 15.21 17.0199 15.57Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconClock;