import { useState, useRef, useEffect } from "react";

function NotificationBell({ metrics }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { label: `${metrics.pending} Pending Reviews`, tone: "pending", show: metrics.pending > 0 },
    { label: `${metrics.high_risk} High Risk Returns`, tone: "rejected", show: metrics.high_risk > 0 },
    { label: `${metrics.ai_suggested} AI-Suggested, Awaiting Confirmation`, tone: "total", show: metrics.ai_suggested > 0 },
  ].filter((i) => i.show);

  return (
    <div className="notification-wrapper" ref={ref}>
      <button className="notification-bell" onClick={() => setOpen((o) => !o)} title="Notifications">
        🔔
        {items.length > 0 && <span className="notification-dot">{items.length}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">Notifications</div>
          {items.length === 0 ? (
            <div className="notification-empty">You're all caught up 🎉</div>
          ) : (
            items.map((item, i) => (
              <div key={i} className={`notification-item notification-${item.tone}`}>
                {item.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
