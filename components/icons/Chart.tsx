import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconChart: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.66992 22H22.6699" stroke="currentColor" strokeWidth={width} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.4199 4V22H14.9199V4C14.9199 2.9 14.4699 2 13.1199 2H12.2199C10.8699 2 10.4199 2.9 10.4199 4Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M3.66992 10V22H7.66992V10C7.66992 8.9 7.26992 8 6.06992 8H5.26992C4.06992 8 3.66992 8.9 3.66992 10Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M17.6699 15V22H21.6699V15C21.6699 13.9 21.2699 13 20.0699 13H19.2699C18.0699 13 17.6699 13.9 17.6699 15Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.6699 22H2.66992C2.25992 22 1.91992 21.66 1.91992 21.25C1.91992 20.84 2.25992 20.5 2.66992 20.5H22.6699C23.0799 20.5 23.4199 20.84 23.4199 21.25C23.4199 21.66 23.0799 22 22.6699 22Z" fill="currentColor" /><path d="M10.4199 4V22H14.9199V4C14.9199 2.9 14.4699 2 13.1199 2H12.2199C10.8699 2 10.4199 2.9 10.4199 4Z" fill="currentColor" /><path opacity={duotone ? "0.4" : "1"} d="M3.66992 10V22H7.66992V10C7.66992 8.9 7.26992 8 6.06992 8H5.26992C4.06992 8 3.66992 8.9 3.66992 10Z" fill="currentColor" /><path opacity={duotone ? "0.4" : "1"} d="M17.6699 15V22H21.6699V15C21.6699 13.9 21.2699 13 20.0699 13H19.2699C18.0699 13 17.6699 13.9 17.6699 15Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.6699 22H2.66992C2.25992 22 1.91992 21.66 1.91992 21.25C1.91992 20.84 2.25992 20.5 2.66992 20.5H22.6699C23.0799 20.5 23.4199 20.84 23.4199 21.25C23.4199 21.66 23.0799 22 22.6699 22Z" fill="currentColor" /><path d="M10.4199 4V22H14.9199V4C14.9199 2.9 14.4699 2 13.1199 2H12.2199C10.8699 2 10.4199 2.9 10.4199 4Z" fill="currentColor" /><path d="M3.66992 10V22H7.66992V10C7.66992 8.9 7.26992 8 6.06992 8H5.26992C4.06992 8 3.66992 8.9 3.66992 10Z" fill="currentColor" /><path d="M17.6699 15V22H21.6699V15C21.6699 13.9 21.2699 13 20.0699 13H19.2699C18.0699 13 17.6699 13.9 17.6699 15Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconChart;