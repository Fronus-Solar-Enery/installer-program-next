import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconUsersGroupRounded: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="6.00049" r="4" stroke="currentColor" strokeWidth={width} /><path opacity={duotone ? "0.5" : "1"} d="M12.5 4.34159C13.0375 3.53324 13.9565 3.00049 15 3.00049C16.6569 3.00049 18 4.34363 18 6.00049C18 7.65734 16.6569 9.00049 15 9.00049C13.9565 9.00049 13.0375 8.46773 12.5 7.65939" stroke="currentColor" strokeWidth={width} /><ellipse cx="9" cy="17.0005" rx="7" ry="4" stroke="currentColor" strokeWidth={width} /><path opacity={duotone ? "0.5" : "1"} d="M18 14.0005C19.7542 14.3852 21 15.3594 21 16.5005C21 17.5298 19.9863 18.4234 18.5 18.8709" stroke="currentColor" strokeWidth={width} strokeLinecap="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle opacity={duotone ? "0.5" : "1"} cx="15" cy="6.00049" r="3" fill="currentColor" /><ellipse opacity={duotone ? "0.5" : "1"} cx="16" cy="17.0005" rx="5" ry="3" fill="currentColor" /><circle cx="9.00098" cy="6.00049" r="4" fill="currentColor" /><ellipse cx="9.00098" cy="17.0015" rx="7" ry="4" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9.00098" cy="6.00049" r="4" fill="currentColor" /><ellipse cx="9.00098" cy="17.0015" rx="7" ry="4" fill="currentColor" /><path d="M20.9996 17.0009C20.9996 18.6578 18.9641 20.0009 16.4788 20.0009C17.211 19.2006 17.7145 18.196 17.7145 17.0023C17.7145 15.8073 17.2098 14.8018 16.4762 14.001C18.9615 14.001 20.9996 15.3441 20.9996 17.0009Z" fill="currentColor" /><path d="M17.9996 6.00122C17.9996 7.65807 16.6565 9.00122 14.9996 9.00122C14.6383 9.00122 14.292 8.93736 13.9712 8.8203C14.4443 7.98821 14.7145 7.02571 14.7145 6.0001C14.7145 4.97526 14.4447 4.01342 13.9722 3.18175C14.2927 3.06494 14.6387 3.00122 14.9996 3.00122C16.6565 3.00122 17.9996 4.34437 17.9996 6.00122Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconUsersGroupRounded;