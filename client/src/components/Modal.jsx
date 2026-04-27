import { useEffect } from 'react'

/**
 * Modal — Reusable overlay dialog component.
 * Used across all dashboards for issue details, confirmations, etc.
 * Locks body scroll when open, closes on backdrop click.
 * 
 * @param {boolean} isOpen    - Controls visibility
 * @param {Function} onClose  - Called when user clicks close or backdrop
 * @param {string} title      - Dialog title shown in header
 * @param {ReactNode} children - Dialog body content
 * @param {ReactNode} footer  - Optional footer (e.g. confirm/cancel buttons)
 * @param {number} maxWidth   - Max width in px (default: 520)
 */
export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 520 }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
