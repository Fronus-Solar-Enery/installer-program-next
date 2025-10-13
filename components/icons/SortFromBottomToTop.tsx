import { FC } from "react";

const IconSortFromBottomToTop: FC<IconProps> = ({
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
            d="M4 8.00024H13"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.7" : "1"}
            d="M6 13.0002H13"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M8 18.0002H13"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            d="M17 20.0002V4.00024L20 8.00024"
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
            d="M17 20.7502C17.4142 20.7502 17.75 20.4145 17.75 20.0002V6.25025L19.4 8.45025C19.6485 8.78162 20.1186 8.84877 20.45 8.60025C20.7814 8.35172 20.8485 7.88162 20.6 7.55025L17.6 3.55025C17.4063 3.29199 17.0691 3.18665 16.7628 3.28873C16.4566 3.39082 16.25 3.67742 16.25 4.00025V20.0002C16.25 20.4145 16.5858 20.7502 17 20.7502Z"
            fill="currentColor"
          />
          <path
            d="M3.25 8.00024C3.25 8.41446 3.58579 8.75024 4 8.75024H13C13.4142 8.75024 13.75 8.41446 13.75 8.00024C13.75 7.58603 13.4142 7.25024 13 7.25024H4C3.58579 7.25024 3.25 7.58603 3.25 8.00024Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.7" : "1"}
            d="M5.25 13.0002C5.25 13.4145 5.58579 13.7502 6 13.7502H13C13.4142 13.7502 13.75 13.4145 13.75 13.0002C13.75 12.586 13.4142 12.2502 13 12.2502H6C5.58579 12.2502 5.25 12.586 5.25 13.0002Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M7.25 18.0002C7.25 18.4145 7.58579 18.7502 8 18.7502H13C13.4142 18.7502 13.75 18.4145 13.75 18.0002C13.75 17.586 13.4142 17.2502 13 17.2502H8C7.58579 17.2502 7.25 17.586 7.25 18.0002Z"
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
            d="M16.7628 3.28873C17.0691 3.18665 17.4063 3.29199 17.6 3.55025L20.6 7.55025C20.8485 7.88162 20.7814 8.35172 20.45 8.60025C20.1186 8.84877 19.6485 8.78162 19.4 8.45025L17.75 6.25025V20.0002C17.75 20.4145 17.4142 20.7502 17 20.7502C16.5858 20.7502 16.25 20.4145 16.25 20.0002V4.00025C16.25 3.67742 16.4566 3.39082 16.7628 3.28873ZM3.25 8.00025C3.25 7.58603 3.58579 7.25025 4 7.25025H13C13.4142 7.25025 13.75 7.58603 13.75 8.00025C13.75 8.41446 13.4142 8.75025 13 8.75025H4C3.58579 8.75025 3.25 8.41446 3.25 8.00025ZM5.25 13.0002C5.25 12.586 5.58579 12.2502 6 12.2502H13C13.4142 12.2502 13.75 12.586 13.75 13.0002C13.75 13.4145 13.4142 13.7502 13 13.7502H6C5.58579 13.7502 5.25 13.4145 5.25 13.0002ZM7.25 18.0002C7.25 17.586 7.58579 17.2502 8 17.2502H13C13.4142 17.2502 13.75 17.586 13.75 18.0002C13.75 18.4145 13.4142 18.7502 13 18.7502H8C7.58579 18.7502 7.25 18.4145 7.25 18.0002Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

// Keywords for search and categorization
(IconSortFromBottomToTop as IconComponent).keywords = [
  "sort",
  "from",
  "bottom",
  "to",
  "top",
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
  "ass",
  "bed",
  "backside",
  "underside",
  "undersurface",
  "penetrate",
  "derriere",
  "fathom",
  "seat",
  "square-toed",
  "pointed-toe",
  "pointy-toed",
  "squared-toe",
  "eap",
  "pae",
  "efp",
  "css",
  "tcs",
  "upper side",
  "upside",
  "elevation",
  "uppermost",
  "height",
  "pinnacle",
  "peak",
  "upper",
  "topmost",
];

export default IconSortFromBottomToTop as IconComponent;
