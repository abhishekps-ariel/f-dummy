import React, { useState } from 'react';

const NotificationDropdown = () => {
  const [unreadCount] = useState(2); // This would come from props or API
  const [notifications] = useState([
    {
      id: 1,
      message: "Profile settings updated successfully.",
      time: "1 hour ago",
      icon: "bi-gear-fill",
      unread: true
    },
    {
      id: 2,
      message: "Profile settings updated successfully.",
      time: "1 hour ago",
      icon: "bi-gear-fill",
      unread: true
    },
    {
      id: 3,
      message: "Profile settings updated successfully.",
      time: "1 hour ago",
      icon: "bi-gear-fill",
      unread: false
    },
    {
      id: 4,
      message: "Profile settings updated successfully.",
      time: "1 hour ago",
      icon: "bi-gear-fill",
      unread: false
    },
    {
      id: 5,
      message: "Profile settings updated successfully.",
      time: "1 hour ago",
      icon: "bi-gear-fill",
      unread: false
    }
  ]);

  return (
    <div className="btn-group">
      <button 
        type="button" 
        className="btn bg-none border-0 shadow-none dashboard-notification new-alert" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
      >
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && <span className="notif-circle"></span>}
      </button>
      <ul className="dropdown-menu theme-dropdown notification-dropdown">
        <li>
          <h6 className="dropdown-header notification-header">
            <i className="fa-solid fa-bell me-2"></i> 
            Notifications (<span id="unreadCountDisplay">{unreadCount}</span> Unread)
          </h6>
        </li>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <a className="dropdown-item" href="#">
              <i className={`bi ${notification.icon} text-secondary notification-item-icon`}></i>
              <div className="notification-item-text">
                {notification.message}
                <small>{notification.time}</small>
              </div>
            </a>
          </li>
        ))}
        <li><hr className="dropdown-divider my-0" /></li>
        <li>
          <a className="dropdown-item justify-content-center fw-medium" href="#">
            View all
          </a>
        </li>
      </ul>
    </div>
  );
};

export default NotificationDropdown;
