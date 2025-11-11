import { FC } from "react";

const IconMinus: FC<IconProps> = ({
  className,
  fill = false,
  duotone = true,
  width = "1.5",
  opacity = "0.4",
}) => {
  return (
    <>
      {!fill ? (
        <svg
          className={className}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity={duotone ? opacity : "1"}
            d="M12.5503 11.2499L11.8003 11.2499L11.8003 12.7499L12.5503 12.7499L12.5503 11.2499ZM18 12.7499C18.4142 12.7499 18.75 12.4141 18.75 11.9999C18.75 11.5857 18.4142 11.2499 18 11.2499L18 12.7499ZM12.5503 12.7499L18 12.7499L18 11.2499L12.5503 11.2499L12.5503 12.7499Z"
            fill="currentColor"
          />
          <path
            d="M6 11.2499C5.58579 11.2499 5.25 11.5857 5.25 11.9999C5.25 12.4141 5.58579 12.7499 6 12.7499V11.2499ZM11.25 12.7499H12V11.2499H11.25V12.7499ZM6 12.7499H11.25V11.2499H6V12.7499Z"
            fill="currentColor"
          />
        </svg>
      ) : duotone ? (
        <svg
          className={className}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            opacity={duotone ? opacity : "1"}
            x="5.25"
            y="11.25"
            width="13.5"
            height="1.5"
            rx="0.75"
            fill="currentColor"
          />
          <path
            d="M5.25 12C5.25 11.5858 5.58579 11.25 6 11.25H12V12.75H6C5.58579 12.75 5.25 12.4142 5.25 12Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          className={className}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 12.75H6C5.59 12.75 5.25 12.41 5.25 12C5.25 11.59 5.59 11.25 6 11.25H18C18.41 11.25 18.75 11.59 18.75 12C18.75 12.41 18.41 12.75 18 12.75Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconMinus;
