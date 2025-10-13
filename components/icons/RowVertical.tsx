import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconRowVertical: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.5699 13.5H4.76992C3.26992 13.5 2.66992 14.14 2.66992 15.73V19.77C2.66992 21.36 3.26992 22 4.76992 22H20.5699C22.0699 22 22.6699 21.36 22.6699 19.77V15.73C22.6699 14.14 22.0699 13.5 20.5699 13.5Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M20.5699 2H4.76992C3.26992 2 2.66992 2.64 2.66992 4.23V8.27C2.66992 9.86 3.26992 10.5 4.76992 10.5H20.5699C22.0699 10.5 22.6699 9.86 22.6699 8.27V4.23C22.6699 2.64 22.0699 2 20.5699 2Z" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.4" : "1"} d="M20.5699 13.5H4.76992C3.26992 13.5 2.66992 14.14 2.66992 15.73V19.77C2.66992 21.36 3.26992 22 4.76992 22H20.5699C22.0699 22 22.6699 21.36 22.6699 19.77V15.73C22.6699 14.14 22.0699 13.5 20.5699 13.5Z" fill="currentColor" /><path d="M20.5699 2H4.76992C3.26992 2 2.66992 2.64 2.66992 4.23V8.27C2.66992 9.86 3.26992 10.5 4.76992 10.5H20.5699C22.0699 10.5 22.6699 9.86 22.6699 8.27V4.23C22.6699 2.64 22.0699 2 20.5699 2Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.5699 13.5H4.76992C3.26992 13.5 2.66992 14.14 2.66992 15.73V19.77C2.66992 21.36 3.26992 22 4.76992 22H20.5699C22.0699 22 22.6699 21.36 22.6699 19.77V15.73C22.6699 14.14 22.0699 13.5 20.5699 13.5Z" fill="currentColor" /><path d="M20.5699 2H4.76992C3.26992 2 2.66992 2.64 2.66992 4.23V8.27C2.66992 9.86 3.26992 10.5 4.76992 10.5H20.5699C22.0699 10.5 22.6699 9.86 22.6699 8.27V4.23C22.6699 2.64 22.0699 2 20.5699 2Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconRowVertical;