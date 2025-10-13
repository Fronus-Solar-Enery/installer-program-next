import { FC } from "react";

const IconUserOctagon: FC<IconProps> = ({
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
            d="M21.7501 8.58003V15.42C21.7501 16.54 21.1501 17.58 20.1801 18.15L14.2401 21.58C13.2701 22.14 12.0701 22.14 11.0901 21.58L5.15008 18.15C4.18008 17.59 3.58008 16.55 3.58008 15.42V8.58003C3.58008 7.46003 4.18008 6.41999 5.15008 5.84999L11.0901 2.42C12.0601 1.86 13.2601 1.86 14.2401 2.42L20.1801 5.84999C21.1501 6.41999 21.7501 7.45003 21.7501 8.58003Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.6698 11.0001C13.9567 11.0001 14.9998 9.95687 14.9998 8.67004C14.9998 7.38322 13.9567 6.34009 12.6698 6.34009C11.383 6.34009 10.3398 7.38322 10.3398 8.67004C10.3398 9.95687 11.383 11.0001 12.6698 11.0001Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M16.6699 16.6599C16.6699 14.8599 14.8799 13.3999 12.6699 13.3999C10.4599 13.3999 8.66992 14.8599 8.66992 16.6599"
            stroke="currentColor"
            strokeWidth={width}
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
            d="M21.7501 8.58003V15.42C21.7501 16.54 21.1501 17.58 20.1801 18.15L14.2401 21.58C13.2701 22.14 12.0701 22.14 11.0901 21.58L5.15008 18.15C4.18008 17.59 3.58008 16.55 3.58008 15.42V8.58003C3.58008 7.46003 4.18008 6.41999 5.15008 5.84999L11.0901 2.42C12.0601 1.86 13.2601 1.86 14.2401 2.42L20.1801 5.84999C21.1501 6.41999 21.7501 7.45003 21.7501 8.58003Z"
            fill="currentColor"
          />
          <path
            d="M12.6698 12.0001C13.9567 12.0001 14.9998 10.9569 14.9998 9.67004C14.9998 8.38322 13.9567 7.34009 12.6698 7.34009C11.383 7.34009 10.3398 8.38322 10.3398 9.67004C10.3398 10.9569 11.383 12.0001 12.6698 12.0001Z"
            fill="currentColor"
          />
          <path
            d="M15.3501 16.6601C16.1601 16.6601 16.6301 15.7601 16.1801 15.0901C15.5001 14.0801 14.1801 13.4001 12.6701 13.4001C11.1601 13.4001 9.84008 14.0801 9.16008 15.0901C8.71008 15.7601 9.18008 16.6601 9.99008 16.6601H15.3501Z"
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
            d="M20.1798 5.85L14.2398 2.42C13.2698 1.86 12.0698 1.86 11.0898 2.42L5.15984 5.85C4.18984 6.41 3.58984 7.45 3.58984 8.58V15.42C3.58984 16.54 4.18984 17.58 5.15984 18.15L11.0998 21.58C12.0698 22.14 13.2698 22.14 14.2498 21.58L20.1898 18.15C21.1598 17.59 21.7598 16.55 21.7598 15.42V8.58C21.7498 7.45 21.1498 6.42 20.1798 5.85ZM12.6698 7.34C13.9598 7.34 14.9998 8.38 14.9998 9.67C14.9998 10.96 13.9598 12 12.6698 12C11.3798 12 10.3398 10.96 10.3398 9.67C10.3398 8.39 11.3798 7.34 12.6698 7.34ZM15.3498 16.66H9.98984C9.17984 16.66 8.70984 15.76 9.15984 15.09C9.83984 14.08 11.1598 13.4 12.6698 13.4C14.1798 13.4 15.4998 14.08 16.1798 15.09C16.6298 15.75 16.1498 16.66 15.3498 16.66Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

// Keywords for search and categorization
(IconUserOctagon as IconComponent).keywords = [
  "user",
  "octagon",
  "exploiter",
  "enjoyer",
  "drug user",
  "substance abuser",
  "customer",
  "client",
  "employer",
  "consumer",
  "employee",
  "decagon",
  "hexagon",
  "dodecagon",
  "octogonal",
  "hexagonal",
  "oval",
  "triangled",
  "triangle",
  "square",
];

export default IconUserOctagon as IconComponent;
