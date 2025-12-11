import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/dashboard" className="brand-link">
            <div className="brand-logo"></div>
            <span className="brand-text">ExpenseTracker</span>
          </Link>
        </div>
        
        <div className="nav-menu">
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/groups" 
            className={`nav-link ${location.pathname === '/groups' ? 'active' : ''}`}
          >
            My Groups
          </Link>
        </div>
        
        <div className="nav-user">
          <span className="user-greeting">Welcome, {user.name}</span>
          <button
            onClick={onLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: white;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid #e5e7eb;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: inherit;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 8px;
          position: relative;
        }

        .brand-logo::before {
          content: '$';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          font-size: 1rem;
        }

        .brand-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .nav-menu {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 0;
          position: relative;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #374151;
        }

        .nav-link.active {
          color: #3b82f6;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #3b82f6;
          border-radius: 1px;
          animation: slideIn 0.3s ease-out;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-greeting {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .logout-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        @keyframes slideIn {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            height: auto;
            padding: 1rem;
            gap: 1rem;
          }

          .nav-menu {
            gap: 1rem;
          }

          .user-greeting {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;