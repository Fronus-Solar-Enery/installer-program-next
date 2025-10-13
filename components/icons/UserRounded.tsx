import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconUserRounded: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6.00049" r="4" stroke="currentColor" strokeWidth={width} /><ellipse opacity={duotone ? "0.5" : "1"} cx="12" cy="17.0005" rx="7" ry="4" stroke="currentColor" strokeWidth={width} /></svg> 
      ) : duotone ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6.00049" r="4" fill="currentColor" /><ellipse opacity={duotone ? "0.5" : "1"} cx="12" cy="17.0005" rx="7" ry="4" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6.00049" r="4" fill="currentColor" /><ellipse cx="12" cy="17.0005" rx="7" ry="4" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconUserRounded;