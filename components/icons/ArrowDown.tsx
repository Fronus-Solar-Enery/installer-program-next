import { FC } from "react";

const IconArrowDown: FC<IconProps> = ({
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
            d="M18.7401 14.4301L12.6701 20.5001L6.6001 14.4301"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.6699 3.5V20.33"
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
            d="M2.66992 16.19V7.81C2.66992 4.17 4.83992 2 8.47992 2H16.8499C20.4999 2 22.6699 4.17 22.6699 7.81V16.18C22.6699 19.82 20.4999 21.99 16.8599 21.99H8.47992C4.83992 22 2.66992 19.83 2.66992 16.19Z"
            fill="currentColor"
          />
          <path
            d="M12.1398 18.53L7.84982 14.24C7.55982 13.95 7.55982 13.47 7.84982 13.18C8.13982 12.89 8.61982 12.89 8.90982 13.18L11.9198 16.19V6C11.9198 5.59 12.2598 5.25 12.6698 5.25C13.0798 5.25 13.4198 5.59 13.4198 6V16.19L16.4298 13.18C16.7198 12.89 17.1998 12.89 17.4898 13.18C17.6398 13.33 17.7098 13.52 17.7098 13.71C17.7098 13.9 17.6398 14.09 17.4898 14.24L13.1998 18.53C13.0598 18.67 12.8698 18.75 12.6698 18.75C12.4698 18.75 12.2798 18.67 12.1398 18.53Z"
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
            d="M16.8599 2H8.47992C4.83992 2 2.66992 4.17 2.66992 7.81V16.18C2.66992 19.83 4.83992 22 8.47992 22H16.8499C20.4899 22 22.6599 19.83 22.6599 16.19V7.81C22.6699 4.17 20.4999 2 16.8599 2ZM17.4899 14.24L13.1999 18.53C13.0599 18.67 12.8699 18.75 12.6699 18.75C12.4699 18.75 12.2799 18.67 12.1399 18.53L7.84992 14.24C7.55992 13.95 7.55992 13.47 7.84992 13.18C8.13992 12.89 8.61992 12.89 8.90992 13.18L11.9199 16.19V6C11.9199 5.59 12.2599 5.25 12.6699 5.25C13.0799 5.25 13.4199 5.59 13.4199 6V16.19L16.4299 13.18C16.7199 12.89 17.1999 12.89 17.4899 13.18C17.6399 13.33 17.7099 13.52 17.7099 13.71C17.7099 13.9 17.6299 14.1 17.4899 14.24Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconArrowDown;
