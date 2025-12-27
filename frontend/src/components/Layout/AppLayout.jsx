import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      
      {/* Ambient background effects */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
      </div>
      
      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          background: #030712;
          position: relative;
        }
        
        .app-main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
          z-index: 1;
          transition: margin-left 0.3s ease;
        }
        
        .app-content {
          flex: 1;
          padding: 1.5rem 2rem 2rem;
          overflow-x: hidden;
        }
        
        /* Ambient background effects */
        .ambient-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          animation: float 20s ease-in-out infinite;
        }
        
        .orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          top: -200px;
          right: -200px;
          animation-delay: 0s;
        }
        
        .orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          bottom: -150px;
          left: 30%;
          animation-delay: -7s;
        }
        
        .orb-3 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          top: 40%;
          left: -100px;
          animation-delay: -14s;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        
        /* Handle collapsed sidebar */
        @media (max-width: 768px) {
          .app-main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
