import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconSearchNormal: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1699 21C17.4166 21 21.6699 16.7467 21.6699 11.5C21.6699 6.25329 17.4166 2 12.1699 2C6.92322 2 2.66992 6.25329 2.66992 11.5C2.66992 16.7467 6.92322 21 12.1699 21Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M22.6699 22L20.6699 20" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.4" : "1"} d="M12.1699 21C17.4166 21 21.6699 16.7467 21.6699 11.5C21.6699 6.25329 17.4166 2 12.1699 2C6.92322 2 2.66992 6.25329 2.66992 11.5C2.66992 16.7467 6.92322 21 12.1699 21Z" fill="currentColor" /><path d="M21.9695 22.0001C21.7895 22.0001 21.6095 21.9301 21.4795 21.8001L19.6195 19.9401C19.3495 19.6701 19.3495 19.2301 19.6195 18.9501C19.8895 18.6801 20.3295 18.6801 20.6095 18.9501L22.4695 20.8101C22.7395 21.0801 22.7395 21.5201 22.4695 21.8001C22.3295 21.9301 22.1495 22.0001 21.9695 22.0001Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1699 21C17.4166 21 21.6699 16.7467 21.6699 11.5C21.6699 6.25329 17.4166 2 12.1699 2C6.92322 2 2.66992 6.25329 2.66992 11.5C2.66992 16.7467 6.92322 21 12.1699 21Z" fill="currentColor" /><path d="M21.9695 22.0001C21.7895 22.0001 21.6095 21.9301 21.4795 21.8001L19.6195 19.9401C19.3495 19.6701 19.3495 19.2301 19.6195 18.9501C19.8895 18.6801 20.3295 18.6801 20.6095 18.9501L22.4695 20.8101C22.7395 21.0801 22.7395 21.5201 22.4695 21.8001C22.3295 21.9301 22.1495 22.0001 21.9695 22.0001Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconSearchNormal;