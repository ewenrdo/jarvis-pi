import React from 'react';

export default function PdaCard({
  focused = false,
  locked = false,
  className = '',
  style,
  onClick,
  title,
  icon,
  headerRight,
  headerStyle,
  bodyStyle,
  children
}) {
  const cardClassName = [`pda-card`, focused ? 'focused' : '', locked ? 'locked-card' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClassName} onClick={onClick} style={style}>
      <div className="card-header" style={headerStyle}>
        <h2>{title}</h2>
        {headerRight ?? <span className="icon">{icon}</span>}
      </div>
      <div className="card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}