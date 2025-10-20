import { FC } from "react";

const IconAltArrowLeft: FC<IconProps> = ({
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
            d="M15 5L9 12L15 19"
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
            d="M11.5956 8.30273L8.16485 11.6296C7.94505 11.8428 7.94505 12.1573 8.16485 12.3704L14.7953 18.8001C15.2091 19.2013 16 18.9581 16 18.4297V12.7071L11.5956 8.30273Z"
            fill="currentColor"
          />
          <path
            opacity={duotone ? "0.5" : "1"}
            d="M15.9999 11.2929L15.9999 5.5703C15.9999 5.04189 15.2089 4.79869 14.7952 5.1999L12.3135 7.60648L15.9999 11.2929Z"
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
            d="M8.16485 11.6296L14.7953 5.1999C15.2091 4.79869 16 5.04189 16 5.5703L16 18.4297C16 18.9581 15.2091 19.2013 14.7953 18.8001L8.16485 12.3704C7.94505 12.1573 7.94505 11.8427 8.16485 11.6296Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconAltArrowLeft;
