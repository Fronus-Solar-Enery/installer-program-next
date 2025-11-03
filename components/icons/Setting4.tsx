import { FC } from "react";

const IconSetting4: FC<IconProps> = ({
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
            d="M22.6699 6.5H16.6699"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g opacity={duotone ? "0.4" : "1"}>
            <path
              d="M6.66992 6.5H2.66992"
              stroke="currentColor"
              strokeWidth={width}
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.6699 10C12.6029 10 14.1699 8.433 14.1699 6.5C14.1699 4.567 12.6029 3 10.6699 3C8.73693 3 7.16992 4.567 7.16992 6.5C7.16992 8.433 8.73693 10 10.6699 10Z"
              stroke="currentColor"
              strokeWidth={width}
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <path
            d="M8.66992 17.5H2.66992"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g opacity={duotone ? "0.4" : "1"}>
            <path
              d="M22.6699 17.5H18.6699"
              stroke="currentColor"
              strokeWidth={width}
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.6699 21C16.6029 21 18.1699 19.433 18.1699 17.5C18.1699 15.567 16.6029 14 14.6699 14C12.7369 14 11.1699 15.567 11.1699 17.5C11.1699 19.433 12.7369 21 14.6699 21Z"
              stroke="currentColor"
              strokeWidth={width}
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      ) : duotone ? (
        <svg className={`size-4 ${className}`} width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M21.8999 7.61998H16.3599C15.9799 7.61998 15.6699 7.30998 15.6699 6.91998C15.6699 6.53998 15.9799 6.22998 16.3599 6.22998H21.8999C22.2799 6.22998 22.5899 6.53998 22.5899 6.91998C22.5899 7.30998 22.2799 7.61998 21.8999 7.61998Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M7.13 7.62023H3.44C3.06 7.62023 2.75 7.31023 2.75 6.93023C2.75 6.55023 3.06 6.24023 3.44 6.24023H7.13C7.51 6.24023 7.82 6.55023 7.82 6.93023C7.82 7.31023 7.51 7.62023 7.13 7.62023Z"
            fill="currentColor"
          />
          <path
            d="M10.8199 10.84C12.9849 10.84 14.7399 9.08496 14.7399 6.92C14.7399 4.75504 12.9849 3 10.8199 3C8.65495 3 6.8999 4.75504 6.8999 6.92C6.8999 9.08496 8.65495 10.84 10.8199 10.84Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M21.9 17.7701H18.21C17.83 17.7701 17.52 17.4601 17.52 17.0801C17.52 16.7001 17.83 16.3901 18.21 16.3901H21.9C22.28 16.3901 22.59 16.7001 22.59 17.0801C22.59 17.4601 22.28 17.7701 21.9 17.7701Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M8.98 17.7701H3.44C3.06 17.7701 2.75 17.4601 2.75 17.0801C2.75 16.7001 3.06 16.3901 3.44 16.3901H8.98C9.36 16.3901 9.67 16.7001 9.67 17.0801C9.67 17.4601 9.36 17.7701 8.98 17.7701Z"
            fill="currentColor"
          />
          <path
            d="M14.5201 21.0002C16.6851 21.0002 18.4401 19.2451 18.4401 17.0802C18.4401 14.9152 16.6851 13.1602 14.5201 13.1602C12.3551 13.1602 10.6001 14.9152 10.6001 17.0802C10.6001 19.2451 12.3551 21.0002 14.5201 21.0002Z"
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
            d="M21.9699 7.58018H16.3899C15.9999 7.58018 15.6899 7.27018 15.6899 6.88018C15.6899 6.49018 15.9999 6.18018 16.3899 6.18018H21.9699C22.3599 6.18018 22.6699 6.49018 22.6699 6.88018C22.6699 7.27018 22.3599 7.58018 21.9699 7.58018Z"
            fill="currentColor"
          />
          <path
            d="M7.08992 7.58018H3.36992C2.97992 7.58018 2.66992 7.27018 2.66992 6.88018C2.66992 6.49018 2.97992 6.18018 3.36992 6.18018H7.08992C7.47992 6.18018 7.78992 6.49018 7.78992 6.88018C7.78992 7.27018 7.46992 7.58018 7.08992 7.58018Z"
            fill="currentColor"
          />
          <path
            d="M10.8099 10.8302C12.9914 10.8302 14.7599 9.0617 14.7599 6.88018C14.7599 4.69865 12.9914 2.93018 10.8099 2.93018C8.62834 2.93018 6.85986 4.69865 6.85986 6.88018C6.85986 9.0617 8.62834 10.8302 10.8099 10.8302Z"
            fill="currentColor"
          />
          <path
            d="M21.9698 17.8102H18.2498C17.8598 17.8102 17.5498 17.5002 17.5498 17.1102C17.5498 16.7202 17.8598 16.4102 18.2498 16.4102H21.9698C22.3598 16.4102 22.6698 16.7202 22.6698 17.1102C22.6698 17.5002 22.3598 17.8102 21.9698 17.8102Z"
            fill="currentColor"
          />
          <path
            d="M8.94992 17.8102H3.36992C2.97992 17.8102 2.66992 17.5002 2.66992 17.1102C2.66992 16.7202 2.97992 16.4102 3.36992 16.4102H8.94992C9.33992 16.4102 9.64992 16.7202 9.64992 17.1102C9.64992 17.5002 9.32992 17.8102 8.94992 17.8102Z"
            fill="currentColor"
          />
          <path
            d="M14.5301 21.0699C16.7116 21.0699 18.4801 19.3014 18.4801 17.1199C18.4801 14.9384 16.7116 13.1699 14.5301 13.1699C12.3486 13.1699 10.5801 14.9384 10.5801 17.1199C10.5801 19.3014 12.3486 21.0699 14.5301 21.0699Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconSetting4;
