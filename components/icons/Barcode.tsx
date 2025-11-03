import { FC } from "react";

const IconBarcode: FC<IconProps> = ({
  className,
  fill = false,
  duotone = false,
  width = "1.5",
  opacity = "0.4",
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
            d="M17.6699 20.5H7.66992C4.66992 20.5 2.66992 19 2.66992 15.5V8.5C2.66992 5 4.66992 3.5 7.66992 3.5H17.6699C20.6699 3.5 22.6699 5 22.6699 8.5V15.5C22.6699 19 20.6699 20.5 17.6699 20.5Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? opacity : "1"}
            d="M6.66992 8V16"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.66992 8V12"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.66992 15V16"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.6699 8V9"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? opacity : "1"}
            d="M12.6699 8V16"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.6699 12V16"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? opacity : "1"}
            d="M18.6699 8V16"
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
            opacity={duotone ? opacity : "1"}
            d="M17.6699 20.5H7.66992C4.66992 20.5 2.66992 19 2.66992 15.5V8.5C2.66992 5 4.66992 3.5 7.66992 3.5H17.6699C20.6699 3.5 22.6699 5 22.6699 8.5V15.5C22.6699 19 20.6699 20.5 17.6699 20.5Z"
            fill="currentColor"
          />
          <path
            d="M6.66992 16.75C6.25992 16.75 5.91992 16.41 5.91992 16V8C5.91992 7.59 6.25992 7.25 6.66992 7.25C7.07992 7.25 7.41992 7.59 7.41992 8V16C7.41992 16.41 7.07992 16.75 6.66992 16.75Z"
            fill="currentColor"
          />
          <path
            d="M9.66992 12.75C9.25992 12.75 8.91992 12.41 8.91992 12V8C8.91992 7.59 9.25992 7.25 9.66992 7.25C10.0799 7.25 10.4199 7.59 10.4199 8V12C10.4199 12.41 10.0799 12.75 9.66992 12.75Z"
            fill="currentColor"
          />
          <path
            d="M9.66992 16.75C9.25992 16.75 8.91992 16.41 8.91992 16V15C8.91992 14.59 9.25992 14.25 9.66992 14.25C10.0799 14.25 10.4199 14.59 10.4199 15V16C10.4199 16.41 10.0799 16.75 9.66992 16.75Z"
            fill="currentColor"
          />
          <path
            d="M15.6699 9.75C15.2599 9.75 14.9199 9.41 14.9199 9V8C14.9199 7.59 15.2599 7.25 15.6699 7.25C16.0799 7.25 16.4199 7.59 16.4199 8V9C16.4199 9.41 16.0799 9.75 15.6699 9.75Z"
            fill="currentColor"
          />
          <path
            d="M12.6699 16.75C12.2599 16.75 11.9199 16.41 11.9199 16V8C11.9199 7.59 12.2599 7.25 12.6699 7.25C13.0799 7.25 13.4199 7.59 13.4199 8V16C13.4199 16.41 13.0799 16.75 12.6699 16.75Z"
            fill="currentColor"
          />
          <path
            d="M15.6699 16.75C15.2599 16.75 14.9199 16.41 14.9199 16V12C14.9199 11.59 15.2599 11.25 15.6699 11.25C16.0799 11.25 16.4199 11.59 16.4199 12V16C16.4199 16.41 16.0799 16.75 15.6699 16.75Z"
            fill="currentColor"
          />
          <path
            d="M18.6699 16.75C18.2599 16.75 17.9199 16.41 17.9199 16V8C17.9199 7.59 18.2599 7.25 18.6699 7.25C19.0799 7.25 19.4199 7.59 19.4199 8V16C19.4199 16.41 19.0799 16.75 18.6699 16.75Z"
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
            d="M17.6699 3.5H7.66992C4.66992 3.5 2.66992 5 2.66992 8.5V15.5C2.66992 19 4.66992 20.5 7.66992 20.5H17.6699C20.6699 20.5 22.6699 19 22.6699 15.5V8.5C22.6699 5 20.6699 3.5 17.6699 3.5ZM7.41992 16C7.41992 16.41 7.07992 16.75 6.66992 16.75C6.25992 16.75 5.91992 16.41 5.91992 16V8C5.91992 7.59 6.25992 7.25 6.66992 7.25C7.07992 7.25 7.41992 7.59 7.41992 8V16ZM10.4199 16C10.4199 16.41 10.0799 16.75 9.66992 16.75C9.25992 16.75 8.91992 16.41 8.91992 16V15C8.91992 14.59 9.25992 14.25 9.66992 14.25C10.0799 14.25 10.4199 14.59 10.4199 15V16ZM10.4199 12C10.4199 12.41 10.0799 12.75 9.66992 12.75C9.25992 12.75 8.91992 12.41 8.91992 12V8C8.91992 7.59 9.25992 7.25 9.66992 7.25C10.0799 7.25 10.4199 7.59 10.4199 8V12ZM13.4199 16C13.4199 16.41 13.0799 16.75 12.6699 16.75C12.2599 16.75 11.9199 16.41 11.9199 16V8C11.9199 7.59 12.2599 7.25 12.6699 7.25C13.0799 7.25 13.4199 7.59 13.4199 8V16ZM16.4199 16C16.4199 16.41 16.0799 16.75 15.6699 16.75C15.2599 16.75 14.9199 16.41 14.9199 16V12C14.9199 11.59 15.2599 11.25 15.6699 11.25C16.0799 11.25 16.4199 11.59 16.4199 12V16ZM16.4199 9C16.4199 9.41 16.0799 9.75 15.6699 9.75C15.2599 9.75 14.9199 9.41 14.9199 9V8C14.9199 7.59 15.2599 7.25 15.6699 7.25C16.0799 7.25 16.4199 7.59 16.4199 8V9ZM19.4199 16C19.4199 16.41 19.0799 16.75 18.6699 16.75C18.2599 16.75 17.9199 16.41 17.9199 16V8C17.9199 7.59 18.2599 7.25 18.6699 7.25C19.0799 7.25 19.4199 7.59 19.4199 8V16Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconBarcode;
