import { useState } from 'react';
import '../styles/components.css';

interface StudentNameModalProps {
    onSubmit: (name: string) => void;
}

const StudentNameModal = ({ onSubmit }: StudentNameModalProps) => {
    const [name, setName] = useState('');

    const canSubmit = name.trim().length >= 2;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit(name.trim());
    };

    return (
        <div className="modal-overlay">
            <form className="modal" onSubmit={handleSubmit}>
                <div className="modal__icon">🎓</div>
                <h2 className="modal__title">Welcome!</h2>
                <p className="modal__subtitle">Enter your name to join the polling session</p>
                <input
                    className="modal__input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    maxLength={50}
                />
                <button type="submit" className="modal__submit" disabled={!canSubmit}>
                    Join Session
                </button>
            </form>
        </div>
    );
};

export default StudentNameModal;
