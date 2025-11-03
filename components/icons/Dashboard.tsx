import { FC } from "react";

const IconDashboard: FC<IconProps> = ({
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
            d="M22.6699 10.9V4.1C22.6699 2.6 22.0299 2 20.4399 2H16.3999C14.8099 2 14.1699 2.6 14.1699 4.1V10.9C14.1699 12.4 14.8099 13 16.3999 13H20.4399C22.0299 13 22.6699 12.4 22.6699 10.9Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M22.6699 19.9V18.1C22.6699 16.6 22.0299 16 20.4399 16H16.3999C14.8099 16 14.1699 16.6 14.1699 18.1V19.9C14.1699 21.4 14.8099 22 16.3999 22H20.4399C22.0299 22 22.6699 21.4 22.6699 19.9Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.1699 13.1V19.9C11.1699 21.4 10.5299 22 8.93992 22H4.89992C3.30992 22 2.66992 21.4 2.66992 19.9V13.1C2.66992 11.6 3.30992 11 4.89992 11H8.93992C10.5299 11 11.1699 11.6 11.1699 13.1Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M11.1699 4.1V5.9C11.1699 7.4 10.5299 8 8.93992 8H4.89992C3.30992 8 2.66992 7.4 2.66992 5.9V4.1C2.66992 2.6 3.30992 2 4.89992 2H8.93992C10.5299 2 11.1699 2.6 11.1699 4.1Z"
            stroke="currentColor"
            strokeWidth={width}
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
            d="M22.1699 10.9V4.1C22.1699 2.6 21.5299 2 19.9399 2H15.8999C14.3099 2 13.6699 2.6 13.6699 4.1V10.9C13.6699 12.4 14.3099 13 15.8999 13H19.9399C21.5299 13 22.1699 12.4 22.1699 10.9Z"
            fill="currentColor"
          />
          <path
            d="M11.6699 13.1V19.9C11.6699 21.4 11.0299 22 9.43992 22H5.39992C3.80992 22 3.16992 21.4 3.16992 19.9V13.1C3.16992 11.6 3.80992 11 5.39992 11H9.43992C11.0299 11 11.6699 11.6 11.6699 13.1Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M22.1699 19.9V17.1C22.1699 15.6 21.5299 15 19.9399 15H15.8999C14.3099 15 13.6699 15.6 13.6699 17.1V19.9C13.6699 21.4 14.3099 22 15.8999 22H19.9399C21.5299 22 22.1699 21.4 22.1699 19.9Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M11.6699 6.9V4.1C11.6699 2.6 11.0299 2 9.43992 2H5.39992C3.80992 2 3.16992 2.6 3.16992 4.1V6.9C3.16992 8.4 3.80992 9 5.39992 9H9.43992C11.0299 9 11.6699 8.4 11.6699 6.9Z"
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
            d="M22.1699 10.9V4.1C22.1699 2.6 21.5299 2 19.9399 2H15.8999C14.3099 2 13.6699 2.6 13.6699 4.1V10.9C13.6699 12.4 14.3099 13 15.8999 13H19.9399C21.5299 13 22.1699 12.4 22.1699 10.9Z"
            fill="currentColor"
          />
          <path
            d="M11.6699 13.1V19.9C11.6699 21.4 11.0299 22 9.43992 22H5.39992C3.80992 22 3.16992 21.4 3.16992 19.9V13.1C3.16992 11.6 3.80992 11 5.39992 11H9.43992C11.0299 11 11.6699 11.6 11.6699 13.1Z"
            fill="currentColor"
          />
          <path
            d="M22.1699 19.9V17.1C22.1699 15.6 21.5299 15 19.9399 15H15.8999C14.3099 15 13.6699 15.6 13.6699 17.1V19.9C13.6699 21.4 14.3099 22 15.8999 22H19.9399C21.5299 22 22.1699 21.4 22.1699 19.9Z"
            fill="currentColor"
          />
          <path
            d="M11.6699 6.9V4.1C11.6699 2.6 11.0299 2 9.43992 2H5.39992C3.80992 2 3.16992 2.6 3.16992 4.1V6.9C3.16992 8.4 3.80992 9 5.39992 9H9.43992C11.0299 9 11.6699 8.4 11.6699 6.9Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconDashboard;
