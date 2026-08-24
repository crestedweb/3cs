export default function Counter({ icon, target, suffix, label, visible }) {
  const value = visible ? target : 0;

  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-n">{value}{suffix}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}
