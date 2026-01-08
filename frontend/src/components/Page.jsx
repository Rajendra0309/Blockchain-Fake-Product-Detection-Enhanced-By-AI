import React from 'react'

export function Page({ title, description, children, right }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <div>
              <h1 className="page-title">{title}</h1>
              {description && <p className="page-description">{description}</p>}
            </div>
            {right && <div className="page-actions">{right}</div>}
          </div>
        </div>
      </div>
      <div className="page-content">
        <div className="container">
          {children}
        </div>
      </div>
    </div>
  )
}

export function SectionCard({ title, actions, children, footer, variant = "default" }) {
  return (
    <div className={`section-card ${variant}`}>
      {(title || actions) && (
        <div className="section-card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="section-card-title">{title}</h5>
            {actions && <div className="section-card-actions">{actions}</div>}
          </div>
        </div>
      )}
      <div className="section-card-body">
        {children}
      </div>
      {footer && <div className="section-card-footer">{footer}</div>}
    </div>
  )
}

export function EmptyState({ message, icon = "📭", action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-message">{message}</div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
