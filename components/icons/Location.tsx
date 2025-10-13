import { FC } from "react";

const IconLocation: FC<IconProps> = ({
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
            opacity={duotone ? "0.4" : "1"}
            d="M12.6698 13.4299C14.3929 13.4299 15.7898 12.0331 15.7898 10.3099C15.7898 8.58681 14.3929 7.18994 12.6698 7.18994C10.9467 7.18994 9.5498 8.58681 9.5498 10.3099C9.5498 12.0331 10.9467 13.4299 12.6698 13.4299Z"
            stroke="currentColor"
            strokeWidth={width}
          />
          <path
            d="M4.28963 8.49C6.25963 -0.169998 19.0896 -0.159997 21.0496 8.5C22.1996 13.58 19.0396 17.88 16.2696 20.54C14.2596 22.48 11.0796 22.48 9.05963 20.54C6.29963 17.88 3.13963 13.57 4.28963 8.49Z"
            stroke="currentColor"
            strokeWidth={width}
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
            d="M21.29 8.45C20.24 3.83 16.21 1.75 12.67 1.75C12.67 1.75 12.67 1.75 12.66 1.75C9.13002 1.75 5.09002 3.82 4.04002 8.44C2.87002 13.6 6.03002 17.97 8.89002 20.72C9.95002 21.74 11.31 22.25 12.67 22.25C14.03 22.25 15.39 21.74 16.44 20.72C19.3 17.97 22.46 13.61 21.29 8.45Z"
            fill="currentColor"
          />
          <path
            d="M12.6695 13.4602C14.4092 13.4602 15.8195 12.0499 15.8195 10.3102C15.8195 8.57046 14.4092 7.16016 12.6695 7.16016C10.9298 7.16016 9.51953 8.57046 9.51953 10.3102C9.51953 12.0499 10.9298 13.4602 12.6695 13.4602Z"
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
          <g clipPath="url(#clip0_12_64849)">
            <path
              d="M21.29 8.45C20.24 3.83 16.21 1.75 12.67 1.75C12.67 1.75 12.67 1.75 12.66 1.75C9.13002 1.75 5.09002 3.82 4.04002 8.44C2.87002 13.6 6.03002 17.97 8.89002 20.72C9.95002 21.74 11.31 22.25 12.67 22.25C14.03 22.25 15.39 21.74 16.44 20.72C19.3 17.97 22.46 13.61 21.29 8.45ZM12.67 13.46C10.93 13.46 9.52002 12.05 9.52002 10.31C9.52002 8.57 10.93 7.16 12.67 7.16C14.41 7.16 15.82 8.57 15.82 10.31C15.82 12.05 14.41 13.46 12.67 13.46Z"
              fill="currentColor"
            />
          </g>
          <defs>
            <clipPath>
              <rect
                width="24"
                height="24"
                fill="none"
                transform="translate(0.669922)"
              />
            </clipPath>
          </defs>
        </svg>
      )}
    </>
  );
};

// Keywords for search and categorization
(IconLocation as IconComponent).keywords = [
  "location",
  "position",
  "placement",
  "positioning",
  "localization",
  "localisation",
  "emplacement",
  "fix",
  "locating",
  "situating",
];

export default IconLocation as IconComponent;
