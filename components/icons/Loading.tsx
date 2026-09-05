import { FC } from "react";

interface IconProps {
  className?: string;
  fill?: boolean;
  duotone?: boolean;
  width?: string | number;
}

const IconLoading: FC<IconProps> = ({
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
            d="M12 3V6"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12 18V21"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M21 12L18 12"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            d="M6 12L3 12"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M18.3635 5.63672L16.2422 7.75804"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            d="M7.75804 16.2422L5.63672 18.3635"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M18.3635 18.3635L16.2422 16.2422"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
          />
          <path
            d="M7.75804 7.75804L5.63672 5.63672"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
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
            d="M12 2C12.5523 2 13 2.44772 13 3V6C13 6.55228 12.5523 7 12 7C11.4477 7 11 6.55228 11 6V3C11 2.44772 11.4477 2 12 2Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 17C12.5523 17 13 17.4477 13 18V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V18C11 17.4477 11.4477 17 12 17Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17 12C17 11.4477 17.4477 11 18 11L21 11C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H18C17.4477 13 17 12.5523 17 12Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2 12C2 11.4477 2.44772 11 3 11L6 11C6.55228 11 7 11.4477 7 12C7 12.5523 6.55228 13 6 13H3C2.44772 13 2 12.5523 2 12Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.0706 4.92961C19.4611 5.32014 19.4611 5.9533 19.0706 6.34383L16.9493 8.46515C16.5588 8.85567 15.9256 8.85567 15.5351 8.46515C15.1446 8.07462 15.1446 7.44146 15.5351 7.05093L17.6564 4.92961C18.0469 4.53909 18.6801 4.53909 19.0706 4.92961Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.46515 15.5351C8.85567 15.9256 8.85567 16.5588 8.46515 16.9493L6.34383 19.0706C5.9533 19.4611 5.32014 19.4611 4.92961 19.0706C4.53909 18.6801 4.53909 18.0469 4.92961 17.6564L7.05093 15.5351C7.44146 15.1446 8.07462 15.1446 8.46515 15.5351Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.5351 15.5351C15.9256 15.1446 16.5588 15.1446 16.9493 15.5351L19.0706 17.6564C19.4611 18.0469 19.4611 18.6801 19.0706 19.0706C18.6801 19.4611 18.0469 19.4611 17.6564 19.0706L15.5351 16.9493C15.1446 16.5588 15.1446 15.9256 15.5351 15.5351Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.92961 4.92961C5.32014 4.53909 5.9533 4.53909 6.34383 4.92961L8.46515 7.05093C8.85567 7.44146 8.85567 8.07462 8.46515 8.46515C8.07462 8.85567 7.44146 8.85567 7.05093 8.46515L4.92961 6.34383C4.53909 5.9533 4.53909 5.32014 4.92961 4.92961Z"
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
            d="M12 2C12.5523 2 13 2.44772 13 3V6C13 6.55228 12.5523 7 12 7C11.4477 7 11 6.55228 11 6V3C11 2.44772 11.4477 2 12 2Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 17C12.5523 17 13 17.4477 13 18V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V18C11 17.4477 11.4477 17 12 17Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17 12C17 11.4477 17.4477 11 18 11L21 11C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H18C17.4477 13 17 12.5523 17 12Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2 12C2 11.4477 2.44772 11 3 11L6 11C6.55228 11 7 11.4477 7 12C7 12.5523 6.55228 13 6 13H3C2.44772 13 2 12.5523 2 12Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.0706 4.92961C19.4611 5.32014 19.4611 5.9533 19.0706 6.34383L16.9493 8.46515C16.5588 8.85567 15.9256 8.85567 15.5351 8.46515C15.1446 8.07462 15.1446 7.44146 15.5351 7.05093L17.6564 4.92961C18.0469 4.53909 18.6801 4.53909 19.0706 4.92961Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.46515 15.5351C8.85567 15.9256 8.85567 16.5588 8.46515 16.9493L6.34383 19.0706C5.9533 19.4611 5.32014 19.4611 4.92961 19.0706C4.53909 18.6801 4.53909 18.0469 4.92961 17.6564L7.05093 15.5351C7.44146 15.1446 8.07462 15.1446 8.46515 15.5351Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.5351 15.5351C15.9256 15.1446 16.5588 15.1446 16.9493 15.5351L19.0706 17.6564C19.4611 18.0469 19.4611 18.6801 19.0706 19.0706C18.6801 19.4611 18.0469 19.4611 17.6564 19.0706L15.5351 16.9493C15.1446 16.5588 15.1446 15.9256 15.5351 15.5351Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.92961 4.92961C5.32014 4.53909 5.9533 4.53909 6.34383 4.92961L8.46515 7.05093C8.85567 7.44146 8.85567 8.07462 8.46515 8.46515C8.07462 8.85567 7.44146 8.85567 7.05093 8.46515L4.92961 6.34383C4.53909 5.9533 4.53909 5.32014 4.92961 4.92961Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconLoading;
