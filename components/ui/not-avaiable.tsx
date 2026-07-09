interface UnavailableProps {
  title?: string;
  prefix?: string;
}
const Unavailable = ({ title = "unavailable", prefix }: UnavailableProps) => {
  return (
    <div className="text-xs text-muted-foreground italic">
      {prefix && <span className="font-medium">{prefix}</span>}
      {title}
    </div>
  );
};

export default Unavailable;
