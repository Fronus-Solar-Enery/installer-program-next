import { FC } from "react";

const IconSortFromTopToBottom: FC<IconProps> = ({
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
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 16.0002H13"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.7" : "1"}
            d="M6 11.0002H13"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.3" : "1"}
            d="M8 6.00024L13 6.00024"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            d="M17 4.00024L17 20.0002L20 16.0002"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
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
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17 3.25024C17.4142 3.25024 17.75 3.58603 17.75 4.00024V17.7502L19.4 15.5502C19.6485 15.2189 20.1186 15.1517 20.45 15.4002C20.7814 15.6488 20.8485 16.1189 20.6 16.4502L17.6 20.4502C17.4063 20.7085 17.0691 20.8138 16.7628 20.7118C16.4566 20.6097 16.25 20.3231 16.25 20.0002V4.00024C16.25 3.58603 16.5858 3.25024 17 3.25024Z"
            fill="currentColor"
          />
          <path
            d="M3.25 16.0002C3.25 15.586 3.58579 15.2502 4 15.2502H13C13.4142 15.2502 13.75 15.586 13.75 16.0002C13.75 16.4145 13.4142 16.7502 13 16.7502H4C3.58579 16.7502 3.25 16.4145 3.25 16.0002Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.7" : "1"}
            d="M5.25 11.0002C5.25 10.586 5.58579 10.2502 6 10.2502H13C13.4142 10.2502 13.75 10.586 13.75 11.0002C13.75 11.4145 13.4142 11.7502 13 11.7502H6C5.58579 11.7502 5.25 11.4145 5.25 11.0002Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M7.25 6.00024C7.25 5.58603 7.58579 5.25024 8 5.25024H13C13.4142 5.25024 13.75 5.58603 13.75 6.00024C13.75 6.41446 13.4142 6.75024 13 6.75024H8C7.58579 6.75024 7.25 6.41446 7.25 6.00024Z"
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
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17 3.25024C17.4142 3.25024 17.75 3.58603 17.75 4.00024V17.7502L19.4 15.5502C19.6485 15.2189 20.1186 15.1517 20.45 15.4002C20.7814 15.6488 20.8485 16.1189 20.6 16.4502L17.6 20.4502C17.4063 20.7085 17.0691 20.8138 16.7628 20.7118C16.4566 20.6097 16.25 20.3231 16.25 20.0002V4.00024C16.25 3.58603 16.5858 3.25024 17 3.25024ZM7.25 6.00024C7.25 5.58603 7.58579 5.25024 8 5.25024H13C13.4142 5.25024 13.75 5.58603 13.75 6.00024C13.75 6.41446 13.4142 6.75024 13 6.75024H8C7.58579 6.75024 7.25 6.41446 7.25 6.00024ZM5.25 11.0002C5.25 10.586 5.58579 10.2502 6 10.2502H13C13.4142 10.2502 13.75 10.586 13.75 11.0002C13.75 11.4145 13.4142 11.7502 13 11.7502H6C5.58579 11.7502 5.25 11.4145 5.25 11.0002ZM3.25 16.0002C3.25 15.586 3.58579 15.2502 4 15.2502H13C13.4142 15.2502 13.75 15.586 13.75 16.0002C13.75 16.4145 13.4142 16.7502 13 16.7502H4C3.58579 16.7502 3.25 16.4145 3.25 16.0002Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

// Keywords for search and categorization
(IconSortFromTopToBottom as IconComponent).keywords = [
  "sort",
  "from",
  "top",
  "to",
  "bottom",
  "classify",
  "assort",
  "class",
  "form",
  "kind",
  "sort out",
  "variety",
  "separate",
  "screen",
  "according",
  "across",
  "addressed",
  "after",
  "against",
  "aged",
  "ago",
  "alleging",
  "along",
  "upper side",
  "upside",
  "elevation",
  "uppermost",
  "height",
  "pinnacle",
  "peak",
  "upper",
  "topmost",
  "square-toed",
  "pointed-toe",
  "pointy-toed",
  "squared-toe",
  "eap",
  "pae",
  "efp",
  "css",
  "tcs",
  "ass",
  "bed",
  "backside",
  "underside",
  "undersurface",
  "penetrate",
  "derriere",
  "fathom",
  "seat",
];

export default IconSortFromTopToBottom as IconComponent;
