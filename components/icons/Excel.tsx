import { FC } from "react";

const IconExcel: FC<IconProps> = ({
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
            d="M57.874 41.916v26.507c0 8.334 0 12.492 2.585 15.076 2.584 2.585 6.76 2.585 15.076 2.585M15.283 41.916 28.537 64m0 0L41.79 86.084M28.537 64 41.79 41.916M28.537 64 15.283 86.084m97.436-44.168H99.466a8.827 8.827 0 0 0-8.83 8.83v4.424c0 4.887 3.959 8.83 8.83 8.83h4.423c4.887 0 8.83 3.96 8.83 8.83v4.424a8.827 8.827 0 0 1-8.83 8.83H90.635"
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
            d="M57.874 41.916v26.507c0 8.334 0 12.492 2.585 15.076 2.584 2.585 6.76 2.585 15.076 2.585M15.283 41.916 28.537 64m0 0L41.79 86.084M28.537 64 41.79 41.916M28.537 64 15.283 86.084m97.436-44.168H99.466a8.827 8.827 0 0 0-8.83 8.83v4.424c0 4.887 3.959 8.83 8.83 8.83h4.423c4.887 0 8.83 3.96 8.83 8.83v4.424a8.827 8.827 0 0 1-8.83 8.83H90.635"
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
            d="M57.874 41.916v26.507c0 8.334 0 12.492 2.585 15.076 2.584 2.585 6.76 2.585 15.076 2.585M15.283 41.916 28.537 64m0 0L41.79 86.084M28.537 64 41.79 41.916M28.537 64 15.283 86.084m97.436-44.168H99.466a8.827 8.827 0 0 0-8.83 8.83v4.424c0 4.887 3.959 8.83 8.83 8.83h4.423c4.887 0 8.83 3.96 8.83 8.83v4.424a8.827 8.827 0 0 1-8.83 8.83H90.635"
          />
        </svg>
      )}
    </>
  );
};

export default IconExcel;
