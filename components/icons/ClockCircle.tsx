import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconClockCircle: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle opacity={duotone ? "0.5" : "1"} cx="12" cy="12.0005" r="10" stroke="currentColor" strokeWidth={width} /><path d="M12 8.00049V12.0005L14.5 14.5005" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.5" : "1"} d="M12 22.0005C17.5228 22.0005 22 17.5233 22 12.0005C22 6.47764 17.5228 2.00049 12 2.00049C6.47715 2.00049 2 6.47764 2 12.0005C2 17.5233 6.47715 22.0005 12 22.0005Z" fill="currentColor" /><path fillRule="evenodd" clipRule="evenodd" d="M12 7.25049C12.4142 7.25049 12.75 7.58627 12.75 8.00049V11.6898L15.0303 13.9702C15.3232 14.2631 15.3232 14.7379 15.0303 15.0308C14.7374 15.3237 14.2626 15.3237 13.9697 15.0308L11.4697 12.5308C11.329 12.3902 11.25 12.1994 11.25 12.0005V8.00049C11.25 7.58627 11.5858 7.25049 12 7.25049Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 22.0005C17.5228 22.0005 22 17.5233 22 12.0005C22 6.47764 17.5228 2.00049 12 2.00049C6.47715 2.00049 2 6.47764 2 12.0005C2 17.5233 6.47715 22.0005 12 22.0005ZM12.75 8.00049C12.75 7.58627 12.4142 7.25049 12 7.25049C11.5858 7.25049 11.25 7.58627 11.25 8.00049V12.0005C11.25 12.1994 11.329 12.3902 11.4697 12.5308L13.9697 15.0308C14.2626 15.3237 14.7374 15.3237 15.0303 15.0308C15.3232 14.7379 15.3232 14.2631 15.0303 13.9702L12.75 11.6898V8.00049Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconClockCircle;