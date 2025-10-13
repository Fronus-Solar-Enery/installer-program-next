import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconMagnifer: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle opacity={duotone ? "0.5" : "1"} cx="11.5" cy="11.5005" r="9.5" stroke="currentColor" strokeWidth={width} /><path d="M18.5 18.5005L22 22.0005" stroke="currentColor" strokeWidth={width} strokeLinecap="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.5" : "1"} d="M20.3133 11.1571C20.3133 16.2142 16.2137 20.3137 11.1566 20.3137C6.09956 20.3137 2 16.2142 2 11.1571C2 6.10005 6.09956 2.00049 11.1566 2.00049C16.2137 2.00049 20.3133 6.10005 20.3133 11.1571Z" fill="currentColor" /><path d="M17.1001 18.1229L20.7664 21.7892C21.0487 22.0715 21.5064 22.0715 21.7887 21.7892C22.071 21.5069 22.071 21.0492 21.7887 20.7669L18.1224 17.1006C17.809 17.4676 17.4671 17.8095 17.1001 18.1229Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M21.7883 21.7888C22.0706 21.5065 22.0706 21.0487 21.7883 20.7664L18.1224 17.1006C19.4884 15.5011 20.3133 13.4255 20.3133 11.1571C20.3133 6.10005 16.2137 2.00049 11.1566 2.00049C6.09956 2.00049 2 6.10005 2 11.1571C2 16.2142 6.09956 20.3137 11.1566 20.3137C13.4249 20.3137 15.5006 19.489 17.1 18.123L20.7659 21.7888C21.0483 22.0711 21.506 22.0711 21.7883 21.7888Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconMagnifer;