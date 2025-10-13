import { FC } from "react";

const IconBank: FC<IconProps> = ({
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
            d="M13.0399 2.14984L22.0399 5.74982C22.3899 5.88982 22.6699 6.30981 22.6699 6.67981V9.99982C22.6699 10.5498 22.2199 10.9998 21.6699 10.9998H3.66992C3.11992 10.9998 2.66992 10.5498 2.66992 9.99982V6.67981C2.66992 6.30981 2.94993 5.88982 3.29993 5.74982L12.2999 2.14984C12.4999 2.06984 12.8399 2.06984 13.0399 2.14984Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22.6699 22H2.66992V19C2.66992 18.45 3.11992 18 3.66992 18H21.6699C22.2199 18 22.6699 18.45 22.6699 19V22Z"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M4.66992 18V11"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M8.66992 18V11"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.6699 18V11"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M16.6699 18V11"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M20.6699 18V11"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1.66992 22H23.6699"
            stroke="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.6699 8.5C13.4983 8.5 14.1699 7.82843 14.1699 7C14.1699 6.17157 13.4983 5.5 12.6699 5.5C11.8415 5.5 11.1699 6.17157 11.1699 7C11.1699 7.82843 11.8415 8.5 12.6699 8.5Z"
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
            d="M22.6699 19V22H2.66992V19C2.66992 18.45 3.11992 18 3.66992 18H21.6699C22.2199 18 22.6699 18.45 22.6699 19Z"
            fill="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity={duotone ? "0.6" : "1"}
            d="M8.66992 11H4.66992V18H8.66992V11Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M12.6699 11H8.66992V18H12.6699V11Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.6" : "1"}
            d="M16.6699 11H12.6699V18H16.6699V11Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.4" : "1"}
            d="M20.6699 11H16.6699V18H20.6699V11Z"
            fill="currentColor"
          />
          <path
            d="M23.6699 22.75H1.66992C1.25992 22.75 0.919922 22.41 0.919922 22C0.919922 21.59 1.25992 21.25 1.66992 21.25H23.6699C24.0799 21.25 24.4199 21.59 24.4199 22C24.4199 22.41 24.0799 22.75 23.6699 22.75Z"
            fill="currentColor"
          />
          <path
            d="M22.0399 5.74982L13.0399 2.14984C12.8399 2.06984 12.4999 2.06984 12.2999 2.14984L3.29993 5.74982C2.94993 5.88982 2.66992 6.29981 2.66992 6.67981V9.99982C2.66992 10.5498 3.11992 10.9998 3.66992 10.9998H21.6699C22.2199 10.9998 22.6699 10.5498 22.6699 9.99982V6.67981C22.6699 6.29981 22.3899 5.88982 22.0399 5.74982ZM12.6699 8.49982C11.8399 8.49982 11.1699 7.82982 11.1699 6.99982C11.1699 6.16982 11.8399 5.49982 12.6699 5.49982C13.4999 5.49982 14.1699 6.16982 14.1699 6.99982C14.1699 7.82982 13.4999 8.49982 12.6699 8.49982Z"
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
            d="M22.6699 19V22H2.66992V19C2.66992 18.45 3.11992 18 3.66992 18H21.6699C22.2199 18 22.6699 18.45 22.6699 19Z"
            fill="currentColor"
            strokeWidth={width}
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M7.66992 11H5.66992V18H7.66992V11Z" fill="currentColor" />
          <path d="M11.6699 11H9.66992V18H11.6699V11Z" fill="currentColor" />
          <path d="M15.6699 11H13.6699V18H15.6699V11Z" fill="currentColor" />
          <path d="M19.6699 11H17.6699V18H19.6699V11Z" fill="currentColor" />
          <path
            d="M23.6699 22.75H1.66992C1.25992 22.75 0.919922 22.41 0.919922 22C0.919922 21.59 1.25992 21.25 1.66992 21.25H23.6699C24.0799 21.25 24.4199 21.59 24.4199 22C24.4199 22.41 24.0799 22.75 23.6699 22.75Z"
            fill="currentColor"
          />
          <path
            d="M22.0399 5.74984L13.0399 2.14984C12.8399 2.06984 12.4999 2.06984 12.2999 2.14984L3.29992 5.74984C2.94992 5.88984 2.66992 6.29984 2.66992 6.67984V9.99984C2.66992 10.5498 3.11992 10.9998 3.66992 10.9998H21.6699C22.2199 10.9998 22.6699 10.5498 22.6699 9.99984V6.67984C22.6699 6.29984 22.3899 5.88984 22.0399 5.74984ZM12.6699 8.49984C11.8399 8.49984 11.1699 7.82984 11.1699 6.99984C11.1699 6.16984 11.8399 5.49984 12.6699 5.49984C13.4999 5.49984 14.1699 6.16984 14.1699 6.99984C14.1699 7.82984 13.4999 8.49984 12.6699 8.49984Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

// Keywords for search and categorization
(IconBank as IconComponent).keywords = [
  "bank",
  "savings bank",
  "money box",
  "swear",
  "rely",
  "trust",
  "cant",
  "camber",
  "deposit",
  "bank building",
];

export default IconBank as IconComponent;
