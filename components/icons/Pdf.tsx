import { FC } from "react";

const IconPdf: FC<IconProps> = ({
  className,
  fill = false,
  duotone = false,
  width = "1.5",
  opacity = "0.3",
}) => {
  return (
    <>
      {!fill ? (
        <svg
          className={`size-4 ${className}`}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={width}
            d="M21.12 8.43h-2.91c-.73 0-1.46.58-1.46 1.46v2.18m0 0v3.64m0-3.64h3.64m-17.51 3.5v-2.91m0 0V8.29h2.18c1.16 0 2.18 1.02 2.18 2.18s-1.02 2.18-2.18 2.18H2.88zm8.9-4.23c1.31 0 2.48 1.02 2.48 2.33v2.33c0 1.31-1.16 2.33-2.48 2.33H9.89V8.43z"
          />
        </svg>
      ) : duotone ? (
        <svg
          className={`size-4 ${className}`}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={width}
            d="M21.12 8.43h-2.91c-.73 0-1.46.58-1.46 1.46v2.18m0 0v3.64m0-3.64h3.64m-17.51 3.5v-2.91m0 0V8.29h2.18c1.16 0 2.18 1.02 2.18 2.18s-1.02 2.18-2.18 2.18H2.88zm8.9-4.23c1.31 0 2.48 1.02 2.48 2.33v2.33c0 1.31-1.16 2.33-2.48 2.33H9.89V8.43z"
          />
        </svg>
      ) : (
        <svg
          className={`size-4 ${className}`}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={width}
            d="M21.12 8.43h-2.91c-.73 0-1.46.58-1.46 1.46v2.18m0 0v3.64m0-3.64h3.64m-17.51 3.5v-2.91m0 0V8.29h2.18c1.16 0 2.18 1.02 2.18 2.18s-1.02 2.18-2.18 2.18H2.88zm8.9-4.23c1.31 0 2.48 1.02 2.48 2.33v2.33c0 1.31-1.16 2.33-2.48 2.33H9.89V8.43z"
          />
        </svg>
      )}
    </>
  );
};

export default IconPdf;
