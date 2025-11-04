import { FC } from "react";

const IconClose: FC<IconProps> = ({
  className,
  fill = false,
  duotone = false,
  width = "1.5",
  onClick,
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
          onClick={onClick}
        >
          <path
            opacity={duotone ? "0.5" : "1"}
            d="M7.75732 7.75732L16.2426 16.2426"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.75739 16.2426L16.2427 7.75732"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
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
            opacity={duotone ? "0.5" : "1"}
            d="M15.7122 16.773L7.22687 8.28777C6.93696 7.99785 6.93696 7.51702 7.22687 7.22711C7.51679 6.93719 7.99762 6.93719 8.28753 7.22711L16.7728 15.7124C17.0627 16.0023 17.0627 16.4831 16.7728 16.773C16.4829 17.063 16.0021 17.063 15.7122 16.773Z"
            fill="currentColor"
          />
          <path
            d="M7.22706 16.773C6.93715 16.4831 6.93715 16.0023 7.22706 15.7124L15.7123 7.22711C16.0023 6.93719 16.4831 6.93719 16.773 7.22711C17.0629 7.51702 17.0629 7.99785 16.773 8.28777L8.28772 16.773C7.99781 17.063 7.51698 17.063 7.22706 16.773Z"
            fill="currentColor"
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
            d="M15.7122 16.773L7.22687 8.28777C6.93696 7.99785 6.93696 7.51702 7.22687 7.22711C7.51679 6.93719 7.99762 6.93719 8.28753 7.22711L16.7728 15.7124C17.0627 16.0023 17.0627 16.4831 16.7728 16.773C16.4829 17.063 16.0021 17.063 15.7122 16.773Z"
            fill="currentColor"
          />
          <path
            d="M7.22706 16.773C6.93715 16.4831 6.93715 16.0023 7.22706 15.7124L15.7123 7.22711C16.0023 6.93719 16.4831 6.93719 16.773 7.22711C17.0629 7.51702 17.0629 7.99785 16.773 8.28777L8.28772 16.773C7.99781 17.063 7.51698 17.063 7.22706 16.773Z"
            fill="currentColor"
          />
        </svg>
      )}
    </>
  );
};

export default IconClose;
