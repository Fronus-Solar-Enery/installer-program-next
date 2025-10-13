import { FC } from "react";

const IconGift: FC<IconProps> = ({
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
            d="M20.6399 10H4.63989V18C4.63989 21 5.63989 22 8.63989 22H16.6399C19.6399 22 20.6399 21 20.6399 18V10Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={duotone ? "0.4" : "1"}
          />
          <path
            d="M22.1699 7V8C22.1699 9.1 21.6399 10 20.1699 10H5.16992C3.63992 10 3.16992 9.1 3.16992 8V7C3.16992 5.9 3.63992 5 5.16992 5H20.1699C21.6399 5 22.1699 5.9 22.1699 7Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={duotone ? "0.4" : "1"}
          />
          <path
            d="M12.31 4.99994H6.78995C6.44995 4.62994 6.45995 4.05994 6.81995 3.69994L8.23995 2.27994C8.60995 1.90994 9.21995 1.90994 9.58995 2.27994L12.31 4.99994Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            // opacity={duotone ? "0.4" : "1"}
            d="M18.54 4.99994H13.02L15.74 2.27994C16.11 1.90994 16.72 1.90994 17.09 2.27994L18.51 3.69994C18.87 4.05994 18.88 4.62994 18.54 4.99994Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            // opacity={duotone ? "0.4" : "1"}
            d="M9.60986 10V15.14C9.60986 15.94 10.4899 16.41 11.1599 15.98L12.0999 15.36C12.4399 15.14 12.8699 15.14 13.1999 15.36L14.0899 15.96C14.7499 16.4 15.6399 15.93 15.6399 15.13V10H9.60986Z"
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
            d="M20.6399 10V18C20.6399 21 19.6399 22 16.6399 22H8.63989C5.63989 22 4.63989 21 4.63989 18V10H20.6399Z"
            fill="currentColor"
          />
          <path
            d="M22.1699 7V8C22.1699 9.1 21.6399 10 20.1699 10H5.16992C3.63992 10 3.16992 9.1 3.16992 8V7C3.16992 5.9 3.63992 5 5.16992 5H20.1699C21.6399 5 22.1699 5.9 22.1699 7Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.31 4.99994H6.78995C6.44995 4.62994 6.45995 4.05994 6.81995 3.69994L8.23995 2.27994C8.60995 1.90994 9.21995 1.90994 9.58995 2.27994L12.31 4.99994Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M18.54 4.99994H13.02L15.74 2.27994C16.11 1.90994 16.72 1.90994 17.09 2.27994L18.51 3.69994C18.87 4.05994 18.88 4.62994 18.54 4.99994Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.6" : "1"}
            d="M9.60986 10V15.14C9.60986 15.94 10.4899 16.41 11.1599 15.98L12.0999 15.36C12.4399 15.14 12.8699 15.14 13.1999 15.36L14.0899 15.96C14.7499 16.4 15.6399 15.93 15.6399 15.13V10H9.60986Z"
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
            d="M20.6699 12V18C20.6699 20.21 18.8799 22 16.6699 22H8.66992C6.45992 22 4.66992 20.21 4.66992 18V12C4.66992 11.45 5.11992 11 5.66992 11H7.63992C8.18992 11 8.63992 11.45 8.63992 12V15.14C8.63992 15.88 9.04992 16.56 9.69992 16.91C9.98992 17.07 10.3099 17.15 10.6399 17.15C11.0199 17.15 11.3999 17.04 11.7299 16.82L12.6799 16.2L13.5599 16.79C14.1699 17.2 14.9499 17.25 15.5999 16.9C16.2599 16.55 16.6699 15.88 16.6699 15.13V12C16.6699 11.45 17.1199 11 17.6699 11H19.6699C20.2199 11 20.6699 11.45 20.6699 12Z"
            fill="currentColor"
          />
          <path
            d="M22.1699 7V8C22.1699 9.1 21.6399 10 20.1699 10H5.16992C3.63992 10 3.16992 9.1 3.16992 8V7C3.16992 5.9 3.63992 5 5.16992 5H20.1699C21.6399 5 22.1699 5.9 22.1699 7Z"
            fill="currentColor"
          />
          <path
            d="M12.31 4.99994H6.78995C6.44995 4.62994 6.45995 4.05994 6.81995 3.69994L8.23995 2.27994C8.60995 1.90994 9.21995 1.90994 9.58995 2.27994L12.31 4.99994Z"
            fill="currentColor"
          />
          <path
            d="M18.54 4.99994H13.02L15.74 2.27994C16.11 1.90994 16.72 1.90994 17.09 2.27994L18.51 3.69994C18.87 4.05994 18.88 4.62994 18.54 4.99994Z"
            fill="currentColor"
          />
          <path
            d="M14.6399 11C15.1899 11 15.6399 11.45 15.6399 12V15.13C15.6399 15.93 14.7499 16.41 14.0899 15.96L13.1899 15.36C12.8599 15.14 12.4299 15.14 12.0899 15.36L11.1499 15.98C10.4899 16.42 9.60986 15.94 9.60986 15.15V12C9.60986 11.45 10.0599 11 10.6099 11H14.6399Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconGift;
