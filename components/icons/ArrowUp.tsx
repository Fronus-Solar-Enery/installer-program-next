import { FC } from "react";

const IconArrowUp: FC<IconProps> = ({
  className,
  fill = false,
  duotone = false,
  width = "1.5",
}) => {
  return (
    <>
      {!fill ? (
        <svg className={`size-4 ${className}`} width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18.7401 9.57L12.6701 3.5L6.6001 9.57"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.6699 20.5V3.67004"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : duotone ? (
        <svg className={`size-4 ${className}`} width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M22.6699 7.81V16.18C22.6699 19.82 20.4999 21.99 16.8599 21.99H8.47992C4.83992 22 2.66992 19.83 2.66992 16.19V7.81C2.66992 4.17 4.83992 2 8.47992 2H16.8499C20.4999 2 22.6699 4.17 22.6699 7.81Z"
            fill="currentColor"
          />
          <path
            d="M13.1999 5.47L17.4899 9.76C17.7799 10.05 17.7799 10.53 17.4899 10.82C17.1999 11.11 16.7199 11.11 16.4299 10.82L13.4199 7.81V18C13.4199 18.41 13.0799 18.75 12.6699 18.75C12.2599 18.75 11.9199 18.41 11.9199 18V7.81L8.90988 10.82C8.61988 11.11 8.13988 11.11 7.84988 10.82C7.69988 10.67 7.62988 10.48 7.62988 10.29C7.62988 10.1 7.70988 9.9 7.84988 9.76L12.1399 5.47C12.2799 5.33 12.4699 5.25 12.6699 5.25C12.8699 5.25 13.0599 5.33 13.1999 5.47Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg className={`size-4 ${className}`} width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16.8599 2H8.47992C4.83992 2 2.66992 4.17 2.66992 7.81V16.18C2.66992 19.83 4.83992 22 8.47992 22H16.8499C20.4899 22 22.6599 19.83 22.6599 16.19V7.81C22.6699 4.17 20.4999 2 16.8599 2ZM17.4899 10.82C17.1999 11.11 16.7199 11.11 16.4299 10.82L13.4199 7.81V18C13.4199 18.41 13.0799 18.75 12.6699 18.75C12.2599 18.75 11.9199 18.41 11.9199 18V7.81L8.90992 10.82C8.61992 11.11 8.13992 11.11 7.84992 10.82C7.69992 10.67 7.62992 10.48 7.62992 10.29C7.62992 10.1 7.70992 9.9 7.84992 9.76L12.1399 5.47C12.2799 5.33 12.4699 5.25 12.6699 5.25C12.8699 5.25 13.0599 5.33 13.1999 5.47L17.4899 9.76C17.7799 10.05 17.7799 10.52 17.4899 10.82Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconArrowUp;
