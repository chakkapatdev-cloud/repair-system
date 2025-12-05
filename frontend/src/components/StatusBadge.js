import React from 'react';
import { FiClock, FiCheck, FiTool, FiX, FiInbox } from 'react-icons/fi';

export const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { label: 'รอดำเนินการ', icon: <FiClock />, className: 'status-pending' },
        accepted: { label: 'รับเรื่องแล้ว', icon: <FiCheck />, className: 'status-accepted' },
        in_progress: { label: 'กำลังดำเนินการ', icon: <FiTool />, className: 'status-in_progress' },
        completed: { label: 'เสร็จสิ้น', icon: <FiCheck />, className: 'status-completed' },
        cancelled: { label: 'ยกเลิก', icon: <FiX />, className: 'status-cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`status-badge ${config.className}`}>
            {config.icon} {config.label}
        </span>
    );
};

export const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
        low: { label: 'ต่ำ', className: 'priority-low' },
        medium: { label: 'ปกติ', className: 'priority-medium' },
        high: { label: 'สูง', className: 'priority-high' },
        urgent: { label: 'ฉุกเฉิน', className: 'priority-urgent' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
        <span className={`priority-badge ${config.className}`}>
            {config.label}
        </span>
    );
};

export const CategoryBadge = ({ name, color }) => {
    return (
        <span 
            className="badge" 
            style={{ 
                backgroundColor: color || '#6c757d',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px'
            }}
        >
            {name}
        </span>
    );
};

export const EmptyState = ({ icon = <FiInbox />, title, message }) => {
    return (
        <div className="empty-state">
            {icon}
            <h4>{title || 'ไม่มีข้อมูล'}</h4>
            <p>{message || 'ยังไม่มีรายการที่จะแสดง'}</p>
        </div>
    );
};

export const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <div className="spinner"></div>
        </div>
    );
};
