import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconSms: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6699 20.5H7.66992C4.66992 20.5 2.66992 19 2.66992 15.5V8.5C2.66992 5 4.66992 3.5 7.66992 3.5H17.6699C20.6699 3.5 22.6699 5 22.6699 8.5V15.5C22.6699 19 20.6699 20.5 17.6699 20.5Z" stroke="currentColor" strokeWidth={width} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /><path opacity={duotone ? "0.4" : "1"} d="M17.6699 9L14.5399 11.5C13.5099 12.32 11.8199 12.32 10.7899 11.5L7.66992 9" stroke="currentColor" strokeWidth={width} strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /></svg> 
      ) : duotone ? (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.4" : "1"} d="M17.6699 20.5H7.66992C4.66992 20.5 2.66992 19 2.66992 15.5V8.5C2.66992 5 4.66992 3.5 7.66992 3.5H17.6699C20.6699 3.5 22.6699 5 22.6699 8.5V15.5C22.6699 19 20.6699 20.5 17.6699 20.5Z" fill="currentColor" /><path d="M12.6697 12.87C11.8297 12.87 10.9797 12.61 10.3297 12.08L7.1997 9.57997C6.8797 9.31997 6.8197 8.84997 7.0797 8.52997C7.3397 8.20997 7.80971 8.14997 8.12971 8.40997L11.2597 10.91C12.0197 11.52 13.3097 11.52 14.0697 10.91L17.1997 8.40997C17.5197 8.14997 17.9997 8.19997 18.2497 8.52997C18.5097 8.84997 18.4597 9.32997 18.1297 9.57997L14.9997 12.08C14.3597 12.61 13.5097 12.87 12.6697 12.87Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6699 3.5H7.66992C4.66992 3.5 2.66992 5 2.66992 8.5V15.5C2.66992 19 4.66992 20.5 7.66992 20.5H17.6699C20.6699 20.5 22.6699 19 22.6699 15.5V8.5C22.6699 5 20.6699 3.5 17.6699 3.5ZM18.1399 9.59L15.0099 12.09C14.3499 12.62 13.5099 12.88 12.6699 12.88C11.8299 12.88 10.9799 12.62 10.3299 12.09L7.19992 9.59C6.87992 9.33 6.82992 8.85 7.07992 8.53C7.33992 8.21 7.80992 8.15 8.12992 8.41L11.2599 10.91C12.0199 11.52 13.3099 11.52 14.0699 10.91L17.1999 8.41C17.5199 8.15 17.9999 8.2 18.2499 8.53C18.5099 8.85 18.4599 9.33 18.1399 9.59Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconSms;