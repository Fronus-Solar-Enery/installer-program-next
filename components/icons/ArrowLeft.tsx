import { FC } from "react";

const IconArrowLeft: FC<IconProps> = ({
  className,
  fill = false,
  duotone = true,
  width = "1.5",
}) => {
  return (
    <>
      {!fill ? (
        <svg
          className={className}
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.2399 5.93005L4.16992 12.0001L10.2399 18.0701"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M21.1698 12H4.33984"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : duotone ? (
        <svg
          className={className}
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M8.47992 2H16.8499C20.4999 2 22.6699 4.17 22.6699 7.81V16.18C22.6699 19.82 20.4999 21.99 16.8599 21.99H8.47992C4.83992 22 2.66992 19.83 2.66992 16.19V7.81C2.66992 4.17 4.83992 2 8.47992 2Z"
            fill="currentColor"
          />
          <path
            d="M6.13992 11.47L10.4299 7.18002C10.7199 6.89002 11.1999 6.89002 11.4899 7.18002C11.7799 7.47002 11.7799 7.95002 11.4899 8.24002L8.47992 11.25H18.6699C19.0799 11.25 19.4199 11.59 19.4199 12C19.4199 12.41 19.0799 12.75 18.6699 12.75H8.47992L11.4899 15.76C11.7799 16.05 11.7799 16.53 11.4899 16.82C11.3399 16.97 11.1499 17.04 10.9599 17.04C10.7699 17.04 10.5799 16.97 10.4299 16.82L6.13992 12.53C5.99992 12.39 5.91992 12.2 5.91992 12C5.91992 11.8 5.99992 11.61 6.13992 11.47Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          className={className}
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.8599 2H8.47992C4.83992 2 2.66992 4.17 2.66992 7.81V16.18C2.66992 19.83 4.83992 22 8.47992 22H16.8499C20.4899 22 22.6599 19.83 22.6599 16.19V7.81C22.6699 4.17 20.4999 2 16.8599 2ZM18.6699 12.75H8.47992L11.4899 15.76C11.7799 16.05 11.7799 16.53 11.4899 16.82C11.3399 16.97 11.1499 17.04 10.9599 17.04C10.7699 17.04 10.5799 16.97 10.4299 16.82L6.13992 12.53C5.99992 12.39 5.91992 12.2 5.91992 12C5.91992 11.8 5.99992 11.61 6.13992 11.47L10.4299 7.18C10.7199 6.89 11.1999 6.89 11.4899 7.18C11.7799 7.47 11.7799 7.95 11.4899 8.24L8.47992 11.25H18.6699C19.0799 11.25 19.4199 11.59 19.4199 12C19.4199 12.41 19.0799 12.75 18.6699 12.75Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconArrowLeft;
