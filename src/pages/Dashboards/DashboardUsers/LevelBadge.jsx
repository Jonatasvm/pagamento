export const LevelBadge = ({ level }) => {
  const isAdministrator = level.toLowerCase() === "administrador";
  const className = isAdministrator
    ? "bg-purple-100 text-purple-800 font-bold"
    : "bg-green-100 text-green-800 font-medium";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${className}`}
    >
      {level}
    </span>
  );
};
