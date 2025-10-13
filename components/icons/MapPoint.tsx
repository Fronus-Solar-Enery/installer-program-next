import { FC } from 'react';

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconMapPoint: FC<IconProps> = ({ className, fill = false, duotone = true, width = '1.5' }) => {
  return (
    <>
      {!fill ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.5" : "1"} d="M4 10.1435C4 5.64612 7.58172 2.00024 12 2.00024C16.4183 2.00024 20 5.64612 20 10.1435C20 14.6057 17.4467 19.8127 13.4629 21.6747C12.5343 22.1088 11.4657 22.1088 10.5371 21.6747C6.55332 19.8127 4 14.6057 4 10.1435Z" stroke="currentColor" strokeWidth={width} /><circle cx="12" cy="10.0002" r="3" stroke="currentColor" strokeWidth={width} /></svg> 
      ) : duotone ? (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity={duotone ? "0.5" : "1"} d="M12 2.00024C7.58172 2.00024 4 6.00283 4 10.5002C4 14.9624 6.55332 19.8127 10.5371 21.6747C11.4657 22.1088 12.5343 22.1088 13.4629 21.6747C17.4467 19.8127 20 14.9624 20 10.5002C20 6.00283 16.4183 2.00024 12 2.00024Z" fill="currentColor" /><path d="M12 12.5002C13.3807 12.5002 14.5 11.381 14.5 10.0002C14.5 8.61953 13.3807 7.50024 12 7.50024C10.6193 7.50024 9.5 8.61953 9.5 10.0002C9.5 11.381 10.6193 12.5002 12 12.5002Z" fill="currentColor" /></svg> 
      ) : (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 2.00024C7.58172 2.00024 4 6.00283 4 10.5002C4 14.9624 6.55332 19.8127 10.5371 21.6747C11.4657 22.1088 12.5343 22.1088 13.4629 21.6747C17.4467 19.8127 20 14.9624 20 10.5002C20 6.00283 16.4183 2.00024 12 2.00024ZM12 12.0002C13.1046 12.0002 14 11.1048 14 10.0002C14 8.89567 13.1046 8.00024 12 8.00024C10.8954 8.00024 10 8.89567 10 10.0002C10 11.1048 10.8954 12.0002 12 12.0002Z" fill="currentColor" /></svg> 
      )}
    </>
  );
};

export default IconMapPoint;